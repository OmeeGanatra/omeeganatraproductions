import { Worker, Job } from "bullmq";
import archiver from "archiver";
import { Readable, PassThrough } from "stream";
import {
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@ogp/db";
import { s3Client } from "../config/aws.js";
import { env } from "../config/env.js";
import { redis } from "../config/redis.js";

interface ZipGenerationJobData {
  clientId: string;
  galleryId: string;
  projectId: string;
  galleryTitle?: string;
  // Specific media items to zip. If null/undefined, zip the whole gallery.
  mediaItemIds?: string[] | null;
}

async function generateZip(job: Job<ZipGenerationJobData>): Promise<void> {
  const { galleryId, mediaItemIds, clientId, projectId } = job.data;

  // Defensive re-check: even though the API enforces these invariants, the
  // worker independently verifies that the client has access to the project
  // and that every requested mediaId belongs to the gallery. A bug in the
  // queuer must not become a data leak.
  const access = await prisma.projectClient.findUnique({
    where: { projectId_clientId: { projectId, clientId } },
  });
  if (!access) {
    throw new Error(
      `Client ${clientId} does not have access to project ${projectId}`
    );
  }

  const gallery = await prisma.gallery.findFirst({
    where: { id: galleryId, projectId },
    select: { id: true, status: true, downloadEnabled: true },
  });
  if (!gallery || gallery.status !== "PUBLISHED" || !gallery.downloadEnabled) {
    throw new Error(`Gallery ${galleryId} is not available for download`);
  }

  const where =
    mediaItemIds && mediaItemIds.length > 0
      ? { id: { in: mediaItemIds }, galleryId, projectId }
      : { galleryId, projectId };

  const mediaItems = await prisma.mediaItem.findMany({
    where,
    select: {
      id: true,
      filenameOriginal: true,
      storageKeyOriginal: true,
      fileSizeBytes: true,
    },
  });

  if (mediaItems.length === 0) {
    throw new Error("No media items found for zip generation");
  }

  if (
    mediaItemIds &&
    mediaItemIds.length > 0 &&
    mediaItems.length !== mediaItemIds.length
  ) {
    throw new Error(
      "Requested media items do not all belong to the specified gallery"
    );
  }

  await job.updateProgress(10);

  const archive = archiver("zip", { zlib: { level: 5 } });
  const zipChunks: Buffer[] = [];
  const passthrough = new PassThrough();

  passthrough.on("data", (chunk: Buffer) => {
    zipChunks.push(chunk);
  });

  archive.pipe(passthrough);

  // De-duplicate filenames within the archive
  const usedFilenames = new Map<string, number>();

  for (let i = 0; i < mediaItems.length; i++) {
    const item = mediaItems[i]!;

    const getCommand = new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: item.storageKeyOriginal,
    });

    const response = await s3Client.send(getCommand);
    if (!response.Body) {
      console.warn(
        `[zip-generation] Skipping ${item.id}: failed to fetch from S3`
      );
      continue;
    }

    let filename = item.filenameOriginal;
    const count = usedFilenames.get(filename) || 0;
    if (count > 0) {
      const ext = filename.lastIndexOf(".");
      if (ext > 0) {
        filename = `${filename.slice(0, ext)}_${count}${filename.slice(ext)}`;
      } else {
        filename = `${filename}_${count}`;
      }
    }
    usedFilenames.set(item.filenameOriginal, count + 1);

    archive.append(response.Body as Readable, { name: filename });

    const progress = 10 + Math.floor(((i + 1) / mediaItems.length) * 70);
    await job.updateProgress(progress);
  }

  await archive.finalize();

  await new Promise<void>((resolve, reject) => {
    passthrough.on("end", resolve);
    passthrough.on("error", reject);
  });

  const zipBuffer = Buffer.concat(zipChunks);
  await job.updateProgress(85);

  const zipKey = `zips/${clientId}/${job.id}.zip`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: zipKey,
      Body: zipBuffer,
      ContentType: "application/zip",
      CacheControl: "private, max-age=86400",
    })
  );

  await job.updateProgress(90);

  const downloadUrl = await getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: zipKey,
      ResponseContentDisposition: `attachment; filename="photos.zip"`,
    }),
    { expiresIn: 86400 }
  );

  await job.updateProgress(95);

  const totalSize = mediaItems.reduce(
    (sum, item) => sum + BigInt(item.fileSizeBytes),
    BigInt(0)
  );

  await prisma.$transaction([
    prisma.notification.create({
      data: {
        recipientClientId: clientId,
        type: "DOWNLOAD_READY",
        title: "Your download is ready!",
        body: "Your photos have been packaged and are ready to download. The link expires in 24 hours.",
        data: {
          downloadUrl,
          zipKey,
          mediaCount: mediaItems.length,
          projectId,
          galleryId,
          jobId: job.id,
        },
        channel: "IN_APP",
        sentAt: new Date(),
      },
    }),
    prisma.downloadLog.create({
      data: {
        clientId,
        galleryId,
        downloadType:
          mediaItemIds && mediaItemIds.length > 0
            ? "SELECTION_ZIP"
            : "GALLERY_ZIP",
        fileCount: mediaItems.length,
        totalSizeBytes: totalSize,
      },
    }),
  ]);

  await job.updateProgress(100);

  console.log(
    `[zip-generation] Job ${job.id} completed: ${mediaItems.length} files, zip at ${zipKey}`
  );
}

const worker = new Worker<ZipGenerationJobData>(
  "zip-generation",
  generateZip,
  {
    connection: redis,
    concurrency: 1,
    limiter: {
      max: 3,
      duration: 60_000,
    },
  }
);

worker.on("completed", (job) => {
  console.log(`[zip-generation] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[zip-generation] Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("[zip-generation] Worker error:", err);
});

export { worker as zipGenerationWorker };
