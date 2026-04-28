import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { generalLimiter, authLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import { verifySharePasswordSchema } from "../schemas/index.js";
import {
  resolveShareLink,
  verifySharePassword,
  getShareMedia,
} from "../controllers/public.controller.js";

const router: ExpressRouter = Router();

router.use(generalLimiter);

router.get("/s/:token", resolveShareLink);
router.post(
  "/s/:token/verify",
  authLimiter,
  validate(verifySharePasswordSchema),
  verifySharePassword
);
router.get("/s/:token/media", getShareMedia);

export default router;
