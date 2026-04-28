import type { Request, Response, NextFunction } from "express";
import { prisma } from "@ogp/db";
import { parsePagination, paginatedResponse } from "../../utils/pagination.js";
import { AppError } from "../../middleware/errorHandler.js";

export async function listNotifications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const clientId = req.user!.id;
    const { skip, take, page, limit } = parsePagination(req.query);
    const unreadOnly = req.query.unread === "true";

    const where: Record<string, unknown> = {
      recipientClientId: clientId,
    };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          data: true,
          channel: true,
          isRead: true,
          readAt: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { recipientClientId: clientId, isRead: false },
      }),
    ]);

    res.json({
      ...paginatedResponse(notifications, total, page, limit),
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const clientId = req.user!.id;

    const result = await prisma.notification.updateMany({
      where: { recipientClientId: clientId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ updated: result.count });
  } catch (err) {
    next(err);
  }
}

export async function markRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const clientId = req.user!.id;
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new AppError("Notification not found", 404);
    }

    if (notification.recipientClientId !== clientId) {
      throw new AppError("Access denied", 403);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}
