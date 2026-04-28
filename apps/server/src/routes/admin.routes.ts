import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { adminOnly } from "../middleware/authorize.js";
import { generalLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import {
  createClientSchema,
  updateClientSchema,
  createProjectSchema,
  updateProjectSchema,
  assignClientSchema,
  createGallerySchema,
  updateGallerySchema,
  requestUploadUrlsSchema,
  confirmUploadSchema,
  updateMediaSchema,
  batchDeleteSchema,
  batchReorderSchema,
  sendNotificationSchema,
  broadcastNotificationSchema,
  createTimelineEventSchema,
  updateTimelineEventSchema,
  reorderTimelineSchema,
} from "../schemas/index.js";
import * as clientsCtrl from "../controllers/admin/clients.controller.js";
import * as projectsCtrl from "../controllers/admin/projects.controller.js";
import * as galleriesCtrl from "../controllers/admin/galleries.controller.js";
import * as mediaCtrl from "../controllers/admin/media.controller.js";
import * as notificationsCtrl from "../controllers/admin/notifications.controller.js";
import * as analyticsCtrl from "../controllers/admin/analytics.controller.js";
import * as timelineCtrl from "../controllers/admin/timeline.controller.js";

const router: ExpressRouter = Router();

router.use(authenticate);
router.use(adminOnly);
router.use(generalLimiter);

// Clients
router.get("/clients", clientsCtrl.listClients);
router.post("/clients", validate(createClientSchema), clientsCtrl.createClient);
router.get("/clients/:id", clientsCtrl.getClient);
router.put(
  "/clients/:id",
  validate(updateClientSchema),
  clientsCtrl.updateClient
);
router.delete("/clients/:id", clientsCtrl.deleteClient);

// Projects
router.get("/projects", projectsCtrl.listProjects);
router.post(
  "/projects",
  validate(createProjectSchema),
  projectsCtrl.createProject
);
router.get("/projects/:id", projectsCtrl.getProject);
router.put(
  "/projects/:id",
  validate(updateProjectSchema),
  projectsCtrl.updateProject
);
router.post("/projects/:id/archive", projectsCtrl.archiveProject);
router.post(
  "/projects/:id/assign-client",
  validate(assignClientSchema),
  projectsCtrl.assignClient
);
router.delete("/projects/:id/clients/:clientId", projectsCtrl.removeClient);
router.get("/projects/:id/stats", projectsCtrl.getStats);

// Galleries
router.get("/projects/:projectId/galleries", galleriesCtrl.listGalleries);
router.post(
  "/projects/:projectId/galleries",
  validate(createGallerySchema),
  galleriesCtrl.createGallery
);

router.get("/galleries/:id", galleriesCtrl.getGallery);
router.put(
  "/galleries/:id",
  validate(updateGallerySchema),
  galleriesCtrl.updateGallery
);
router.delete("/galleries/:id", galleriesCtrl.deleteGallery);
router.post("/galleries/:id/publish", galleriesCtrl.publishGallery);
router.post("/galleries/:id/expire", galleriesCtrl.expireGallery);

// Media
router.post(
  "/galleries/:galleryId/media/upload-urls",
  validate(requestUploadUrlsSchema),
  mediaCtrl.getUploadUrls
);
router.post(
  "/galleries/:galleryId/media/confirm-upload",
  validate(confirmUploadSchema),
  mediaCtrl.confirmUpload
);
router.get("/galleries/:galleryId/media", mediaCtrl.listMedia);
router.put("/media/:id", validate(updateMediaSchema), mediaCtrl.updateMedia);
router.delete("/media/:id", mediaCtrl.deleteMedia);
router.post(
  "/media/batch-delete",
  validate(batchDeleteSchema),
  mediaCtrl.batchDelete
);
router.post(
  "/media/batch-reorder",
  validate(batchReorderSchema),
  mediaCtrl.batchReorder
);

// Notifications
router.post(
  "/notifications/send",
  validate(sendNotificationSchema),
  notificationsCtrl.sendNotification
);
router.post(
  "/notifications/broadcast",
  validate(broadcastNotificationSchema),
  notificationsCtrl.broadcastToProject
);
router.get("/notifications", notificationsCtrl.listNotifications);

// Analytics
router.get("/analytics/dashboard", analyticsCtrl.getDashboardStats);
router.get("/analytics/downloads", analyticsCtrl.getDownloadAnalytics);
router.get("/analytics/storage", analyticsCtrl.getStorageUsage);
router.get("/analytics/activity", analyticsCtrl.getActivityFeed);

// Wedding Timeline
router.get("/projects/:projectId/timeline", timelineCtrl.listEvents);
router.post(
  "/projects/:projectId/timeline",
  validate(createTimelineEventSchema),
  timelineCtrl.createEvent
);
router.put(
  "/projects/:projectId/timeline/reorder",
  validate(reorderTimelineSchema),
  timelineCtrl.reorderEvents
);
router.put(
  "/timeline-events/:id",
  validate(updateTimelineEventSchema),
  timelineCtrl.updateEvent
);
router.delete("/timeline-events/:id", timelineCtrl.deleteEvent);

export default router;
