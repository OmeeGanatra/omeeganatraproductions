import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authLimiter, sensitiveActionLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import {
  loginSchema,
  otpVerifySchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateMeSchema,
} from "../schemas/index.js";
import {
  adminLogin,
  clientLogin,
  verifyOtp,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  updateMe,
} from "../controllers/auth.controller.js";

const router: ExpressRouter = Router();

router.post(
  "/admin/login",
  authLimiter,
  validate(loginSchema),
  adminLogin
);
router.post(
  "/client/login",
  authLimiter,
  validate(loginSchema),
  clientLogin
);
router.post(
  "/verify-otp",
  authLimiter,
  validate(otpVerifySchema),
  verifyOtp
);
router.post("/refresh", refreshToken);
router.post("/logout", authenticate, logout);
router.post(
  "/forgot-password",
  sensitiveActionLimiter,
  validate(forgotPasswordSchema),
  forgotPassword
);
router.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  resetPassword
);
router.get("/me", authenticate, getMe);
router.put("/me", authenticate, validate(updateMeSchema), updateMe);

export default router;
