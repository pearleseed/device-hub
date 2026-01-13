/**
 * Storage Service - Avatar file storage and deletion
 */
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { USER_AVATAR_PATH, DEVICE_AVATAR_PATH, USER_AVATAR_URL, DEVICE_AVATAR_URL, type AvatarEntityType } from "../config/avatar";
import type { ProcessedImage } from "./image-processor";

export interface StorageResult {
  success: boolean;
  originalPath?: string;
  thumbnailPath?: string;
  originalUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

const MIME_EXT: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };
const getPath = (t: AvatarEntityType) => t === "user" ? USER_AVATAR_PATH : DEVICE_AVATAR_PATH;
const getUrl = (t: AvatarEntityType) => t === "user" ? USER_AVATAR_URL : DEVICE_AVATAR_URL;
const genFilename = (id: number, mime: string, suffix?: string) => 
  `${id}_${randomUUID().slice(0, 8)}${suffix ? `_${suffix}` : ""}${MIME_EXT[mime] || ".jpg"}`;

const ensureDir = async (dir: string) => { try { await fs.access(dir); } catch { await fs.mkdir(dir, { recursive: true }); } };

const deleteExisting = async (entityType: AvatarEntityType, entityId: number) => {
  const dir = getPath(entityType);
  try {
    const files = await fs.readdir(dir);
    await Promise.all(files.filter(f => f.startsWith(`${entityId}_`)).map(f => fs.unlink(path.join(dir, f)).catch(() => {})));
  } catch { /* dir may not exist */ }
};

export async function storeAvatar(img: ProcessedImage, entityType: AvatarEntityType, entityId: number): Promise<StorageResult> {
  const dir = getPath(entityType), urlBase = getUrl(entityType);
  try {
    await ensureDir(dir);
    await deleteExisting(entityType, entityId);
    const origName = genFilename(entityId, img.mimeType);
    const thumbName = genFilename(entityId, img.mimeType, "thumb");
    await Promise.all([
      fs.writeFile(path.join(dir, origName), img.original),
      fs.writeFile(path.join(dir, thumbName), img.thumbnail),
    ]);
    return { success: true, originalPath: path.join(dir, origName), thumbnailPath: path.join(dir, thumbName), originalUrl: `${urlBase}/${origName}`, thumbnailUrl: `${urlBase}/${thumbName}` };
  } catch (e) {
    return { success: false, error: `Failed to store avatar: ${e instanceof Error ? e.message : "Unknown"}` };
  }
}

export const deleteAvatar = async (entityType: AvatarEntityType, entityId: number): Promise<boolean> => {
  try { await deleteExisting(entityType, entityId); return true; } catch { return false; }
};

export const avatarExists = async (entityType: AvatarEntityType, entityId: number): Promise<boolean> => {
  try {
    const files = await fs.readdir(getPath(entityType));
    return files.some(f => f.startsWith(`${entityId}_`));
  } catch { return false; }
};
