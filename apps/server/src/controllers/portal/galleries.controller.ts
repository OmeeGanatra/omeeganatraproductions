import type { Request, Response, NextFunction } from "express";
import { prisma } from "@ogp/db";
import { comparePassword } from "../../utils/password.js";
import {
  generateGallerySessionToken,
  verifyGallerySessionToken,
} from "../../utils/jwt.js";
import { parsePagination, paginatedResponse } from "../../utils/pagination.js";
import { AppError } from "../../middleware/errorHandler.js";
import { env } from "../../config/env.js";

const GALLERY_SESSION_HEADER = "x-gallery-session";

async function verifyClientAccessToGallery(
  clientId: string,
  galleryId: string
): Promise<{ projectId: string } | null> {
  const gallery = await prisma.gallery.findUnique({
    where: { id: galleryId },
    select: { projectId: true },
  });
  if (!gallery) return null;

  const access = await prisma.projectClient.findUnique({
    where: {
      projectId_clientId: { projectId: gallery.projectId, clientId },
    },
  });
  return access ? { projectId: gallery.projectId } : null;
}

export async function getGalleryMedia(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const clientId = req.user!.id;
    const galleryId = req.params.id;

    const access = await verifyClientAccessToGallery(clientId, galleryId);
    if (!access) {
      throw new AppError("Access denied", 403);
    }

    const gallery = await prisma.gallery.findUnique({
      where: { id: galleryId },
      select: {
        id: true,
        title: true,
        status: true,
        watermarkEnabled: true,
        downloadEnabled: true,
        passwordHash: true,
        expiresAt: true,
      },
    });

    if (!gallery || gallery.status !== "PUBLISHED") {
      throw new AppError("Gallery not found or not published", 404);
    }

    if (gallery.expiresAt && gallery.expiresAt < new Date()) {
      throw new AppError("This gallery has expired", 410);
    }

    if (gallery.passwordHash) {
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

    const { skip, take, page, limit } = parsePagination(req.query);

    const where = { galleryId };

    const [media, total] = await Promise.all([
      prisma.mediaItem.findMany({
        where,
        skip,
        take,
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          type: true,
          filenameOriginal: true,
          storageKeyThumbnail: true,
          storageKeyMedium: true,
          storageKeyWatermarked: true,
          width: true,
          height: true,
          blurhash: true,
          sortOrder: true,
          isHighlight: true,
        },
      }),
      prisma.mediaItem.count({ where }),
    ]);

    const cfDomain = env.AWS_CLOUDFRONT_DOMAIN;
    const mapped = media.map((m) => ({
      id: m.id,
      type: m.type,
      filenameOriginal: m.filenameOriginal,
      width: m.width,
      height: m.height,
      blurhash: m.blurhash,
      sortOrder: m.sortOrder,
      isHighlight: m.isHighlight,
      thumbnailUrl: m.storageKeyThumbnail
        ? `https://${cfDomain}/${m.storageKeyThumbnail}`
        : null,
      displayUrl:
        gallery.watermarkEnabled && m.storageKeyWatermarked
          ? `https://${cfDomain}/${m.storageKeyWatermarked}`
          : `https://${cfDomain}/${m.storageKeyMedium}`,
    }));

    res.json(paginatedResponse(mapped, total, page, limit));
  } catch (err) {
    next(err);
  }
}

export async function getGalleryDetail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const clientId = req.user!.id;
    const galleryId = req.params.id;

    const access = await verifyClientAccessToGallery(clientId, galleryId);
    if (!access) {
      throw new AppError("Access denied", 403);
    }

    const gallery = await prisma.gallery.findUnique({
      where: { id: galleryId },
      select: {
        id: true,
        projectId: true,
        title: true,
        slug: true,
        coverImageUrl: true,
        mediaCount: true,
        status: true,
        downloadEnabled: true,
        watermarkEnabled: true,
        sortOrder: true,
        createdAt: true,
      },
    });

    if (!gallery || gallery.status !== "PUBLISHED") {
      throw new AppError("Gallery not found or not published", 404);
    }

    res.json(gallery);
  } catch (err) {
    next(err);
  }
}

export async function verifyPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const clientId = req.user!.id;
    const galleryId = req.params.id;
    const { password } = req.body as { password: string };

    const access = await verifyClientAccessToGallery(clientId, galleryId);
    if (!access) {
      throw new AppError("Access denied", 403);
    }

    const gallery = await prisma.gallery.findUnique({
      where: { id: galleryId },
      select: { passwordHash: true },
    });

    if (!gallery || !gallery.passwordHash) {
      throw new AppError("Gallery does not require a password", 400);
    }

    const valid = await comparePassword(password, gallery.passwordHash);
    if (!valid) {
      throw new AppError("Incorrect password", 401);
    }

    const sessionToken = generateGallerySessionToken(galleryId, clientId);

    res.json({
      verified: true,
      sessionToken,
      expiresInSeconds: 4 * 60 * 60,
    });
  } catch (err) {
    next(err);
  }
}
