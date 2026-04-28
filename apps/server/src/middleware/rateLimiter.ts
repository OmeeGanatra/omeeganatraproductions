import type { Request, Response, NextFunction } from "express";
import { redis } from "../config/redis.js";
import { AppError } from "./errorHandler.js";

function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]!.trim();
  }
  return req.ip || "unknown";
}

interface RateLimitOptions {
  max: number;
  windowMs: number;
  prefix: string;
  keyBy?: (req: Request) => string;
}

function createRateLimiter(opts: RateLimitOptions) {
  const windowSeconds = Math.ceil(opts.windowMs / 1000);

  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const identifier = opts.keyBy ? opts.keyBy(req) : clientIp(req);
      const key = `ratelimit:${opts.prefix}:${identifier}`;

      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }

      const remaining = Math.max(0, opts.max - count);
      const ttl = await redis.ttl(key);

      res.setHeader("X-RateLimit-Limit", opts.max);
      res.setHeader("X-RateLimit-Remaining", remaining);
      if (ttl > 0) {
        res.setHeader(
          "X-RateLimit-Reset",
          Math.floor(Date.now() / 1000) + ttl
        );
      }

      if (count > opts.max) {
        if (ttl > 0) res.setHeader("Retry-After", ttl);
        throw new AppError("Too many requests, please try again later", 429);
      }

      next();
    } catch (err) {
      // If Redis is unavailable, fail open in development, fail closed in
      // production. Failing open in dev avoids blocking local work; failing
      // closed in production avoids accidentally removing rate limiting
      // during a Redis outage.
      if (err instanceof AppError) {
        next(err);
        return;
      }
      if (process.env.NODE_ENV === "production") {
        next(new AppError("Service temporarily unavailable", 503));
        return;
      }
      console.warn(
        "[rateLimiter] Redis unavailable, allowing request through:",
        err instanceof Error ? err.message : err
      );
      next();
    }
  };
}

export const generalLimiter = createRateLimiter({
  max: 100,
  windowMs: 60_000,
  prefix: "general",
});

export const authLimiter = createRateLimiter({
  max: 10,
  windowMs: 60_000,
  prefix: "auth",
});

// Stricter limiter for password reset / OTP request endpoints — these send
// real emails, so we cap them more aggressively per address.
export const sensitiveActionLimiter = createRateLimiter({
  max: 5,
  windowMs: 15 * 60_000,
  prefix: "sensitive",
  keyBy: (req) => {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.toLowerCase().trim()
        : "anon";
    return `${clientIp(req)}:${email}`;
  },
});
