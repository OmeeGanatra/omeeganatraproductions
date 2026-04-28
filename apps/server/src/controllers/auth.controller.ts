import type { Request, Response, NextFunction } from "express";
import { prisma } from "@ogp/db";
import { comparePassword, hashPassword } from "../utils/password.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  generateOpaqueToken,
  generateOtpCode,
} from "../utils/jwt.js";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  sendPasswordResetEmail,
  sendOtpEmail,
} from "../services/auth.service.js";

const REFRESH_COOKIE_NAME = "refresh_token";
const ACCESS_COOKIE_NAME = "access_token";
const REFRESH_MAX_AGE_MS = env.JWT_REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
const ACCESS_MAX_AGE_MS = 15 * 60 * 1000; // matches JWT_ACCESS_EXPIRY default
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;

function isProd(): boolean {
  return env.NODE_ENV === "production";
}

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd(),
    sameSite: "strict",
    path: "/api/auth",
    maxAge: REFRESH_MAX_AGE_MS,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd(),
    sameSite: "strict",
    path: "/api/auth",
  });
}

function setAccessCookie(res: Response, token: string): void {
  res.cookie(ACCESS_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd(),
    sameSite: "strict",
    path: "/",
    maxAge: ACCESS_MAX_AGE_MS,
  });
}

function clearAccessCookie(res: Response): void {
  res.clearCookie(ACCESS_COOKIE_NAME, {
    httpOnly: true,
    secure: isProd(),
    sameSite: "strict",
    path: "/",
  });
}

function clientIp(req: Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]!.trim();
  }
  return req.ip || null;
}

async function issueOtpChallenge(
  userType: "ADMIN" | "CLIENT",
  recipient: { id: string; email: string; fullName: string }
): Promise<string> {
  const { code, codeHash } = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  // Invalidate prior unconsumed challenges for this principal so a fresh
  // login always starts a fresh challenge.
  if (userType === "ADMIN") {
    await prisma.otpChallenge.deleteMany({
      where: { userId: recipient.id, consumedAt: null },
    });
  } else {
    await prisma.otpChallenge.deleteMany({
      where: { clientId: recipient.id, consumedAt: null },
    });
  }

  const challenge = await prisma.otpChallenge.create({
    data: {
      userType,
      userId: userType === "ADMIN" ? recipient.id : null,
      clientId: userType === "CLIENT" ? recipient.id : null,
      codeHash,
      expiresAt,
    },
  });

  try {
    await sendOtpEmail({ email: recipient.email, fullName: recipient.fullName }, code);
  } catch (err) {
    // If email fails, surface a generic error — don't leak whether the email
    // is deliverable. The challenge row stays, the next attempt will replace it.
    console.error("[auth] Failed to send OTP email:", err);
    throw new AppError("Could not send verification code", 502);
  }

  return challenge.id;
}

export async function adminLogin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await prisma.user.findUnique({ where: { email } });
    // Constant-time-ish: still hash even if user doesn't exist to limit
    // timing leaks between known/unknown emails.
    const dummyHash =
      "$2a$12$ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123";
    const passwordHash = user?.passwordHash ?? dummyHash;
    const valid = await comparePassword(password, passwordHash);
    if (!user || !valid) {
      throw new AppError("Invalid credentials", 401);
    }

    if (user.otpEnabled) {
      const challengeId = await issueOtpChallenge("ADMIN", user);
      res.json({ requiresOtp: true, challengeId });
      return;
    }

    await issueAdminSession(req, res, user);
  } catch (err) {
    next(err);
  }
}

export async function clientLogin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const client = await prisma.client.findUnique({ where: { email } });
    const dummyHash =
      "$2a$12$ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123";
    const passwordHash = client?.passwordHash ?? dummyHash;
    const valid = await comparePassword(password, passwordHash);
    if (!client || !valid) {
      throw new AppError("Invalid credentials", 401);
    }

    if (client.otpEnabled) {
      const challengeId = await issueOtpChallenge("CLIENT", client);
      res.json({ requiresOtp: true, challengeId });
      return;
    }

    await issueClientSession(req, res, client);
  } catch (err) {
    next(err);
  }
}

export async function verifyOtp(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { challengeId, code } = req.body as {
      challengeId: string;
      code: string;
    };

    const challenge = await prisma.otpChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge || challenge.consumedAt) {
      throw new AppError("Invalid or expired verification code", 401);
    }

    if (challenge.expiresAt < new Date()) {
      throw new AppError("Invalid or expired verification code", 401);
    }

    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      throw new AppError("Too many incorrect attempts. Request a new code.", 429);
    }

    const codeHash = hashToken(code);
    if (codeHash !== challenge.codeHash) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      throw new AppError("Invalid or expired verification code", 401);
    }

    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    if (challenge.userType === "ADMIN" && challenge.userId) {
      const user = await prisma.user.findUnique({
        where: { id: challenge.userId },
      });
      if (!user) throw new AppError("User not found", 404);
      await issueAdminSession(req, res, user);
    } else if (challenge.userType === "CLIENT" && challenge.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: challenge.clientId },
      });
      if (!client) throw new AppError("Client not found", 404);
      await issueClientSession(req, res, client);
    } else {
      throw new AppError("Challenge state corrupt", 500);
    }
  } catch (err) {
    next(err);
  }
}

