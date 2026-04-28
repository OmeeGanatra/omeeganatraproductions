import { z } from "zod";

// ─── Primitives ──────────────────────────────────────────────────────────────

export const uuid = z.string().uuid("Must be a valid UUID");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email address")
  .max(254);

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters");

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const eventTypeEnum = z.enum([
  "WEDDING",
  "ENGAGEMENT",
  "PORTRAIT",
  "COMMERCIAL",
  "OTHER",
]);

const projectStatusEnum = z.enum([
  "DRAFT",
  "ACTIVE",
  "DELIVERED",
  "ARCHIVED",
]);

const notificationTypeEnum = z.enum([
  "GALLERY_READY",
  "NEW_PHOTOS",
  "DOWNLOAD_READY",
  "SHARE_RECEIVED",
  "EXPIRY_WARNING",
  "PRINT_UPDATE",
  "SYSTEM",
]);

const notificationChannelEnum = z.enum(["IN_APP", "EMAIL", "PUSH", "SMS"]);

// ─── Auth ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const otpVerifySchema = z.object({
  challengeId: uuid,
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
  type: z.enum(["admin", "client"]).default("client"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  password: passwordSchema,
  type: z.enum(["admin", "client"]).default("client"),
});

export const updateMeSchema = z
  .object({
    fullName: z.string().min(1).max(120).optional(),
    phone: z.string().max(40).optional().nullable(),
    avatarUrl: z.string().url().max(2048).optional().nullable(),
    currentPassword: z.string().min(1).max(128).optional(),
    newPassword: passwordSchema.optional(),
  })
  .refine(
    (v) =>
      (v.currentPassword === undefined && v.newPassword === undefined) ||
      (v.currentPassword !== undefined && v.newPassword !== undefined),
    {
      message: "currentPassword and newPassword must be supplied together",
      path: ["newPassword"],
    }
  );

// ─── Clients (admin) ────────────────────────────────────────────────────────

export const createClientSchema = z.object({
  email: emailSchema,
  fullName: z.string().min(1).max(120),
  phone: z.string().max(40).optional().nullable(),
});

export const updateClientSchema = z.object({
  fullName: z.string().min(1).max(120).optional(),
  email: emailSchema.optional(),
  phone: z.string().max(40).optional().nullable(),
  avatarUrl: z.string().url().max(2048).optional().nullable(),
  notificationPreferences: z.record(z.unknown()).optional(),
});

// ─── Projects (admin) ───────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  eventDate: z.string().datetime().optional().nullable(),
  eventType: eventTypeEnum,
  venue: z.string().max(200).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  watermarkText: z.string().min(1).max(120).optional().nullable(),
  settings: z.record(z.unknown()).optional(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  status: projectStatusEnum.optional(),
  coverImageUrl: z.string().url().max(2048).optional().nullable(),
});

export const assignClientSchema = z.object({
  clientId: uuid,
  role: z.enum(["PRIMARY", "FAMILY", "GUEST"]).default("PRIMARY"),
});

// ─── Galleries ──────────────────────────────────────────────────────────────

export const createGallerySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  isPublic: z.boolean().optional(),
  password: passwordSchema.optional().nullable(),
  downloadEnabled: z.boolean().optional(),
  downloadPin: z.string().min(4).max(20).optional().nullable(),
  watermarkEnabled: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  sortOrder: z.number().int().min(0).max(100_000).optional(),
});

export const updateGallerySchema = createGallerySchema.partial().extend({
  coverImageUrl: z.string().url().max(2048).optional().nullable(),
});

export const verifyGalleryPasswordSchema = z.object({
  password: z.string().min(1).max(128),
});

// ─── Media (admin) ──────────────────────────────────────────────────────────

export const requestUploadUrlsSchema = z.object({
  files: z
    .array(
      z.object({
        filename: z.string().min(1).max(500),
        contentType: z.string().min(1).max(120),
        size: z.number().int().positive().max(10 * 1024 * 1024 * 1024),
      })
    )
    .min(1)
    .max(50),
});

export const confirmUploadSchema = z.object({
  mediaIds: z.array(uuid).min(1).max(100),
});

export const updateMediaSchema = z.object({
  isHighlight: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(1_000_000).optional(),
});

export const batchDeleteSchema = z.object({
  mediaIds: z.array(uuid).min(1).max(500),
});

export const batchReorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: uuid,
        sortOrder: z.number().int().min(0).max(1_000_000),
      })
    )
    .min(1)
    .max(1000),
});

// ─── Media (portal) ─────────────────────────────────────────────────────────

export const requestZipDownloadSchema = z.object({
  mediaIds: z.array(uuid).min(1).max(2000).optional(),
});

// ─── Favorites ──────────────────────────────────────────────────────────────

export const addFavoriteSchema = z.object({
  mediaItemId: uuid,
  note: z.string().max(500).optional().nullable(),
});

// ─── Notifications (admin) ──────────────────────────────────────────────────

export const sendNotificationSchema = z.object({
  clientId: uuid,
  type: notificationTypeEnum,
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  channel: notificationChannelEnum.optional(),
});

export const broadcastNotificationSchema = z.object({
  projectId: uuid,
  type: notificationTypeEnum,
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
});

// ─── Timeline ───────────────────────────────────────────────────────────────

export const createTimelineEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  eventTime: z.string().datetime(),
  endTime: z.string().datetime().optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  icon: z.string().max(60).optional().nullable(),
  galleryId: uuid.optional().nullable(),
});

export const updateTimelineEventSchema = createTimelineEventSchema.partial();

export const reorderTimelineSchema = z.object({
  orderedIds: z.array(uuid).min(1).max(1000),
});

// ─── Public share ───────────────────────────────────────────────────────────

export const verifySharePasswordSchema = z.object({
  password: z.string().min(1).max(128),
});
