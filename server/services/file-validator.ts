/**
 * File Validator Service - Validates uploaded files
 */
import { ALLOWED_MIME_TYPES, MAX_USER_AVATAR_SIZE, MAX_DEVICE_AVATAR_SIZE, type AvatarEntityType } from "../config/avatar";

export interface ValidationResult { valid: boolean; error?: string; }
export interface FileToValidate { size: number; mimeType: string; }

export const getMaxSizeForEntity = (t: AvatarEntityType) => t === "user" ? MAX_USER_AVATAR_SIZE : MAX_DEVICE_AVATAR_SIZE;
export const getMaxSizeMBForEntity = (t: AvatarEntityType) => t === "user" ? 2 : 5;

export function validateAvatarFile(file: FileToValidate, entityType: AvatarEntityType): ValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(file.mimeType as typeof ALLOWED_MIME_TYPES[number])) {
    return { valid: false, error: "Invalid file format. Allowed: JPEG, PNG, WebP" };
  }
  const maxSize = getMaxSizeForEntity(entityType);
  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds maximum allowed (${maxSize / (1024 * 1024)}MB)` };
  }
  return { valid: true };
}
