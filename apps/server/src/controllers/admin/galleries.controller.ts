import type { Request, Response, NextFunction } from "express";
import { prisma } from "@ogp/db";
import { slugify } from "../../utils/slugify.js";
import { hashPassword } from "../../utils/password.js";
import { parsePagination, paginatedResponse } from "../../utils/pagination.js";
import { AppError } from "../../middleware/errorHandler.js";
import { sendGalleryReadyNotification } from "../../services/notification.service.js";

export async function listGalleries(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { projectId } = req.params;
    const { skip, take, page, limit } = parsePagination(req.query);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const where = { projectId };

    const [galleries, total] = await Promise.all([
      prisma.gallery.findMany({
        where,
        skip,
        take,
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          coverImageUrl: true,
          sortOrder: true,
          isPublic: true,
          downloadEnabled: true,
          watermarkEnabled: true,
          expiresAt: true,
          status: true,
          mediaCount: true,
          totalSizeBytes: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.gallery.count({ where }),
    ]);

    res.json(paginatedResponse(galleries, total, page, limit));
  } catch (err) {
    next(err);
  }
}

export async function createGallery(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { projectId } = req.params;
    const {
      title,
      description,
      isPublic,
      password,
      downloadEnabled,
      downloadPin,
      watermarkEnabled,
      expiresAt,
      sortOrder,
    } = req.body;

    if (!title) {
      throw new AppError("Title is required", 400);
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const slug = slugify(title);

    let passwordHash: string | null = null;
    if (password) {
      passwordHash = await hashPassword(password);
    }

    const gallery = await prisma.gallery.create({
      data: {
        projectId,
        title,
        slug,
        description: description || null,
        isPublic: isPublic ?? false,
        passwordHash,
        downloadEnabled: downloadEnabled ?? true,
        downloadPin: downloadPin || null,
        watermarkEnabled: watermarkEnabled ?? true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        sortOrder: sortOrder ?? 0,
      },
    });

    res.status(201).json(gallery);
  } catch (err) {
    next(err);
  }
}

export async function getGallery(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gallery = await prisma.gallery.findUnique({
      where: { id: req.params.id },
      include: {
        project: {
          select: { id: true, title: true, slug: true },
        },
        _count: {
          select: { mediaItems: true, shareLinks: true, downloadLogs: true },
        },
      },
    });

    if (!gallery) {
      throw new AppError("Gallery not found", 404);
    }

    res.json(gallery);
  } catch (err) {
    next(err);
  }
}

export async function updateGallery(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gallery = await prisma.gallery.findUnique({
      where: { id: req.params.id },
    });
    if (!gallery) {
      throw new AppError("Gallery not found", 404);
    }

    const {
      title,
      description,
      isPublic,
      password,
      downloadEnabled,
      downloadPin,
      watermarkEnabled,
      expiresAt,
      sortOrder,
      coverImageUrl,
    } = req.body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (downloadEnabled !== undefined)
      updateData.downloadEnabled = downloadEnabled;
    if (downloadPin !== undefined) updateData.downloadPin = downloadPin;
    if (watermarkEnabled !== undefined)
      updateData.watermarkEnabled = watermarkEnabled;
    if (expiresAt !== undefined)
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl;

    if (password !== undefined) {
      updateData.passwordHash = password
        ? await hashPassword(password)
        : null;
    }

    const updated = await prisma.gallery.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteGallery(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gallery = await prisma.gallery.findUnique({
      where: { id: req.params.id },
    });
    if (!gallery) {
      throw new AppError("Gallery not found", 404);
    }

    await prisma.gallery.delete({ where: { id: req.params.id } });

    res.json({ message: "Gallery deleted successfully" });
  } catch (err) {
    next(err);
  }
}

export async function publishGallery(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gallery = await prisma.gallery.findUnique({
      where: { id: req.params.id },
      include: {
        project: {
          include: {
            projectClients: {
              select: { clientId: true },
            },
          },
        },
      },
    });

    if (!gallery) {
      throw new AppError("Gallery not found", 404);
    }

    const updated = await prisma.gallery.update({
      where: { id: req.params.id },
      data: { status: "PUBLISHED" },
    });

    // Notify all assigned clients
    for (const pc of gallery.project.projectClients) {
      await sendGalleryReadyNotification(
        pc.clientId,
        gallery.project.id
      ).catch((err) => {
        console.error(
          `Failed to send notification to client ${pc.clientId}:`,
          err
        );
      });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function expireGallery(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gallery = await prisma.gallery.findUnique({
      where: { id: req.params.id },
    });
    if (!gallery) {
      throw new AppError("Gallery not found", 404);
    }

    const updated = await prisma.gallery.update({
      where: { id: req.params.id },
      data: { status: "EXPIRED" },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}
