/**
 * Avatar Routes
 * Handles avatar upload and deletion for users and devices.
 * Requirements: 1.3, 2.4, 4.1, 4.2
 */

import { db } from "../db/connection";
import { authenticateRequest, requireAdmin } from "../middleware/auth";
import {
  validateAvatarFile,
  getMaxSizeMBForEntity,
} from "../services/file-validator";
import { processAvatar } from "../services/image-processor";
import { storeAvatar, deleteAvatar } from "../services/storage-service";
import type { AvatarEntityType } from "../config/avatar";
import type { UserPublic, Device } from "../types";

// JSON response helper
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Avatar upload response type
 */
interface AvatarUploadResponse {
  success: boolean;
  data?: {
    avatarUrl: string;
    thumbnailUrl: string;
  };
  error?: string;
}

/**
 * Avatar delete response type
 */
interface AvatarDeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Extracts file data from multipart form data
 */
async function extractFileFromRequest(
  request: Request,
): Promise<{ file: File | null; error?: string }> {
  try {
    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!file || !(file instanceof File)) {
      return { file: null, error: "No file provided" };
    }

    return { file };
  } catch (error) {
    return { file: null, error: "Failed to parse form data" };
  }
}

export const avatarsRoutes = {
  /**
   * POST /api/avatars/user/:userId
   * Upload or update a user's avatar
   * Requirements: 1.3, 1.6
   */
  async uploadUserAvatar(
    request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      // Authenticate request
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const userId = parseInt(params.userId);
      if (isNaN(userId)) {
        return jsonResponse({ success: false, error: "Invalid user ID" }, 400);
      }

      // Users can only update their own avatar, admins can update any
      if (payload.userId !== userId && !requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      // Check if user exists
      const users = await db<
        UserPublic[]
      >`SELECT id FROM users WHERE id = ${userId}`;
      if (users.length === 0) {
        return jsonResponse({ success: false, error: "User not found" }, 404);
      }

      // Extract file from request
      const { file, error: extractError } =
        await extractFileFromRequest(request);
      if (!file) {
        return jsonResponse(
          { success: false, error: extractError || "No file provided" },
          400,
        );
      }

      // Validate file
      const entityType: AvatarEntityType = "user";
      const validationResult = validateAvatarFile(
        { size: file.size, mimeType: file.type },
        entityType,
      );

      if (!validationResult.valid) {
        return jsonResponse(
          { success: false, error: validationResult.error },
          400,
        );
      }

      // Process image
      const imageBuffer = Buffer.from(await file.arrayBuffer());
      let processedImage;
      try {
        processedImage = await processAvatar(imageBuffer, file.type);
      } catch (error) {
        console.error("Image processing error:", error);
        return jsonResponse(
          { success: false, error: "Failed to process image" },
          500,
        );
      }

      // Store avatar
      const storageResult = await storeAvatar(
        processedImage,
        entityType,
        userId,
      );
      if (!storageResult.success) {
        return jsonResponse(
          {
            success: false,
            error: storageResult.error || "Failed to store avatar",
          },
          500,
        );
      }

      // Update database with new avatar URLs
      await db`
        UPDATE users 
        SET avatar_url = ${storageResult.originalUrl},
            avatar_thumbnail_url = ${storageResult.thumbnailUrl}
        WHERE id = ${userId}
      `;

      const response: AvatarUploadResponse = {
        success: true,
        data: {
          avatarUrl: storageResult.originalUrl!,
          thumbnailUrl: storageResult.thumbnailUrl!,
        },
      };

      return jsonResponse(response);
    } catch (error) {
      console.error("Upload user avatar error:", error);
      return jsonResponse(
        { success: false, error: "Failed to upload avatar" },
        500,
      );
    }
  },

  /**
   * POST /api/avatars/device/:deviceId
   * Upload or update a device's avatar (admin only)
   * Requirements: 2.4
   */
  async uploadDeviceAvatar(
    request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      // Authenticate request
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      // Only admins can set device avatars
      if (!requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      const deviceId = parseInt(params.deviceId);
      if (isNaN(deviceId)) {
        return jsonResponse(
          { success: false, error: "Invalid device ID" },
          400,
        );
      }

      // Check if device exists
      const devices = await db<
        Device[]
      >`SELECT id FROM devices WHERE id = ${deviceId}`;
      if (devices.length === 0) {
        return jsonResponse({ success: false, error: "Device not found" }, 404);
      }

      // Extract file from request
      const { file, error: extractError } =
        await extractFileFromRequest(request);
      if (!file) {
        return jsonResponse(
          { success: false, error: extractError || "No file provided" },
          400,
        );
      }

      // Validate file
      const entityType: AvatarEntityType = "device";
      const validationResult = validateAvatarFile(
        { size: file.size, mimeType: file.type },
        entityType,
      );

      if (!validationResult.valid) {
        return jsonResponse(
          { success: false, error: validationResult.error },
          400,
        );
      }

      // Process image
      const imageBuffer = Buffer.from(await file.arrayBuffer());
      let processedImage;
      try {
        processedImage = await processAvatar(imageBuffer, file.type);
      } catch (error) {
        console.error("Image processing error:", error);
        return jsonResponse(
          { success: false, error: "Failed to process image" },
          500,
        );
      }

      // Store avatar
      const storageResult = await storeAvatar(
        processedImage,
        entityType,
        deviceId,
      );
      if (!storageResult.success) {
        return jsonResponse(
          {
            success: false,
            error: storageResult.error || "Failed to store avatar",
          },
          500,
        );
      }

      // Update database with new image URL
      await db`
        UPDATE devices 
        SET image_url = ${storageResult.originalUrl},
            image_thumbnail_url = ${storageResult.thumbnailUrl}
        WHERE id = ${deviceId}
      `;

      const response: AvatarUploadResponse = {
        success: true,
        data: {
          avatarUrl: storageResult.originalUrl!,
          thumbnailUrl: storageResult.thumbnailUrl!,
        },
      };

      return jsonResponse(response);
    } catch (error) {
      console.error("Upload device avatar error:", error);
      return jsonResponse(
        { success: false, error: "Failed to upload avatar" },
        500,
      );
    }
  },

  /**
   * DELETE /api/avatars/user/:userId
   * Delete a user's avatar
   * Requirements: 4.1, 4.3
   */
  async deleteUserAvatar(
    request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      // Authenticate request
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const userId = parseInt(params.userId);
      if (isNaN(userId)) {
        return jsonResponse({ success: false, error: "Invalid user ID" }, 400);
      }

      // Users can only delete their own avatar, admins can delete any
      if (payload.userId !== userId && !requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      // Check if user exists and has an avatar
      const users = await db<
        UserPublic[]
      >`SELECT id, avatar_url FROM users WHERE id = ${userId}`;
      if (users.length === 0) {
        return jsonResponse({ success: false, error: "User not found" }, 404);
      }

      const user = users[0];
      if (!user.avatar_url) {
        return jsonResponse({ success: false, error: "Avatar not found" }, 404);
      }

      // Delete avatar files
      const entityType: AvatarEntityType = "user";
      const deleted = await deleteAvatar(entityType, userId);
      if (!deleted) {
        return jsonResponse(
          { success: false, error: "Failed to delete avatar" },
          500,
        );
      }

      // Update database to remove avatar URL
      await db`
        UPDATE users 
        SET avatar_url = NULL,
            avatar_thumbnail_url = NULL
        WHERE id = ${userId}
      `;

      const response: AvatarDeleteResponse = {
        success: true,
        message: "Avatar deleted successfully",
      };

      return jsonResponse(response);
    } catch (error) {
      console.error("Delete user avatar error:", error);
      return jsonResponse(
        { success: false, error: "Failed to delete avatar" },
        500,
      );
    }
  },

  /**
   * DELETE /api/avatars/device/:deviceId
   * Delete a device's avatar (admin only)
   * Requirements: 4.2, 4.3
   */
  async deleteDeviceAvatar(
    request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      // Authenticate request
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      // Only admins can delete device avatars
      if (!requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      const deviceId = parseInt(params.deviceId);
      if (isNaN(deviceId)) {
        return jsonResponse(
          { success: false, error: "Invalid device ID" },
          400,
        );
      }

      // Check if device exists
      const devices = await db<
        Device[]
      >`SELECT id, image_url FROM devices WHERE id = ${deviceId}`;
      if (devices.length === 0) {
        return jsonResponse({ success: false, error: "Device not found" }, 404);
      }

      // Delete avatar files
      const entityType: AvatarEntityType = "device";
      const deleted = await deleteAvatar(entityType, deviceId);
      if (!deleted) {
        return jsonResponse(
          { success: false, error: "Failed to delete avatar" },
          500,
        );
      }

      // Update database to set default image URL
      const defaultImageUrl = "/placeholder.svg";
      await db`
        UPDATE devices 
        SET image_url = ${defaultImageUrl},
            image_thumbnail_url = NULL
        WHERE id = ${deviceId}
      `;

      const response: AvatarDeleteResponse = {
        success: true,
        message: "Device image deleted successfully",
      };

      return jsonResponse(response);
    } catch (error) {
      console.error("Delete device avatar error:", error);
      return jsonResponse(
        { success: false, error: "Failed to delete avatar" },
        500,
      );
    }
  },
};
