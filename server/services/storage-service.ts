/**
 * Storage Service
 * Handles avatar file storage and deletion operations.
 * Requirements: 5.1, 5.2, 5.3
 */

import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import {
  USER_AVATAR_PATH,
  DEVICE_AVATAR_PATH,
  USER_AVATAR_URL,
  DEVICE_AVATAR_URL,
  type AvatarEntityType,
} from "../config/avatar";
import type { ProcessedImage } from "./image-processor";

/**
 * Result of avatar storage operation
 */
export interface StorageResult {
  success: boolean;
  originalPath?: string;
  thumbnailPath?: string;
  originalUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

/**
 * Maps MIME types to file extensions
 */
const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

/**
 * Gets the storage directory path for a given entity type
 * @param entityType - 'user' or 'device'
 * @returns The storage directory path
 */
export function getStoragePath(entityType: AvatarEntityType): string {
  return entityType === "user" ? USER_AVATAR_PATH : DEVICE_AVATAR_PATH;
}

/**
 * Gets the URL base path for a given entity type
 * @param entityType - 'user' or 'device'
 * @returns The URL base path
 */
export function getUrlPath(entityType: AvatarEntityType): string {
  return entityType === "user" ? USER_AVATAR_URL : DEVICE_AVATAR_URL;
}

/**
 * Generates a unique filename for an avatar
 * Uses UUID to ensure uniqueness across all uploads (Requirement 5.2)
 * @param entityId - The ID of the user or device
 * @param mimeType - The MIME type of the image
 * @param suffix - Optional suffix (e.g., 'thumb' for thumbnails)
 * @returns A unique filename
 */
export function generateUniqueFilename(
  entityId: number,
  mimeType: string,
  suffix?: string,
): string {
  const extension = MIME_TO_EXTENSION[mimeType] || ".jpg";
  const uuid = randomUUID().slice(0, 8); // Use first 8 chars for brevity
  const suffixPart = suffix ? `_${suffix}` : "";
  return `${entityId}_${uuid}${suffixPart}${extension}`;
}

/**
 * Ensures the storage directory exists
 * @param dirPath - The directory path to ensure exists
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Finds and deletes existing avatar files for an entity
 * @param entityType - 'user' or 'device'
 * @param entityId - The ID of the user or device
 */
async function deleteExistingAvatars(
  entityType: AvatarEntityType,
  entityId: number,
): Promise<void> {
  const storagePath = getStoragePath(entityType);

  try {
    const files = await fs.readdir(storagePath);
    const entityPrefix = `${entityId}_`;

    // Find and delete all files matching this entity's pattern
    const deletePromises = files
      .filter((file) => file.startsWith(entityPrefix))
      .map((file) => fs.unlink(path.join(storagePath, file)).catch(() => {}));

    await Promise.all(deletePromises);
  } catch {
    // Directory might not exist yet, which is fine
  }
}

/**
 * Stores a processed avatar image to the filesystem
 * Generates unique filenames and handles both original and thumbnail versions
 * Requirements: 5.1, 5.2, 5.3
 * @param processedImage - The processed image with original and thumbnail buffers
 * @param entityType - 'user' or 'device'
 * @param entityId - The ID of the user or device
 * @returns StorageResult with paths and URLs on success, or error on failure
 */
export async function storeAvatar(
  processedImage: ProcessedImage,
  entityType: AvatarEntityType,
  entityId: number,
): Promise<StorageResult> {
  const storagePath = getStoragePath(entityType);
  const urlPath = getUrlPath(entityType);

  try {
    // Ensure storage directory exists
    await ensureDirectoryExists(storagePath);

    // Delete any existing avatars for this entity
    await deleteExistingAvatars(entityType, entityId);

    // Generate unique filenames
    const originalFilename = generateUniqueFilename(
      entityId,
      processedImage.mimeType,
    );
    const thumbnailFilename = generateUniqueFilename(
      entityId,
      processedImage.mimeType,
      "thumb",
    );

    // Build full paths
    const originalPath = path.join(storagePath, originalFilename);
    const thumbnailPath = path.join(storagePath, thumbnailFilename);

    // Write both files
    await Promise.all([
      fs.writeFile(originalPath, processedImage.original),
      fs.writeFile(thumbnailPath, processedImage.thumbnail),
    ]);

    // Build URLs for database storage
    const originalUrl = `${urlPath}/${originalFilename}`;
    const thumbnailUrl = `${urlPath}/${thumbnailFilename}`;

    return {
      success: true,
      originalPath,
      thumbnailPath,
      originalUrl,
      thumbnailUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `Failed to store avatar: ${message}`,
    };
  }
}

/**
 * Deletes avatar files for a given entity
 * Removes both original and thumbnail versions
 * Requirements: 5.1 (organized storage), 4.1, 4.2 (deletion)
 * @param entityType - 'user' or 'device'
 * @param entityId - The ID of the user or device
 * @returns true if deletion was successful or files didn't exist, false on error
 */
export async function deleteAvatar(
  entityType: AvatarEntityType,
  entityId: number,
): Promise<boolean> {
  try {
    await deleteExistingAvatars(entityType, entityId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if an avatar exists for a given entity
 * @param entityType - 'user' or 'device'
 * @param entityId - The ID of the user or device
 * @returns true if at least one avatar file exists
 */
export async function avatarExists(
  entityType: AvatarEntityType,
  entityId: number,
): Promise<boolean> {
  const storagePath = getStoragePath(entityType);

  try {
    const files = await fs.readdir(storagePath);
    const entityPrefix = `${entityId}_`;
    return files.some((file) => file.startsWith(entityPrefix));
  } catch {
    return false;
  }
}
