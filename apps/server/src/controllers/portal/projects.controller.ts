import type { Request, Response, NextFunction } from "express";
import { prisma } from "@ogp/db";
import { parsePagination, paginatedResponse } from "../../utils/pagination.js";
import { AppError } from "../../middleware/errorHandler.js";

export async function listProjects(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const clientId = req.user!.id;
    const { skip, take, page, limit } = parsePagination(req.query);

    const projectClientEntries = await prisma.projectClient.findMany({
      where: { clientId },
      select: { projectId: true },
    });

    const projectIds = projectClientEntries.map((pc) => pc.projectId);

    const where = {
      id: { in: projectIds },
      status: { not: "ARCHIVED" as const },
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take,
        orderBy: { eventDate: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          eventDate: true,
          eventType: true,
          venue: true,
          city: true,
          coverImageUrl: true,
          status: true,
          _count: {
            select: { galleries: { where: { status: "PUBLISHED" } } },
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

export async function getProject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const clientId = req.user!.id;
    const { slug } = req.params;

    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        galleries: {
          where: { status: "PUBLISHED" },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            coverImageUrl: true,
            mediaCount: true,
            isPublic: true,
            downloadEnabled: true,
            passwordHash: true,
            createdAt: true,
          },
        },
        projectClients: {
          where: { clientId },
          select: { id: true, role: true },
        },
      },
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    if (project.projectClients.length === 0) {
      throw new AppError("Access denied", 403);
    }

    // Remove password hash from galleries, replace with hasPassword flag
    const galleries = project.galleries.map(
      ({ passwordHash, ...gallery }) => ({
        ...gallery,
        hasPassword: !!passwordHash,
      })
    );

    res.json({
      id: project.id,
      title: project.title,
      slug: project.slug,
      description: project.description,
      eventDate: project.eventDate,
      eventType: project.eventType,
      venue: project.venue,
      city: project.city,
      coverImageUrl: project.coverImageUrl,
      status: project.status,
      clientRole: project.projectClients[0].role,
      galleries,
    });
  } catch (err) {
    next(err);
  }
}

export async function listGalleries(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const clientId = req.user!.id;
    const { slug } = req.params;

    const project = await prisma.project.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const access = await prisma.projectClient.findUnique({
      where: {
        projectId_clientId: { projectId: project.id, clientId },
      },
    });

    if (!access) {
      throw new AppError("Access denied", 403);
    }

    const galleries = await prisma.gallery.findMany({
      where: {
        projectId: project.id,
        status: "PUBLISHED",
      },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverImageUrl: true,
        mediaCount: true,
        isPublic: true,
        downloadEnabled: true,
        passwordHash: true,
        createdAt: true,
      },
    });

    const result = galleries.map(({ passwordHash, ...g }) => ({
      ...g,
      hasPassword: !!passwordHash,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
}
