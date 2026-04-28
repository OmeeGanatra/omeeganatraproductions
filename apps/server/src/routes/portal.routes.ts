import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { clientOnly } from "../middleware/authorize.js";
import { generalLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import {
  verifyGalleryPasswordSchema,
  requestZipDownloadSchema,
  addFavoriteSchema,
} from "../schemas/index.js";
import * as projectsCtrl from "../controllers/portal/projects.controller.js";
import * as galleriesCtrl from "../controllers/portal/galleries.controller.js";
import * as mediaCtrl from "../controllers/portal/media.controller.js";
import * as favoritesCtrl from "../controllers/portal/favorites.controller.js";
import * as notificationsCtrl from "../controllers/portal/notifications.controller.js";

const router: ExpressRouter = Router();

router.use(authenticate);
router.use(clientOnly);
router.use(generalLimiter);

// Projects
router.get("/projects", projectsCtrl.listProjects);
router.get("/projects/:slug", projectsCtrl.getProject);
router.get("/projects/:slug/galleries", projectsCtrl.listGalleries);

// Galleries
router.get("/galleries/:id/media", galleriesCtrl.getGalleryMedia);
router.post(
  "/galleries/:id/verify-password",
  validate(verifyGalleryPasswordSchema),
  galleriesCtrl.verifyPassword
);

// Media
router.get("/media/:id/download-url", mediaCtrl.getDownloadUrl);
router.post(
  "/galleries/:id/download-zip",
  validate(requestZipDownloadSchema),
  mediaCtrl.requestZipDownload
);

// Favorites
router.get("/favorites", favoritesCtrl.listFavorites);
router.post("/favorites", validate(addFavoriteSchema), favoritesCtrl.addFavorite);
router.delete("/favorites/:mediaItemId", favoritesCtrl.removeFavorite);

// Notifications
router.get("/notifications", notificationsCtrl.listNotifications);
router.put("/notifications/:id/read", notificationsCtrl.markRead);

export default router;
