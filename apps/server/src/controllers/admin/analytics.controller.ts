import type { Request, Response, NextFunction } from "express";
import { prisma } from "@ogp/db";
import { parsePagination, paginatedResponse } from "../../utils/pagination.js";
import { AppError } from "../../middleware/errorHandler.js";

/**
 * GET /admin/analytics/dashboard
 * Aggregate dashboard statistics.
 */
export async function getDashboardStats(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalProjects,
      totalClients,
      totalMediaItems,
      storageAgg,
      downloadsThisMonth,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.client.count(),
      prisma.mediaItem.count(),
      prisma.mediaItem.aggregate({
        _sum: { fileSizeBytes: true },
      }),
      prisma.downloadLog.count({
        where: {
          createdAt: { gte: startOfMonth },
        },
      }),
    ]);

    const totalStorageBytes = storageAgg._sum.fileSizeBytes
      ? Number(storageAgg._sum.fileSizeBytes)
      : 0;

    res.json({
      totalProjects,
      totalClients,
      totalMediaItems,
      totalStorageBytes,
      totalStorageGB: Number((totalStorageBytes / (1024 ** 3)).toFixed(2)),
      downloadsThisMonth,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/analytics/downloads
 * Download counts grouped by project, with optional date range filtering.
 * Query params: startDate, endDate, projectId
 */
export async function getDownloadAnalytics(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : undefined;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : undefined;
    const projectId = req.query.projectId as string | undefined;

    const dateFilter: Record<string, unknown> = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    const where: Record<string, unknown> = {};
    if (Object.keys(dateFilter).length > 0) {
      where.createdAt = dateFilter;
    }

    // If filtering by project, get galleries in that project first
    if (projectId) {
      const galleries = await prisma.gallery.findMany({
        where: { projectId },
        select: { id: true },
      });
      where.galleryId = { in: galleries.map((g) => g.id) };
    }

    // Get download logs with gallery -> project context
    const downloads = await prisma.downloadLog.findMany({
      where,
      include: {
        gallery: {
          select: {
            id: true,
            title: true,
            projectId: true,
            project: {
              select: { id: true, title: true },
            },
          },
        },
        client: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by project
    const byProject = new Map<
      string,
      {
        projectId: string;
        projectTitle: string;
        downloadCount: number;
        totalFiles: number;
        totalSizeBytes: bigint;
      }
    >();

    for (const dl of downloads) {
      const pId = dl.gallery?.project?.id || "unknown";
      const pTitle = dl.gallery?.project?.title || "Unknown Project";

      const existing = byProject.get(pId);
      if (existing) {
        existing.downloadCount += 1;
        existing.totalFiles += dl.fileCount;
        existing.totalSizeBytes += dl.totalSizeBytes;
      } else {
        byProject.set(pId, {
          projectId: pId,
          projectTitle: pTitle,
          downloadCount: 1,
          totalFiles: dl.fileCount,
          totalSizeBytes: dl.totalSizeBytes,
        });
      }
    }

    const projectStats = Array.from(byProject.values()).map((stat) => ({
      ...stat,
      totalSizeBytes: Number(stat.totalSizeBytes),
    }));

    res.json({
      totalDownloads: downloads.length,
      byProject: projectStats,
      dateRange: {
        start: startDate?.toISOString() || null,
        end: endDate?.toISOString() || null,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/analytics/storage
 * Storage usage grouped by project.
 */
export async function getStorageUsage(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        _count: {
          select: { mediaItems: true, galleries: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Aggregate storage per project
    const storageByProject = await Promise.all(
      projects.map(async (project) => {
        const agg = await prisma.mediaItem.aggregate({
          where: { projectId: project.id },
          _sum: { fileSizeBytes: true },
        });

        const sizeBytes = agg._sum.fileSizeBytes
          ? Number(agg._sum.fileSizeBytes)
          : 0;

        return {
          projectId: project.id,
          projectTitle: project.title,
          status: project.status,
          mediaCount: project._count.mediaItems,
          galleryCount: project._count.galleries,
          totalSizeBytes: sizeBytes,
          totalSizeMB: Number((sizeBytes / (1024 ** 2)).toFixed(2)),
          totalSizeGB: Number((sizeBytes / (1024 ** 3)).toFixed(4)),
        };
      })
    );

    const grandTotalBytes = storageByProject.reduce(
      (sum, p) => sum + p.totalSizeBytes,
      0
    );

    res.json({
      totalStorageBytes: grandTotalBytes,
      totalStorageGB: Number((grandTotalBytes / (1024 ** 3)).toFixed(2)),
      projects: storageByProject,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/analytics/activity
 * Recent audit log entries with pagination.
 */
export async function getActivityFeed(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { skip, take, page, limit } = parsePagination(req.query);
    const action = req.query.action as string | undefined;
    const resourceType = req.query.resourceType as string | undefined;

    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Serialize BigInt id to string for JSON response
    const serialized = logs.map((log) => ({
      ...log,
      id: log.id.toString(),
    }));

    res.json(paginatedResponse(serialized, total, page, limit));
  } catch (err) {
    next(err);
  }
}
