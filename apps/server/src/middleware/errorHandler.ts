import type { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isProduction = process.env.NODE_ENV === "production";
  const status = err instanceof AppError ? err.statusCode : 500;

  // Log server errors at error level; client errors at warn. Stacks are only
  // logged for unexpected (5xx) errors; expected 4xx flows are noise.
  if (status >= 500) {
    console.error(
      `[error] ${req.method} ${req.originalUrl} ${status}: ${err.message}`,
      { stack: err.stack }
    );
  } else if (!isProduction) {
    console.warn(
      `[warn] ${req.method} ${req.originalUrl} ${status}: ${err.message}`
    );
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ?? {}),
    });
    return;
  }

  // Never leak internals or stack traces to clients in production.
  res.status(500).json({
    error: isProduction ? "Internal server error" : err.message,
  });
}

// Wraps an async route handler so thrown errors propagate to errorHandler
// without try/catch boilerplate in every controller.
export function asyncHandler<
  Req extends Request = Request,
  Res extends Response = Response
>(handler: (req: Req, res: Res, next: NextFunction) => Promise<unknown>) {
  return (req: Req, res: Res, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
}
