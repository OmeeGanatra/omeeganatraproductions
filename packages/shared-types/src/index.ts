// Shared type definitions for Omee Ganatra Productions

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR";
export type EventType = "WEDDING" | "ENGAGEMENT" | "PORTRAIT" | "COMMERCIAL" | "OTHER";
export type ProjectStatus = "DRAFT" | "ACTIVE" | "DELIVERED" | "ARCHIVED";
export type GalleryStatus = "DRAFT" | "PUBLISHED" | "EXPIRED";
export type MediaType = "PHOTO" | "VIDEO";
export type ClientRole = "PRIMARY" | "FAMILY" | "GUEST";

export interface ApiResponse<T> {
  data: T;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
  type: "admin" | "client";
}

export interface LoginResponse {
  accessToken: string;
  user: UserProfile;
  requires_otp?: boolean;
}

export interface ProjectSummary {
  id: string;
  title: string;
  slug: string;
  description?: string;
  eventDate?: string;
  eventType: EventType;
  venue?: string;
  city?: string;
  coverImageUrl?: string;
  status: ProjectStatus;
}

export interface GallerySummary {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  mediaCount: number;
  status: GalleryStatus;
  downloadEnabled: boolean;
  watermarkEnabled: boolean;
}

export interface MediaItemSummary {
  id: string;
  type: MediaType;
  filenameOriginal: string;
  storageKeyThumbnail: string;
  storageKeyMedium: string;
  storageKeyOriginal: string;
  storageKeyWatermarked?: string;
  width?: number;
  height?: number;
  fileSizeBytes: string;
  blurhash?: string;
  videoUrl?: string;
  videoDurationSeconds?: number;
  isHighlight: boolean;
  sortOrder: number;
}
