/**
 * Avatar configuration constants
 */

// Allowed MIME types for avatar uploads
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

// Allowed file extensions
export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

// Maximum file sizes in bytes
export const MAX_USER_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB for user avatars
export const MAX_DEVICE_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB for device avatars

// Thumbnail dimensions
export const THUMBNAIL_SIZE = 64; // 64x64 pixels for thumbnails
export const AVATAR_SIZE = 256; // 256x256 pixels for full avatars

// Storage paths (relative to project root)
export const AVATAR_STORAGE_BASE = "public/avatars";
export const USER_AVATAR_PATH = `${AVATAR_STORAGE_BASE}/users`;
export const DEVICE_AVATAR_PATH = `${AVATAR_STORAGE_BASE}/devices`;

// URL paths for serving avatars
export const AVATAR_URL_BASE = "/avatars";
export const USER_AVATAR_URL = `${AVATAR_URL_BASE}/users`;
export const DEVICE_AVATAR_URL = `${AVATAR_URL_BASE}/devices`;

// Entity types
export type AvatarEntityType = "user" | "device";

// Configuration object for easy access
export const avatarConfig = {
  allowedMimeTypes: ALLOWED_MIME_TYPES,
  allowedExtensions: ALLOWED_EXTENSIONS,
  maxSizes: {
    user: MAX_USER_AVATAR_SIZE,
    device: MAX_DEVICE_AVATAR_SIZE,
  },
  dimensions: {
    avatar: AVATAR_SIZE,
    thumbnail: THUMBNAIL_SIZE,
  },
  paths: {
    base: AVATAR_STORAGE_BASE,
    user: USER_AVATAR_PATH,
    device: DEVICE_AVATAR_PATH,
  },
  urls: {
    base: AVATAR_URL_BASE,
    user: USER_AVATAR_URL,
    device: DEVICE_AVATAR_URL,
  },
} as const;