async function issueAdminSession(
  req: Request,
  res: Response,
  user: { id: string; email: string; fullName: string; role: string; avatarUrl: string | null }
): Promise<void> {
  const accessToken = generateAccessToken({
    id: user.id,
    type: "admin",
    role: user.role,
  });
  const refreshTokenValue = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshTokenValue),
      userId: user.id,
      userType: "ADMIN",
      expiresAt: new Date(Date.now() + REFRESH_MAX_AGE_MS),
      deviceInfo: req.headers["user-agent"] || null,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  setRefreshCookie(res, refreshTokenValue);
  setAccessCookie(res, accessToken);

  // refreshToken is also returned in the body for non-cookie clients
  // (mobile). Browsers can ignore it — they receive it via the httpOnly
  // cookie and never need to read it.
  res.json({
    accessToken,
    refreshToken: refreshTokenValue,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      type: "admin",
    },
  });
}

async function issueClientSession(
  req: Request,
  res: Response,
  client: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    avatarUrl: string | null;
  }
): Promise<void> {
  const accessToken = generateAccessToken({
    id: client.id,
    type: "client",
    role: "CLIENT",
  });
  const refreshTokenValue = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshTokenValue),
      clientId: client.id,
      userType: "CLIENT",
      expiresAt: new Date(Date.now() + REFRESH_MAX_AGE_MS),
      deviceInfo: req.headers["user-agent"] || null,
    },
  });

  await prisma.client.update({
    where: { id: client.id },
    data: { lastLoginAt: new Date() },
  });

  setRefreshCookie(res, refreshTokenValue);
  setAccessCookie(res, accessToken);

  res.json({
    accessToken,
    refreshToken: refreshTokenValue,
    user: {
      id: client.id,
      email: client.email,
      fullName: client.fullName,
      phone: client.phone,
      avatarUrl: client.avatarUrl,
      type: "client",
    },
  });
}

