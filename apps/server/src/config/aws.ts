import { S3Client } from "@aws-sdk/client-s3";
import { SESClient } from "@aws-sdk/client-ses";
import { env } from "./env.js";

// S3 client. Works with AWS S3, MinIO (local), and Cloudflare R2 / Backblaze
// B2 (set AWS_S3_ENDPOINT). For R2, set AWS_REGION="auto" and
// AWS_S3_FORCE_PATH_STYLE=true.
export const s3Client = new S3Client({
  region: env.AWS_REGION,
  endpoint: env.AWS_S3_ENDPOINT,
  forcePathStyle: env.AWS_S3_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

// SES client only used when EMAIL_PROVIDER=ses. Safe to instantiate either
// way — no network calls happen until a SendEmailCommand is dispatched.
export const sesClient = new SESClient({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});
