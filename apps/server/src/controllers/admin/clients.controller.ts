import type { Request, Response, NextFunction } from "express";
import { prisma } from "@ogp/db";
import { hashPassword } from "../../utils/password.js";
import { parsePagination, paginatedResponse } from "../../utils/pagination.js";
import { AppError } from "../../middleware/errorHandler.js";
import crypto from "crypto";

export async function listClients(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { skip, take, page, limit } = parsePagination(req.query);
    const search = req.query.search as string | undefined;

    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          avatarUrl: true,
          lastLoginAt: true,
          createdAt: true,
          _count: { select: { projectClients: true } },
        },
      }),
      prisma.client.count({ where }),
    ]);

    res.json(paginatedResponse(clients, total, page, limit));
  } catch (err) {
    next(err);
  }
}

export async function createClient(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, fullName, phone } = req.body;
    if (!email || !fullName) {
      throw new AppError("Email and full name are required", 400);
    }

    const existing = await prisma.client.findUnique({ where: { email } });
    if (existing) {
      throw new AppError("A client with this email already exists", 409);
    }

    const generatedPassword = crypto.randomBytes(8).toString("base64url");
    const passwordHash = await hashPassword(generatedPassword);

    const client = await prisma.client.create({
      data: {
        email,
        fullName,
        phone: phone || null,
        passwordHash,
        createdById: req.user!.id,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      ...client,
      generatedPassword,
    });
  } catch (err) {
    next(err);
  }
}

export async function getClient(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        notificationPreferences: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        projectClients: {
          include: {
            project: {
              select: {
                id: true,
                title: true,
                slug: true,
                status: true,
                eventDate: true,
                eventType: true,
              },
            },
          },
        },
      },
    });

    if (!client) {
      throw new AppError("Client not found", 404);
    }

    res.json(client);
  } catch (err) {
    next(err);
  }
}

export async function updateClient(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { fullName, email, phone, avatarUrl } = req.body;

    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
    });
    if (!client) {
      throw new AppError("Client not found", 404);
    }

    if (email && email !== client.email) {
      const existing = await prisma.client.findUnique({ where: { email } });
      if (existing) {
        throw new AppError("Email already in use", 409);
      }
    }

    const updated = await prisma.client.update({
      where: { id: req.params.id },
      data: {
        ...(fullName && { fullName }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteClient(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
    });
    if (!client) {
      throw new AppError("Client not found", 404);
    }

    // Soft delete: we remove project associations and tokens but keep the record
    // by updating email to mark as deleted
    await prisma.$transaction([
      prisma.projectClient.deleteMany({
        where: { clientId: req.params.id },
      }),
      prisma.refreshToken.deleteMany({
        where: { clientId: req.params.id },
      }),
      prisma.client.update({
        where: { id: req.params.id },
        data: {
          email: `deleted_${Date.now()}_${client.email}`,
          passwordHash: "DELETED",
        },
      }),
    ]);

    res.json({ message: "Client deleted successfully" });
  } catch (err) {
    next(err);
  }
}
