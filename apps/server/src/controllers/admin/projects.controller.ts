import type { Request, Response, NextFunction } from "express";
import { prisma } from "@ogp/db";
import { slugify } from "../../utils/slugify.js";
import { parsePagination, paginatedResponse } from "../../utils/pagination.js";
import { AppError } from "../../middleware/errorHandler.js";

export async function listProjects(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { skip, take, page, limit } = parsePagination(req.query);
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { venue: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          eventDate: true,
          eventType: true,
          venue: true,
          city: true,
          coverImageUrl: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              galleries: true,
              projectClients: true,
              mediaItems: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    res.json(paginatedResponse(projects, total, page, limit));
  } catch (err) {
    next(err);
  }
}

export async function createProject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { title, description, eventDate, eventType, venue, city, settings } =
      req.body;

    if (!title || !eventType) {
      throw new AppError("Title and event type are required", 400);
    }

    const slug = slugify(title);

    const project = await prisma.project.create({
      data: {
        title,
        slug,
        description: description || null,
        eventDate: eventDate ? new Date(eventDate) : null,
        eventType,
        venue: venue || null,
        city: city || null,
        settings: settings || {},
        createdById: req.user!.id,
      },
    });

    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
}

export async function getProject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        galleries: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            mediaCount: true,
            coverImageUrl: true,
            sortOrder: true,
            createdAt: true,
          },
        },
        projectClients: {
          include: {
            client: {
              select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
              },
            },
          },
        },
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    res.json(project);
  } catch (err) {
    next(err);
  }
}

export async function updateProject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
    });
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const {
      title,
      description,
      eventDate,
      eventType,
      venue,
      city,
      coverImageUrl,
      status,
      settings,
    } = req.body;

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(eventDate !== undefined && {
          eventDate: eventDate ? new Date(eventDate) : null,
        }),
        ...(eventType !== undefined && { eventType }),
        ...(venue !== undefined && { venue }),
        ...(city !== undefined && { city }),
        ...(coverImageUrl !== undefined && { coverImageUrl }),
        ...(status !== undefined && { status }),
        ...(settings !== undefined && { settings }),
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function archiveProject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
    });
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: { status: "ARCHIVED" },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function assignClient(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { clientId, role } = req.body;
    if (!clientId) {
      throw new AppError("Client ID is required", 400);
    }

    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
    });
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!client) {
      throw new AppError("Client not found", 404);
    }

    const existing = await prisma.projectClient.findUnique({
      where: {
        projectId_clientId: {
          projectId: req.params.id,
          clientId,
        },
      },
    });
    if (existing) {
      throw new AppError("Client is already assigned to this project", 409);
    }

    const projectClient = await prisma.projectClient.create({
      data: {
        projectId: req.params.id,
        clientId,
        role: role || "PRIMARY",
      },
      include: {
        client: {
          select: { id: true, email: true, fullName: true },
        },
      },
    });

    res.status(201).json(projectClient);
  } catch (err) {
    next(err);
  }
}

export async function removeClient(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id: projectId, clientId } = req.params;

    const pc = await prisma.projectClient.findUnique({
      where: {
        projectId_clientId: { projectId, clientId },
      },
    });
    if (!pc) {
      throw new AppError("Client assignment not found", 404);
    }

    await prisma.projectClient.delete({
      where: { id: pc.id },
    });

    res.json({ message: "Client removed from project" });
  } catch (err) {
    next(err);
  }
}

export async function getStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
    });
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const [mediaCount, galleryCount, clientCount, downloadLogs] =
      await Promise.all([
        prisma.mediaItem.count({ where: { projectId: req.params.id } }),
        prisma.gallery.count({ where: { projectId: req.params.id } }),
        prisma.projectClient.count({ where: { projectId: req.params.id } }),
        prisma.downloadLog.findMany({
          where: {
            gallery: { projectId: req.params.id },
          },
          select: {
            downloadType: true,
            fileCount: true,
            totalSizeBytes: true,
          },
        }),
      ]);

    const totalDownloads = downloadLogs.length;
    const totalFilesDownloaded = downloadLogs.reduce(
      (sum, log) => sum + log.fileCount,
      0
    );

    res.json({
      projectId: req.params.id,
      mediaCount,
      galleryCount,
      clientCount,
      totalDownloads,
      totalFilesDownloaded,
    });
  } catch (err) {
    next(err);
  }
}
