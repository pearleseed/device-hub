import { db } from "../db/connection";
import { requireAdmin } from "../middleware/auth";
import { validateAvatarFile } from "../services/file-validator";
import { processAvatar } from "../services/image-processor";
import { storeAvatar, deleteAvatar } from "../services/storage-service";
import { ok, err, notFound, forbidden, parseId, withAuth, withAdmin } from "./_helpers";
import type { AvatarEntityType } from "../config/avatar";
import type { UserPublic, Device } from "../types";

const extractFile = async (req: Request): Promise<{ file: File | null; error?: string }> => {
  try {
    const formData = await req.formData();
    const file = formData.get("avatar");
    return file instanceof File ? { file } : { file: null, error: "No file provided" };
  } catch { return { file: null, error: "Failed to parse form data" }; }
};

const uploadAvatar = async (
  request: Request, entityType: AvatarEntityType, entityId: number, checkOwnership: (payload: { userId: number }) => boolean
): Promise<Response> => {
  return withAuth(request, async (payload) => {
    try {
      if (!checkOwnership(payload)) return forbidden();

      const table = entityType === "user" ? "users" : "devices";
      const [entity] = await db.unsafe<{ id: number }[]>(`SELECT id FROM ${table} WHERE id = ?`, [entityId]);
      if (!entity) return notFound(entityType === "user" ? "User" : "Device");

      const { file, error: extractErr } = await extractFile(request);
      if (!file) return err(extractErr || "No file provided");

      const validation = validateAvatarFile({ size: file.size, mimeType: file.type }, entityType);
      if (!validation.valid) return err(validation.error!);

      const processed = await processAvatar(Buffer.from(await file.arrayBuffer()), file.type);
      const storage = await storeAvatar(processed, entityType, entityId);
      if (!storage.success) return err(storage.error || "Failed to store avatar", 500);

      if (entityType === "user") {
        await db`UPDATE users SET avatar_url = ${storage.originalUrl}, avatar_thumbnail_url = ${storage.thumbnailUrl} WHERE id = ${entityId}`;
      } else {
        await db`UPDATE devices SET image_url = ${storage.originalUrl}, image_thumbnail_url = ${storage.thumbnailUrl} WHERE id = ${entityId}`;
      }

      return ok({ avatarUrl: storage.originalUrl, thumbnailUrl: storage.thumbnailUrl });
    } catch (e) { console.error(`Upload ${entityType} avatar error:`, e); return err("Failed to upload avatar", 500); }
  });
};

const deleteAvatarHandler = async (
  request: Request, entityType: AvatarEntityType, entityId: number, checkOwnership: (payload: { userId: number }) => boolean
): Promise<Response> => {
  return withAuth(request, async (payload) => {
    try {
      if (!checkOwnership(payload)) return forbidden();

      const table = entityType === "user" ? "users" : "devices";
      const urlCol = entityType === "user" ? "avatar_url" : "image_url";
      const [entity] = await db.unsafe<{ id: number; [key: string]: unknown }[]>(`SELECT id, ${urlCol} FROM ${table} WHERE id = ?`, [entityId]);
      if (!entity) return notFound(entityType === "user" ? "User" : "Device");
      if (entityType === "user" && !entity[urlCol]) return notFound("Avatar");

      if (!(await deleteAvatar(entityType, entityId))) return err("Failed to delete avatar", 500);

      if (entityType === "user") {
        await db`UPDATE users SET avatar_url = NULL, avatar_thumbnail_url = NULL WHERE id = ${entityId}`;
      } else {
        await db`UPDATE devices SET image_url = '/placeholder.svg', image_thumbnail_url = NULL WHERE id = ${entityId}`;
      }

      return ok(null, entityType === "user" ? "Avatar deleted successfully" : "Device image deleted successfully");
    } catch (e) { console.error(`Delete ${entityType} avatar error:`, e); return err("Failed to delete avatar", 500); }
  });
};

export const avatarsRoutes = {
  async uploadUserAvatar(request: Request, params: Record<string, string>): Promise<Response> {
    const userId = parseId(params.userId);
    if (!userId) return err("Invalid user ID");
    return uploadAvatar(request, "user", userId, (p) => p.userId === userId || requireAdmin({ userId: p.userId, email: "", role: "admin", exp: 0 }));
  },

  async uploadDeviceAvatar(request: Request, params: Record<string, string>): Promise<Response> {
    const deviceId = parseId(params.deviceId);
    if (!deviceId) return err("Invalid device ID");
    return withAdmin(request, async (payload) => uploadAvatar(request, "device", deviceId, () => true));
  },

  async deleteUserAvatar(request: Request, params: Record<string, string>): Promise<Response> {
    const userId = parseId(params.userId);
    if (!userId) return err("Invalid user ID");
    return deleteAvatarHandler(request, "user", userId, (p) => p.userId === userId || requireAdmin({ userId: p.userId, email: "", role: "admin", exp: 0 }));
  },

  async deleteDeviceAvatar(request: Request, params: Record<string, string>): Promise<Response> {
    const deviceId = parseId(params.deviceId);
    if (!deviceId) return err("Invalid device ID");
    return withAdmin(request, async () => deleteAvatarHandler(request, "device", deviceId, () => true));
  },
};
