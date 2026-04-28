import type { Request, Response, NextFunction } from "express";
import { prisma } from "@ogp/db";
import { Queue } from "bullmq";
import { generateDownloadUrl } from "../../utils/s3.js";
import { verifyGallerySessionToken } from "../../utils/jwt.js";
import { AppError } from "../../middleware/errorHandler.js";
import { redis } from "../../config/redis.js";

const zipQueue = new Queue("zip-generation", { connection: redis });

const GALLERY_SESSION_HEADER = "x-gallery-session";

async function ensureGalleryPasswordSession(
  req: Request,
  galleryId: string,
  clientId: string,
  passwordHash: string | null
): Promise<void> {
  if (!passwordHash) return;
  const sessionToken = req.headers[GALLERY_SESSION_HEADER];
  const valid =
    typeof sessionToken === "string" &&
    verifyGallerySessionToken(sessionToken, galleryId, clientId);
  if (!valid) {
    throw new AppError("Gallery password verification required", 403, {
      code: "GALLERY_PASSWORD_REQUIRED",
    });
  }
}

export async function getDownloadUrl(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const clientId = req.user!.id;
    const mediaId = req.params.id;

    const media = await prisma.mediaItem.findUnique({
      where: { id: mediaId },
      include: {
        gallery: {
          select: {
            id: true,
            downloadEnabled: true,
            projectId: true,
            passwordHash: true,
            status: true,
            expiresAt: true,
          },
        },
      },
    });

    if (!media) {
      throw new AppError("Media item not found", 404);
    }

    if (media.gallery.status !== "PUBLISHED") {
      throw new AppError("Gallery not available", 404);
    }

    if (media.gallery.expiresAt && media.gallery.expiresAt < new Date()) {
      throw new AppError("This gallery has expired", 410);
    }

    if (!media.gallery.downloadEnabled) {
      throw new AppError("Downloads are disabled for this gallery", 403);
    }

    const access = await prisma.projectClient.findUnique({
      where: {
        projectId_clientId: {
          projectId: media.gallery.projectId,
          clientId,
        },
      },
    });

    if (!access) {
      throw new AppError("Access denied", 403);
    }

    await ensureGalleryPasswordSession(
      req,
      media.gallery.id,
      clientId,
      media.gallery.passwordHash
    );

    const downloadUrl = await generateDownloadUrl(
      media.storageKeyOriginal,
      media.filenameOriginal
    );

    await prisma.downloadLog.create({
      data: {
        clientId,
        mediaItemId: mediaId,
        galleryId: media.galleryId,
        downloadType: "SINGLE",
        fileCount: 1,
        totalSizeBytes: media.fileSizeBytes,
        ipAddress:
          (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
          req.ip ||
          null,
        userAgent: req.headers["user-agent"] || null,
      },
    });

    res.json({ downloadUrl });
  } catch (err) {
    next(err);
  }
}

export async function requestZipDownload(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const clientId = req.user!.id;
    const galleryId = req.params.id;
    const { mediaIds } = req.body as { mediaIds?: string[] };

    const gallery = await prisma.gallery.findUnique({
      where: { id: galleryId },
      select: {
        id: true,
        downloadEnabled: true,
        projectId: true,
        title: true,
        passwordHash: true,
        status: true,
        expiresAt: true,
      },
    });

    if (!gallery) {
      throw new AppError("Gallery not found", 404);
    }

    if (gallery.status !== "PUBLISHED") {
      throw new AppError("Gallery not available", 404);
    }

    if (gallery.expiresAt && gallery.expiresAt < new Date()) {
      throw new AppError("This gallery has expired", 410);
    }

    if (!gallery.downloadEnabled) {
      throw new AppError("Downloads are disabled for this gallery", 403);
    }

    const access = await prisma.projectClient.findUnique({
      where: {
        projectId_clientId: { projectId: gallery.projectId, clientId },
      },
    });

    if (!access) {
      throw new AppError("Access denied", 403);
    }

    await ensureGalleryPasswordSession(
      req,
      gallery.id,
      clientId,
      gallery.passwordHash
    );

    // If specific mediaIds were requested, verify every one of them belongs
    // to this gallery. Without this check, a client with access to gallery A
    // could download media from gallery B by guessing UUIDs.
    let resolvedMediaIds: string[] | null = null;
    if (mediaIds && mediaIds.length > 0) {
      const matching = await prisma.mediaItem.findMany({
        where: {
          id: { in: mediaIds },
          galleryId,
        },
        select: { id: true },
      });

      if (matching.length !== mediaIds.length) {
        throw new AppError(
          "One or more media items do not belong to this gallery",
          403
        );
      }
      resolvedMediaIds = matching.map((m) => m.id);
    }

    const job = await zipQueue.add(
      "generate-zip",
      {
        clientId,
        galleryId,
        projectId: gallery.projectId,
        galleryTitle: gallery.title,
        mediaItemIds: resolvedMediaIds,
      },
      {
        attempts: 2,
        backoff: { type: "exponential", delay: 10000 },
      }
    );

    res.json({
      message:
        "ZIP download is being prepared. You will receive a notification when it is ready.",
      jobId: job.id,
    });
  } catch (err) {
    next(err);
  }
}
