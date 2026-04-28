import type { Request, Response, NextFunction } from "express";
import { prisma } from "@ogp/db";
import { env } from "../../config/env.js";
import { parsePagination, paginatedResponse } from "../../utils/pagination.js";
import { AppError } from "../../middleware/errorHandler.js";
import { sendEmail } from "../../services/email.service.js";

/**
 * POST /admin/notifications/send
 * Send a notification to a specific client.
 */
export async function sendNotification(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { clientId, type, title, body, channel } = req.body;

    if (!clientId || !type || !title || !body) {
      throw new AppError(
        "clientId, type, title, and body are required",
        400
      );
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, email: true, fullName: true },
    });

    if (!client) {
      throw new AppError("Client not found", 404);
    }

    const notificationChannel = channel || "IN_APP";

    // Create the in-app notification
    const notification = await prisma.notification.create({
      data: {
        recipientClientId: clientId,
        type,
        title,
        body,
        channel: notificationChannel,
        sentAt: new Date(),
      },
    });

    // If channel is EMAIL, also send via SES
    if (notificationChannel === "EMAIL") {
      const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color: #1a1a1a; padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">
                Omee Ganatra Productions
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="color: #1a1a1a; margin: 0 0 16px; font-size: 22px; font-weight: 600;">${title}</h2>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">${body}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #1a1a1a; border-radius: 8px;">
                    <a href="${env.CORS_ORIGIN}/login" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                      Visit Portal
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; background-color: #fafafa; border-top: 1px solid #eee; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">Omee Ganatra Productions</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      try {
        await sendEmail({
          to: client.email,
          subject: title,
          html: htmlBody,
          text: `${title}\n\n${body}\n\n- Omee Ganatra Productions`,
        });
      } catch (err) {
        console.error(
          `Failed to send email notification to ${client.email}:`,
          err
        );
        // Don't throw — in-app notification was already created
      }
    }

    res.status(201).json(notification);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /admin/notifications/broadcast
 * Broadcast a notification to all clients in a project.
 */
export async function broadcastToProject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { projectId, type, title, body } = req.body;

    if (!projectId || !type || !title || !body) {
      throw new AppError(
        "projectId, type, title, and body are required",
        400
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        projectClients: {
          select: {
            clientId: true,
          },
        },
      },
    });

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    if (project.projectClients.length === 0) {
      throw new AppError("No clients assigned to this project", 400);
    }

    const now = new Date();

    const notifications = await prisma.notification.createMany({
      data: project.projectClients.map((pc) => ({
        recipientClientId: pc.clientId,
        type,
        title,
        body,
        data: {
          projectId: project.id,
          projectTitle: project.title,
          broadcast: true,
        },
        channel: "IN_APP" as const,
        sentAt: now,
      })),
    });

    res.status(201).json({
      message: `Notification broadcast to ${notifications.count} clients`,
      count: notifications.count,
      projectId,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/notifications
 * List notifications with pagination and optional filters.
 */
export async function listNotifications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { skip, take, page, limit } = parsePagination(req.query);
    const type = req.query.type as string | undefined;
    const projectId = req.query.projectId as string | undefined;
    const clientId = req.query.clientId as string | undefined;

    const where: Record<string, unknown> = {};

    if (type) {
      where.type = type;
    }

    if (clientId) {
      where.recipientClientId = clientId;
    }

    if (projectId) {
      // Filter notifications whose data JSON contains the projectId
      where.data = {
        path: ["projectId"],
        equals: projectId,
      };
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          recipientClient: {
            select: { id: true, fullName: true, email: true },
          },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    res.json(paginatedResponse(notifications, total, page, limit));
  } catch (err) {
    next(err);
  }
}