export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Web sends the refresh token via httpOnly cookie. Native mobile clients
    // can't share cookies with the API origin in all cases, so they pass the
    // token in the request body instead. Either is accepted.
    const bodyToken =
      typeof req.body?.refreshToken === "string" && req.body.refreshToken.length > 0
        ? (req.body.refreshToken as string)
        : null;
    const token = req.cookies?.[REFRESH_COOKIE_NAME] || bodyToken;
    if (!token) {
      throw new AppError("Refresh token required", 401);
    }

    const tokenHash = hashToken(token);

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true, client: true },
    });

    if (!stored) {
      // Possible reuse / theft. Cookie cleared; principal unknown so we cannot
      // bulk-revoke without an unauthenticated lookup.
      clearRefreshCookie(res);
      clearAccessCookie(res);
      throw new AppError("Invalid refresh token", 401);
    }

    if (stored.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: stored.id } });
      clearRefreshCookie(res);
      clearAccessCookie(res);
      throw new AppError("Refresh token expired", 401);
    }

    // Rotate
    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const newRefresh = generateRefreshToken();
    let accessToken: string;

    if (stored.userType === "ADMIN" && stored.user) {
      accessToken = generateAccessToken({
        id: stored.user.id,
        type: "admin",
        role: stored.user.role,
      });
      await prisma.refreshToken.create({
        data: {
          tokenHash: hashToken(newRefresh),
          userId: stored.user.id,
          userType: "ADMIN",
          expiresAt: new Date(Date.now() + REFRESH_MAX_AGE_MS),
          deviceInfo: req.headers["user-agent"] || null,
        },
      });
    } else if (stored.userType === "CLIENT" && stored.client) {
      accessToken = generateAccessToken({
        id: stored.client.id,
        type: "client",
        role: "CLIENT",
      });
      await prisma.refreshToken.create({
        data: {
          tokenHash: hashToken(newRefresh),
          clientId: stored.client.id,
          userType: "CLIENT",
          expiresAt: new Date(Date.now() + REFRESH_MAX_AGE_MS),
          deviceInfo: req.headers["user-agent"] || null,
        },
      });
    } else {
      clearRefreshCookie(res);
      clearAccessCookie(res);
      throw new AppError("Invalid token state", 401);
    }

    setRefreshCookie(res, newRefresh);
    setAccessCookie(res, accessToken);

    res.json({ accessToken, refreshToken: newRefresh });
  } catch (err) {
    next(err);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const bodyToken =
      typeof req.body?.refreshToken === "string" && req.body.refreshToken.length > 0
        ? (req.body.refreshToken as string)
        : null;
    const token = req.cookies?.[REFRESH_COOKIE_NAME] || bodyToken;
    if (token) {
      const tokenHash = hashToken(token);
      await prisma.refreshToken
        .delete({ where: { tokenHash } })
        .catch(() => {});
    }

    clearRefreshCookie(res);
    clearAccessCookie(res);

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, type } = req.body as {
      email: string;
      type: "admin" | "client";
    };

    // Always respond identically to avoid email enumeration.
    res.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });

    const { token, tokenHash } = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

    if (type === "admin") {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return;
      await prisma.passwordResetToken.create({
        data: {
          tokenHash,
          userType: "ADMIN",
          userId: user.id,
          expiresAt,
        },
      });
      await sendPasswordResetEmail(
        { email: user.email, fullName: user.fullName },
        token
      ).catch((err) => {
        console.error("[auth] Failed to send admin reset email:", err);
      });
    } else {
      const client = await prisma.client.findUnique({ where: { email } });
      if (!client) return;
      await prisma.passwordResetToken.create({
        data: {
          tokenHash,
          userType: "CLIENT",
          clientId: client.id,
          expiresAt,
        },
      });
      await sendPasswordResetEmail(
        { email: client.email, fullName: client.fullName },
        token
      ).catch((err) => {
        console.error("[auth] Failed to send client reset email:", err);
      });
    }
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token, password, type } = req.body as {
      token: string;
      password: string;
      type: "admin" | "client";
    };

    const tokenHash = hashToken(token);
    const stored = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (
      !stored ||
      stored.consumedAt ||
      stored.expiresAt < new Date() ||
      (type === "admin" ? stored.userType !== "ADMIN" : stored.userType !== "CLIENT")
    ) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    const newHash = await hashPassword(password);

    await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.update({
        where: { id: stored.id },
        data: { consumedAt: new Date() },
      });

      if (stored.userType === "ADMIN" && stored.userId) {
        await tx.user.update({
          where: { id: stored.userId },
          data: { passwordHash: newHash },
        });
        // Invalidate all existing refresh tokens for this user (force re-login).
        await tx.refreshToken.deleteMany({
          where: { userId: stored.userId },
        });
      } else if (stored.userType === "CLIENT" && stored.clientId) {
        await tx.client.update({
          where: { id: stored.clientId },
          data: { passwordHash: newHash },
        });
        await tx.refreshToken.deleteMany({
          where: { clientId: stored.clientId },
        });
      }

      await tx.auditLog.create({
        data: {
          actorType: stored.userType === "ADMIN" ? "ADMIN" : "CLIENT",
          actorId: stored.userId ?? stored.clientId,
          action: "password.reset",
          resourceType: stored.userType === "ADMIN" ? "User" : "Client",
          resourceId: stored.userId ?? stored.clientId,
          ipAddress: clientIp(req),
        },
      });
    });

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    next(err);
  }
}

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    if (req.user.type === "admin") {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          avatarUrl: true,
          otpEnabled: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });
      if (!user) {
        throw new AppError("User not found", 404);
      }
      res.json({ type: "admin", ...user });
    } else {
      const client = await prisma.client.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          avatarUrl: true,
          otpEnabled: true,
          notificationPreferences: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });
      if (!client) {
        throw new AppError("Client not found", 404);
      }
      res.json({ type: "client", ...client });
    }
  } catch (err) {
    next(err);
  }
}

export async function updateMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const { fullName, phone, avatarUrl, currentPassword, newPassword } =
      req.body as {
        fullName?: string;
        phone?: string | null;
        avatarUrl?: string | null;
        currentPassword?: string;
        newPassword?: string;
      };

    if (req.user.type === "admin") {
      const updateData: Record<string, unknown> = {};
      if (fullName) updateData.fullName = fullName;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

      if (currentPassword && newPassword) {
        const user = await prisma.user.findUnique({
          where: { id: req.user.id },
        });
        if (!user) throw new AppError("User not found", 404);

        const valid = await comparePassword(currentPassword, user.passwordHash);
        if (!valid) throw new AppError("Current password is incorrect", 400);

        updateData.passwordHash = await hashPassword(newPassword);
      }

      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          avatarUrl: true,
        },
      });

      res.json(updated);
    } else {
      const updateData: Record<string, unknown> = {};
      if (fullName) updateData.fullName = fullName;
      if (phone !== undefined) updateData.phone = phone;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

      if (currentPassword && newPassword) {
        const client = await prisma.client.findUnique({
          where: { id: req.user.id },
        });
        if (!client) throw new AppError("Client not found", 404);

        const valid = await comparePassword(
          currentPassword,
          client.passwordHash
        );
        if (!valid) throw new AppError("Current password is incorrect", 400);

        updateData.passwordHash = await hashPassword(newPassword);
      }

      const updated = await prisma.client.update({
        where: { id: req.user.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          avatarUrl: true,
        },
      });

      res.json(updated);
    }
  } catch (err) {
    next(err);
  }
}
