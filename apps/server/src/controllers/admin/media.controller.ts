import type { Request, Response, NextFunction } from "express";
import { prisma } from "@ogp/db";
import { v4 as uuidv4 } from "uuid";
import { Queue } from "bullmq";
import { generateUploadUrl, getStorageKey, deleteObject } from "../../utils/s3.js";
import { parsePagination, paginatedResponse } from "../../utils/pagination.js";
import { AppError } from "../../middleware/errorHandler.js";
import { redis } from "../../config/redis.js";

const mediaProcessingQueue = new Queue("media-processing", {
  connection: redis,
});

interface UploadRequest {
  filename: string;
  contentType: string;
  size: number;
}

export async function getUploadUrls(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { galleryId } = req.params;
    const files: UploadRequest[] = req.body.files;

    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new AppError("Files array is required", 400);
    }

    const gallery = await prisma.gallery.findUnique({
      where: { id: galleryId },
      select: { id: true, projectId: true },
    });
    if (!gallery) {
      throw new AppError("Gallery not found", 404);
    }

    const results = await Promise.all(
      files.map(async (file) => {
        const mediaId = uuidv4();
        const storageKey = getStorageKey(
          gallery.projectId,
          galleryId,
          mediaId,
          "originals",
          file.filename
        );

        const mediaType = file.contentType.startsWith("video/")
          ? "VIDEO"
          : "PHOTO";

        await prisma.mediaItem.create({
          data: {
            id: mediaId,
            galleryId,
            projectId: gallery.projectId,
            type: mediaType,
            filenameOriginal: file.filename,
            storageKeyOriginal: storageKey,
            storageKeyThumbnail: "", // Will be set after processing
            storageKeyMedium: "", // Will be set after processing
            fileSizeBytes: BigInt(file.size),
            mimeType: file.contentType,
            uploadedById: req.user!.id,
          },
        });

        const uploadUrl = await generateUploadUrl(storageKey, file.contentType);

        return {
          mediaId,
          uploadUrl,
          storageKey,
        };
      })
    );

    res.json({ uploads: results });
  } catch (err) {
    next(err);
  }
}

export async function confirmUpload(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { mediaIds } = req.body;

    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      throw new AppError("Media IDs array is required", 400);
    }

    const jobs = mediaIds.map((mediaId: string) => ({
      name: "process-media",
      data: { mediaItemId: mediaId },
      opts: {
        attempts: 3,
        backoff: { type: "exponential" as const, delay: 5000 },
      },
    }));

    await mediaProcessingQueue.addBulk(jobs);

    res.json({
      message: `${mediaIds.length} media items queued for processing`,
      mediaIds,
    });
  } catch (err) {
    next(err);
  }
}

export async function listMedia(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { galleryId } = req.params;
    const { skip, take, page, limit } = parsePagination(req.query);

    const gallery = await prisma.gallery.findUnique({
      where: { id: galleryId },
    });
    if (!gallery) {
      throw new AppError("Gallery not found", 404);
    }

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
          storageKeyOriginal: true,
          storageKeyThumbnail: true,
          storageKeyMedium: true,
          storageKeyWatermarked: true,
          width: true,
          height: true,
          fileSizeBytes: true,
          mimeType: true,
          blurhash: true,
          sortOrder: true,
          isHighlight: true,
          aiTags: true,
          createdAt: true,
        },
      }),
      prisma.mediaItem.count({ where }),
    ]);

    // Convert BigInt to string for JSON serialization
    const serialized = media.map((m) => ({
      ...m,
      fileSizeBytes: m.fileSizeBytes.toString(),
    }));

    res.json(paginatedResponse(serialized, total, page, limit));
  } catch (err) {
    next(err);
  }
}

export async function updateMedia(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const media = await prisma.mediaItem.findUnique({
      where: { id: req.params.id },
    });
    if (!media) {
      throw new AppError("Media item not found", 404);
    }

    const { sortOrder, isHighlight } = req.body;

    const updated = await prisma.mediaItem.update({
      where: { id: req.params.id },
      data: {
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isHighlight !== undefined && { isHighlight }),
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteMedia(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const media = await prisma.mediaItem.findUnique({
      where: { id: req.params.id },
    });
    if (!media) {
      throw new AppError("Media item not found", 404);
    }

    // Delete from S3
    const keysToDelete = [
      media.storageKeyOriginal,
      media.storageKeyThumbnail,
      media.storageKeyMedium,
      media.storageKeyWatermarked,
    ].filter(Boolean) as string[];

    await Promise.all(keysToDelete.map((key) => deleteObject(key)));

    // Update gallery counts
    await prisma.$transaction([
      prisma.mediaItem.delete({ where: { id: req.params.id } }),
      prisma.gallery.update({
        where: { id: media.galleryId },
        data: {
          mediaCount: { decrement: 1 },
          totalSizeBytes: { decrement: media.fileSizeBytes },
        },
      }),
    ]);

    res.json({ message: "Media item deleted" });
  } catch (err) {
    next(err);
  }
}

export async function batchDelete(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { mediaIds } = req.body;
    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      throw new AppError("Media IDs array is required", 400);
    }

    const mediaItems = await prisma.mediaItem.findMany({
      where: { id: { in: mediaIds } },
    });

    if (mediaItems.length === 0) {
      throw new AppError("No media items found", 404);
    }

    // Delete from S3
    const keysToDelete = mediaItems.flatMap((m) =>
      [
        m.storageKeyOriginal,
        m.storageKeyThumbnail,
        m.storageKeyMedium,
        m.storageKeyWatermarked,
      ].filter(Boolean) as string[]
    );

    await Promise.all(keysToDelete.map((key) => deleteObject(key)));

    // Group by gallery for count updates
    const galleryCounts = new Map<string, { count: number; bytes: bigint }>();
    for (const m of mediaItems) {
      const existing = galleryCounts.get(m.galleryId) || {
        count: 0,
        bytes: BigInt(0),
      };
      existing.count += 1;
      existing.bytes += m.fileSizeBytes;
      galleryCounts.set(m.galleryId, existing);
    }

    await prisma.$transaction([
      prisma.mediaItem.deleteMany({ where: { id: { in: mediaIds } } }),
      ...Array.from(galleryCounts.entries()).map(
        ([galleryId, { count, bytes }]) =>
          prisma.gallery.update({
            where: { id: galleryId },
            data: {
              mediaCount: { decrement: count },
              totalSizeBytes: { decrement: bytes },
            },
          })
      ),
    ]);

    res.json({
      message: `${mediaItems.length} media items deleted`,
      deletedCount: mediaItems.length,
    });
  } catch (err) {
    next(err);
  }
}

export async function batchReorder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      throw new AppError("Items array is required", 400);
    }

    await prisma.$transaction(
      items.map((item: { id: string; sortOrder: number }) =>
        prisma.mediaItem.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    res.json({ message: "Media items reordered" });
  } catch (err) {
    next(err);
  }
}
