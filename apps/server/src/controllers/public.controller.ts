import type { Request, Response, NextFunction } from "express";
import { prisma } from "@ogp/db";
import { comparePassword } from "../utils/password.js";
import { parsePagination, paginatedResponse } from "../utils/pagination.js";
import { AppError } from "../middleware/errorHandler.js";
import { env } from "../config/env.js";

export async function resolveShareLink(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.params;

    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        gallery: {
          select: {
            id: true,
            title: true,
            description: true,
            coverImageUrl: true,
            mediaCount: true,
            status: true,
            passwordHash: true,
            project: {
              select: {
                id: true,
                title: true,
                eventDate: true,
                eventType: true,
                venue: true,
                city: true,
              },
            },
          },
        },
      },
    });

    if (!shareLink) {
      throw new AppError("Share link not found", 404);
    }

    if (!shareLink.isActive) {
      throw new AppError("This share link has been deactivated", 410);
    }

    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      throw new AppError("This share link has expired", 410);
    }

    if (
      shareLink.maxViews !== null &&
      shareLink.viewCount >= shareLink.maxViews
    ) {
      throw new AppError("This share link has reached its maximum views", 410);
    }

    // Increment view count
    await prisma.shareLink.update({
      where: { id: shareLink.id },
      data: { viewCount: { increment: 1 } },
    });

    const gallery = shareLink.gallery;
    if (!gallery || gallery.status !== "PUBLISHED") {
      throw new AppError("Gallery not available", 404);
    }

    res.json({
      id: shareLink.id,
      allowDownload: shareLink.allowDownload,
      hasPassword: !!shareLink.passwordHash || !!gallery.passwordHash,
      gallery: {
        id: gallery.id,
        title: gallery.title,
        description: gallery.description,
        coverImageUrl: gallery.coverImageUrl,
        mediaCount: gallery.mediaCount,
        project: gallery.project,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function verifySharePassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      throw new AppError("Password is required", 400);
    }

    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        gallery: {
          select: { passwordHash: true },
        },
      },
    });

    if (!shareLink) {
      throw new AppError("Share link not found", 404);
    }

    if (!shareLink.isActive) {
      throw new AppError("This share link has been deactivated", 410);
    }

    // Check share link password first, then gallery password
    const hashToCheck =
      shareLink.passwordHash || shareLink.gallery?.passwordHash;

    if (!hashToCheck) {
      // No password required
      res.json({ verified: true });
      return;
    }

    const valid = await comparePassword(password, hashToCheck);
    if (!valid) {
      throw new AppError("Incorrect password", 401);
    }

    res.json({ verified: true });
  } catch (err) {
    next(err);
  }
}

export async function getShareMedia(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.params;

    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        gallery: {
          select: {
            id: true,
            status: true,
            watermarkEnabled: true,
          },
        },
      },
    });

    if (!shareLink) {
      throw new AppError("Share link not found", 404);
    }

    if (!shareLink.isActive) {
      throw new AppError("This share link has been deactivated", 410);
    }

    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      throw new AppError("This share link has expired", 410);
    }

    if (!shareLink.gallery || shareLink.gallery.status !== "PUBLISHED") {
      throw new AppError("Gallery not available", 404);
    }

    const { skip, take, page, limit } = parsePagination(req.query);

    const where = { galleryId: shareLink.gallery.id };

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
    const useWatermark = shareLink.gallery.watermarkEnabled;

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
        useWatermark && m.storageKeyWatermarked
          ? `https://${cfDomain}/${m.storageKeyWatermarked}`
          : `https://${cfDomain}/${m.storageKeyMedium}`,
    }));

    res.json({
      ...paginatedResponse(mapped, total, page, limit),
      allowDownload: shareLink.allowDownload,
    });
  } catch (err) {
    next(err);
  }
}
