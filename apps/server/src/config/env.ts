import { z } from "zod";
import dotenv from "dotenv";
import path from "path";

// Load .env from monorepo root (for local dev). In production, env vars must
// already be present in process.env — defaults below are only used in
// development.
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// In production, every secret must be supplied explicitly. We refuse to fall
// back to the dev placeholders below.
const requireInProd = <T extends z.ZodType>(schema: T, name: string): T => {
  if (!isProduction) return schema;
  return schema.refine((value) => {
    if (typeof value !== "string") return value !== undefined;
    return value.length > 0;
  }, `${name} must be set in production`) as unknown as T;
};

const isPlaceholder = (value: string, placeholders: string[]): boolean =>
  placeholders.some((p) => value === p || value.includes(p));

const secretSchema = (name: string, devDefault: string, placeholders: string[]) =>
  z
    .string()
    .min(1, `${name} is required`)
    .default(devDefault)
    .superRefine((value, ctx) => {
      if (isProduction && isPlaceholder(value, placeholders)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${name} is set to a development placeholder; refusing to start in production`,
        });
      }
      if (name.startsWith("JWT_") && value.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${name} must be at least 32 characters`,
        });
      }
    });

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: requireInProd(
    z.string().default("postgresql://ogp:ogp_secret@localhost:5432/ogp_dev"),
    "DATABASE_URL"
  ),
  REDIS_URL: requireInProd(
    z.string().default("redis://localhost:6379"),
    "REDIS_URL"
  ),
  JWT_ACCESS_SECRET: secretSchema(
    "JWT_ACCESS_SECRET",
    "dev-access-secret-change-in-production-min32chars!!",
    ["change-in-production", "dev-access-secret"]
  ),
  JWT_REFRESH_SECRET: secretSchema(
    "JWT_REFRESH_SECRET",
    "dev-refresh-secret-change-in-production-min32chars!",
    ["change-in-production", "dev-refresh-secret"]
  ),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY_DAYS: z.coerce.number().default(14),

  // Object storage — works with AWS S3 or any S3-compatible service
  // (Cloudflare R2, Backblaze B2, MinIO).
  AWS_ACCESS_KEY_ID: secretSchema(
    "AWS_ACCESS_KEY_ID",
    "minioadmin",
    ["minioadmin"]
  ),
  AWS_SECRET_ACCESS_KEY: secretSchema(
    "AWS_SECRET_ACCESS_KEY",
    "minioadmin",
    ["minioadmin"]
  ),
  AWS_REGION: z.string().default("us-east-1"),
  AWS_S3_BUCKET: requireInProd(z.string().default("ogp-media"), "AWS_S3_BUCKET"),
  AWS_S3_ENDPOINT: z.string().optional(),
  AWS_S3_FORCE_PATH_STYLE: z
    .union([z.string(), z.boolean()])
    .transform((v) => v === true || v === "true" || v === "1")
    .default(false),
  AWS_CLOUDFRONT_DOMAIN: requireInProd(
    z.string().default("localhost:4000"),
    "AWS_CLOUDFRONT_DOMAIN"
  ),

  // Email — provider can be "ses" (AWS) or "resend" (recommended for the
  // Vercel/Railway path).
  EMAIL_PROVIDER: z.enum(["ses", "resend"]).default("resend"),
  EMAIL_FROM: requireInProd(
    z.string().email().default("noreply@omeeganatra.com"),
    "EMAIL_FROM"
  ),
  RESEND_API_KEY: z.string().optional(),

  CORS_ORIGIN: requireInProd(
    z.string().default("http://localhost:3000"),
    "CORS_ORIGIN"
  ),
  APP_URL: z.string().default("http://localhost:3000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  for (const [field, errors] of Object.entries(parsed.error.flatten().fieldErrors)) {
    if (errors) console.error(`  ${field}: ${errors.join(", ")}`);
  }
  process.exit(1);
}

export const env = parsed.data;
