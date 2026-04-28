import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import portalRoutes from "./routes/portal.routes.js";
import publicRoutes from "./routes/public.routes.js";
import healthRoutes from "./routes/health.routes.js";

// Start BullMQ workers in-process by default. For larger deploys, set
// DISABLE_INPROCESS_WORKERS=1 and run a dedicated worker service that imports
// these modules instead.
if (process.env.DISABLE_INPROCESS_WORKERS !== "1") {
  void (async () => {
    await import("./jobs/mediaProcessor.js");
    await import("./jobs/zipGenerator.js");

    const { checkAndExpireGalleries } = await import(
      "./jobs/galleryExpiration.js"
    );
    // Run gallery expiration every 15 minutes. Each invocation is idempotent.
    setInterval(() => {
      checkAndExpireGalleries().catch((err) =>
        console.error("[gallery-expiration]", err)
      );
    }, 15 * 60 * 1000);

    console.log("[server] BullMQ workers + expiration cron started in-process");
  })();
}

const app: Express = express();

// Trust the first proxy in front of the app (ALB / CloudFront / nginx) so
// req.ip and X-Forwarded-For are honored for rate limiting and audit logs.
app.set("trust proxy", 1);

// Security
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Gallery-Session"],
  })
);

// Parsing — file uploads go directly to S3 via presigned URLs, so the server
// only ever sees JSON metadata. 1mb is generous for that.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// Logging
if (env.NODE_ENV !== "test") {
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
}

// Routes
app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/portal", portalRoutes);
app.use("/api/public", publicRoutes);

// 404 for unmatched API routes
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler (must be last)
app.use(errorHandler);

// Start
app.listen(env.PORT, () => {
  console.log(`
  ┌─────────────────────────────────────────────────────┐
  │                                                     │
  │   🎬  Omee Ganatra Productions API                  │
  │                                                     │
  │   Server:  http://localhost:${env.PORT}                  │
  │   Mode:    ${env.NODE_ENV.padEnd(12)}                      │
  │   CORS:    ${env.CORS_ORIGIN.slice(0, 30).padEnd(12)}                      │
  │                                                     │
  └─────────────────────────────────────────────────────┘
  `);
});

export default app;
