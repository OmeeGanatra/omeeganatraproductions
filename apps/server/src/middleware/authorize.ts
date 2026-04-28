import type { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler.js";

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError("Insufficient permissions", 403);
    }

    next();
  };
}

export const adminOnly = authorize("SUPER_ADMIN", "ADMIN");

export const editorOrAbove = authorize("SUPER_ADMIN", "ADMIN", "EDITOR");

export function clientOnly(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  if (req.user.type !== "client") {
    throw new AppError("Client access only", 403);
  }

  next();
}
