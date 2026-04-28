import type { Request, Response, NextFunction } from "express";
import { prisma } from "@ogp/db";
import { AppError } from "../../middleware/errorHandler.js";

/**
 * GET /admin/projects/:projectId/timeline
 * List timeline events for a project, ordered by eventTime.
 */
export async function listEvents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const events = await prisma.weddingTimelineEvent.findMany({
      where: { projectId },
      orderBy: { eventTime: "asc" },
      include: {
        gallery: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    res.json({ data: events });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /admin/projects/:projectId/timeline
 * Create a new timeline event.
 */
export async function createEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { projectId } = req.params;
    const { title, description, eventTime, endTime, location, icon, galleryId } =
      req.body;

    if (!title || !eventTime) {
      throw new AppError("title and eventTime are required", 400);
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    // If galleryId is provided, validate it belongs to the project
    if (galleryId) {
      const gallery = await prisma.gallery.findFirst({
        where: { id: galleryId, projectId },
      });
      if (!gallery) {
        throw new AppError(
          "Gallery not found or does not belong to this project",
          400
        );
      }
    }

    // Determine sort order: place at end by default
    const lastEvent = await prisma.weddingTimelineEvent.findFirst({
      where: { projectId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const nextSortOrder = (lastEvent?.sortOrder ?? -1) + 1;

    const event = await prisma.weddingTimelineEvent.create({
      data: {
        projectId,
        title,
        description: description || null,
        eventTime: new Date(eventTime),
        endTime: endTime ? new Date(endTime) : null,
        location: location || null,
        icon: icon || null,
        galleryId: galleryId || null,
        sortOrder: nextSortOrder,
      },
      include: {
        gallery: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /admin/timeline-events/:id
 * Update a timeline event.
 */
export async function updateEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const existing = await prisma.weddingTimelineEvent.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new AppError("Timeline event not found", 404);
    }

    const { title, description, eventTime, endTime, location, icon, galleryId } =
      req.body;

    // If galleryId is provided, validate it belongs to the same project
    if (galleryId) {
      const gallery = await prisma.gallery.findFirst({
        where: { id: galleryId, projectId: existing.projectId },
      });
      if (!gallery) {
        throw new AppError(
          "Gallery not found or does not belong to this project",
          400
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (eventTime !== undefined) updateData.eventTime = new Date(eventTime);
    if (endTime !== undefined)
      updateData.endTime = endTime ? new Date(endTime) : null;
    if (location !== undefined) updateData.location = location;
    if (icon !== undefined) updateData.icon = icon;
    if (galleryId !== undefined) updateData.galleryId = galleryId || null;

    const updated = await prisma.weddingTimelineEvent.update({
      where: { id },
      data: updateData,
      include: {
        gallery: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /admin/timeline-events/:id
 * Delete a timeline event.
 */
export async function deleteEvent(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const existing = await prisma.weddingTimelineEvent.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new AppError("Timeline event not found", 404);
    }

    await prisma.weddingTimelineEvent.delete({ where: { id } });

    res.json({ message: "Timeline event deleted successfully" });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /admin/projects/:projectId/timeline/reorder
 * Reorder timeline events. Expects body: { orderedIds: string[] }
 */
export async function reorderEvents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { projectId } = req.params;
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      throw new AppError(
        "orderedIds must be a non-empty array of event IDs",
        400
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    // Verify all IDs belong to this project
    const events = await prisma.weddingTimelineEvent.findMany({
      where: { projectId },
      select: { id: true },
    });
    const existingIds = new Set(events.map((e) => e.id));

    for (const id of orderedIds) {
      if (!existingIds.has(id)) {
        throw new AppError(
          `Event ${id} not found in project ${projectId}`,
          400
        );
      }
    }

    // Update sort orders in a transaction
    await prisma.$transaction(
      orderedIds.map((id: string, index: number) =>
        prisma.weddingTimelineEvent.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    // Return the reordered list
    const reordered = await prisma.weddingTimelineEvent.findMany({
      where: { projectId },
      orderBy: { sortOrder: "asc" },
      include: {
        gallery: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    res.json({ data: reordered });
  } catch (err) {
    next(err);
  }
}
