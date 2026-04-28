import { Worker, Job } from "bullmq";
import sharp from "sharp";
import { encode } from "blurhash";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@ogp/db";
import { s3Client } from "../config/aws.js";
import { env } from "../config/env.js";
import { redis } from "../config/redis.js";
import { getStorageKey } from "../utils/s3.js";

interface MediaProcessingJobData {
  mediaItemId: string;
}

async function streamToBuffer(
  stream: NodeJS.ReadableStream
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function processMedia(job: Job<MediaProcessingJobData>): Promise<void> {
  const { mediaItemId } = job.data;

  const media = await prisma.mediaItem.findUnique({
    where: { id: mediaItemId },
    include: {
      project: { select: { watermarkText: true } },
    },
  });

  if (!media) {
    throw new Error(`MediaItem ${mediaItemId} not found`);
  }

  if (media.type !== "PHOTO") {
    return;
  }

  const watermarkText =
    media.project.watermarkText?.trim() || "Omee Ganatra Productions";

  await job.updateProgress(5);

  // Download original from S3
  const getCommand = new GetObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: media.storageKeyOriginal,
  });

  const response = await s3Client.send(getCommand);
  if (!response.Body) {
    throw new Error(`Failed to fetch ${media.storageKeyOriginal} from S3`);
  }

  const originalBuffer = await streamToBuffer(
    response.Body as NodeJS.ReadableStream
  );

  await job.updateProgress(15);

  // Extract EXIF / metadata
  const metadata = await sharp(originalBuffer).metadata();
  const exifData: Record<string, unknown> = {};

  if (metadata.width) exifData.width = metadata.width;
  if (metadata.height) exifData.height = metadata.height;
  if (metadata.density) exifData.density = metadata.density;
  if (metadata.chromaSubsampling)
    exifData.chromaSubsampling = metadata.chromaSubsampling;
  if (metadata.space) exifData.colorSpace = metadata.space;
  if (metadata.hasAlpha) exifData.hasAlpha = metadata.hasAlpha;
  if (metadata.orientation) exifData.orientation = metadata.orientation;
  if (metadata.format) exifData.format = metadata.format;

  await job.updateProgress(20);

  // Generate thumbnail (400px wide, WebP, quality 80)
  const thumbnailBuffer = await sharp(originalBuffer)
    .resize(400, undefined, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const thumbnailKey = getStorageKey(
    media.projectId,
    media.galleryId,
    media.id,
    "thumbnails",
    "thumb.webp"
  );

  await job.updateProgress(35);

  // Generate display version (1600px wide, WebP, quality 85)
  const displayBuffer = await sharp(originalBuffer)
    .resize(1600, undefined, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  const displayKey = getStorageKey(
    media.projectId,
    media.galleryId,
    media.id,
    "display",
    "display.webp"
  );

  await job.updateProgress(50);

  // Generate watermarked version with diagonal text overlay
  const displayMeta = await sharp(displayBuffer).metadata();
  const wmWidth = displayMeta.width || 1600;
  const wmHeight = displayMeta.height || 1200;
  const fontSize = Math.max(24, Math.floor(wmWidth / 20));

  // Create repeating diagonal watermark SVG
  const watermarkSvg = Buffer.from(`
    <svg width="${wmWidth}" height="${wmHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .watermark {
            fill: rgba(255, 255, 255, 0.3);
            font-size: ${fontSize}px;
            font-family: Arial, Helvetica, sans-serif;
            font-weight: bold;
          }
        </style>
      </defs>
      <text
        x="50%"
        y="35%"
        text-anchor="middle"
        dominant-baseline="middle"
        class="watermark"
        transform="rotate(-30, ${wmWidth / 2}, ${wmHeight * 0.35})"
      >${watermarkText}</text>
      <text
        x="50%"
        y="65%"
        text-anchor="middle"
        dominant-baseline="middle"
        class="watermark"
        transform="rotate(-30, ${wmWidth / 2}, ${wmHeight * 0.65})"
      >${watermarkText}</text>
    </svg>
  `);

  const watermarkOverlay = await sharp(watermarkSvg)
    .resize(wmWidth, wmHeight, { fit: "fill" })
    .png()
    .toBuffer();

  const watermarkedBuffer = await sharp(originalBuffer)
    .resize(1600, undefined, { fit: "inside", withoutEnlargement: true })
    .composite([
      {
        input: watermarkOverlay,
        gravity: "center",
      },
    ])
    .webp({ quality: 85 })
    .toBuffer();

  const watermarkedKey = getStorageKey(
    media.projectId,
    media.galleryId,
    media.id,
    "watermarked",
    "watermarked.webp"
  );

  await job.updateProgress(65);

  // Compute blurhash from thumbnail
  const { data: rawPixels, info } = await sharp(thumbnailBuffer)
    .resize(32, 32, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const blurhash = encode(
    new Uint8ClampedArray(rawPixels),
    info.width,
    info.height,
    4,
    3
  );

  await job.updateProgress(75);

  // Upload all variants to S3
  await Promise.all([
    s3Client.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: thumbnailKey,
        Body: thumbnailBuffer,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      })
    ),
    s3Client.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: displayKey,
        Body: displayBuffer,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      })
    ),
    s3Client.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: watermarkedKey,
        Body: watermarkedBuffer,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      })
    ),
  ]);

  await job.updateProgress(90);

  // Update MediaItem and Gallery in a transaction
  await prisma.$transaction([
    prisma.mediaItem.update({
      where: { id: mediaItemId },
      data: {
        storageKeyThumbnail: thumbnailKey,
        storageKeyMedium: displayKey,
        storageKeyWatermarked: watermarkedKey,
        width: metadata.width || null,
        height: metadata.height || null,
        blurhash,
        exifData:
          Object.keys(exifData).length > 0
            ? (exifData as Record<string, string | number | boolean>)
            : undefined,
      },
    }),
    prisma.gallery.update({
      where: { id: media.galleryId },
      data: {
        mediaCount: { increment: 1 },
        totalSizeBytes: { increment: media.fileSizeBytes },
      },
    }),
  ]);

  await job.updateProgress(100);

  console.log(
    `[media-processing] Successfully processed MediaItem ${mediaItemId}`
  );
}

const worker = new Worker<MediaProcessingJobData>(
  "media-processing",
  processMedia,
  {
    connection: redis,
    concurrency: 2,
    limiter: {
      max: 5,
      duration: 60_000,
    },
  }
);

worker.on("completed", (job) => {
  console.log(`[media-processing] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(
    `[media-processing] Job ${job?.id} failed:`,
    err.message
  );
});

worker.on("error", (err) => {
  console.error("[media-processing] Worker error:", err);
});

export { worker as mediaProcessingWorker };
