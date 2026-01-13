// Avatar configuration
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;
export const MAX_USER_AVATAR_SIZE = 2 * 1024 * 1024;
export const MAX_DEVICE_AVATAR_SIZE = 5 * 1024 * 1024;
export const THUMBNAIL_SIZE = 64;
export const AVATAR_SIZE = 256;
export const AVATAR_STORAGE_BASE = "public/avatars";
export const USER_AVATAR_PATH = `${AVATAR_STORAGE_BASE}/users`;
export const DEVICE_AVATAR_PATH = `${AVATAR_STORAGE_BASE}/devices`;
export const AVATAR_URL_BASE = "/avatars";
export const USER_AVATAR_URL = `${AVATAR_URL_BASE}/users`;
export const DEVICE_AVATAR_URL = `${AVATAR_URL_BASE}/devices`;
export type AvatarEntityType = "user" | "device";

export const avatarConfig = {
  allowedMimeTypes: ALLOWED_MIME_TYPES,
  allowedExtensions: ALLOWED_EXTENSIONS,
  maxSizes: { user: MAX_USER_AVATAR_SIZE, device: MAX_DEVICE_AVATAR_SIZE },
  dimensions: { avatar: AVATAR_SIZE, thumbnail: THUMBNAIL_SIZE },
  paths: { base: AVATAR_STORAGE_BASE, user: USER_AVATAR_PATH, device: DEVICE_AVATAR_PATH },
  urls: { base: AVATAR_URL_BASE, user: USER_AVATAR_URL, device: DEVICE_AVATAR_URL },
} as const;
