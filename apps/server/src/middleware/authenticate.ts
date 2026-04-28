import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "./errorHandler.js";

const ACCESS_COOKIE_NAME = "access_token";

function readAccessToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  const cookieToken = req.cookies?.[ACCESS_COOKIE_NAME];
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }
  return null;
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const token = readAccessToken(req);
  if (!token) {
    throw new AppError("Authentication required", 401);
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    throw new AppError("Invalid or expired token", 401);
  }

  req.user = {
    id: decoded.id as string,
    type: decoded.type as "admin" | "client",
    role: decoded.role as string,
  };

  next();
}

export function authenticateOptional(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const token = readAccessToken(req);
  if (!token) {
    next();
    return;
  }

  const decoded = verifyAccessToken(token);
  if (decoded) {
    req.user = {
      id: decoded.id as string,
      type: decoded.type as "admin" | "client",
      role: decoded.role as string,
    };
  }

  next();
}
