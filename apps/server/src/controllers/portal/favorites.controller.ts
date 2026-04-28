import type { Request, Response, NextFunction } from "express";
import { prisma } from "@ogp/db";
import { parsePagination, paginatedResponse } from "../../utils/pagination.js";
import { AppError } from "../../middleware/errorHandler.js";
import { env } from "../../config/env.js";

export async function listFavorites(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const clientId = req.user!.id;
    const { skip, take, page, limit } = parsePagination(req.query);

    const where = { clientId };

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          mediaItem: {
            select: {
              id: true,
              type: true,
              filenameOriginal: true,
              storageKeyThumbnail: true,
              storageKeyMedium: true,
              width: true,
              height: true,
              blurhash: true,
              isHighlight: true,
              gallery: {
                select: {
                  id: true,
                  title: true,
                  project: {
                    select: { id: true, title: true, slug: true },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.favorite.count({ where }),
    ]);

    const cfDomain = env.AWS_CLOUDFRONT_DOMAIN;
    const mapped = favorites.map((f) => ({
      id: f.id,
      note: f.note,
      createdAt: f.createdAt,
      mediaItem: {
        ...f.mediaItem,
        thumbnailUrl: f.mediaItem.storageKeyThumbnail
          ? `https://${cfDomain}/${f.mediaItem.storageKeyThumbnail}`
          : null,
        displayUrl: f.mediaItem.storageKeyMedium
          ? `https://${cfDomain}/${f.mediaItem.storageKeyMedium}`
          : null,
        storageKeyThumbnail: undefined,
        storageKeyMedium: undefined,
      },
    }));

    res.json(paginatedResponse(mapped, total, page, limit));
  } catch (err) {
    next(err);
  }
}

export async function addFavorite(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const clientId = req.user!.id;
    const { mediaItemId, note } = req.body;

    if (!mediaItemId) {
      throw new AppError("Media item ID is required", 400);
    }

    // Verify the media belongs to a project the client has access to
    const media = await prisma.mediaItem.findUnique({
      where: { id: mediaItemId },
      select: { projectId: true },
    });

    if (!media) {
      throw new AppError("Media item not found", 404);
    }

    const access = await prisma.projectClient.findUnique({
      where: {
        projectId_clientId: { projectId: media.projectId, clientId },
      },
    });

    if (!access) {
      throw new AppError("Access denied", 403);
    }

    const existing = await prisma.favorite.findUnique({
      where: { clientId_mediaItemId: { clientId, mediaItemId } },
    });

    if (existing) {
      throw new AppError("Already favorited", 409);
    }

    const favorite = await prisma.favorite.create({
      data: {
        clientId,
        mediaItemId,
        note: note || null,
      },
    });

    res.status(201).json(favorite);
  } catch (err) {
    next(err);
  }
}

export async function removeFavorite(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const clientId = req.user!.id;
    const { mediaItemId } = req.params;

    const favorite = await prisma.favorite.findUnique({
      where: { clientId_mediaItemId: { clientId, mediaItemId } },
    });

    if (!favorite) {
      throw new AppError("Favorite not found", 404);
    }

    await prisma.favorite.delete({
      where: { id: favorite.id },
    });

    res.json({ message: "Favorite removed" });
  } catch (err) {
    next(err);
  }
}
