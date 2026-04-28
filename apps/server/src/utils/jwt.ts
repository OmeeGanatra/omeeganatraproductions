import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env.js";

interface TokenPayload {
  id: string;
  type: "admin" | "client";
  role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as SignOptions["expiresIn"],
  });
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function verifyAccessToken(
  token: string
): (TokenPayload & jwt.JwtPayload) | null {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload &
      jwt.JwtPayload;
  } catch {
    return null;
  }
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Short-lived JWT proving the bearer has verified a gallery's password.
// Stored on the client and sent with subsequent requests for that gallery.
interface GallerySessionPayload {
  galleryId: string;
  clientId: string;
  scope: "gallery-session";
}

export function generateGallerySessionToken(
  galleryId: string,
  clientId: string
): string {
  return jwt.sign(
    { galleryId, clientId, scope: "gallery-session" } satisfies GallerySessionPayload,
    env.JWT_ACCESS_SECRET,
    { expiresIn: "4h" satisfies SignOptions["expiresIn"] }
  );
}

export function verifyGallerySessionToken(
  token: string,
  galleryId: string,
  clientId: string
): boolean {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as
      | GallerySessionPayload
      | null;
    return (
      !!decoded &&
      decoded.scope === "gallery-session" &&
      decoded.galleryId === galleryId &&
      decoded.clientId === clientId
    );
  } catch {
    return false;
  }
}

// Cryptographically random URL-safe token used for password reset links and
// any other one-shot, opaque secrets. Returns the raw token (sent to user)
// and its sha256 hash (stored in DB).
export function generateOpaqueToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

// 6-digit numeric OTP code. Returns the raw code and its sha256 hash.
export function generateOtpCode(): { code: string; codeHash: string } {
  const n = crypto.randomInt(0, 1_000_000);
  const code = n.toString().padStart(6, "0");
  return { code, codeHash: hashToken(code) };
}
