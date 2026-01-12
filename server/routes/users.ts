import { db } from "../db/connection";
import {
  authenticateRequest,
  requireAdmin,
  hashPassword,
} from "../middleware/auth";
import { auditLogger } from "../services/audit-logger";
import type { UserPublic } from "../types";

// JSON response helper
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const usersRoutes = {
  // GET /api/users
  async getAll(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      // Only admins can list all users
      if (!requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      const users = await db<
        UserPublic[]
      >`SELECT * FROM v_users_public ORDER BY name`;
      return jsonResponse({ success: true, data: users });
    } catch (error) {
      console.error("Get users error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get users" },
        500,
      );
    }
  },

  // GET /api/users/:id
  async getById(
    request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const id = parseInt(params.id);
      if (isNaN(id)) {
        return jsonResponse({ success: false, error: "Invalid user ID" }, 400);
      }

      // Users can only view their own profile, admins can view any
      if (payload.userId !== id && !requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      const users = await db<
        UserPublic[]
      >`SELECT * FROM v_users_public WHERE id = ${id}`;
      const user = users[0];

      if (!user) {
        return jsonResponse({ success: false, error: "User not found" }, 404);
      }

      return jsonResponse({ success: true, data: user });
    } catch (error) {
      console.error("Get user error:", error);
      return jsonResponse({ success: false, error: "Failed to get user" }, 500);
    }
  },

  // PUT /api/users/:id
  async update(
    request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const id = parseInt(params.id);
      if (isNaN(id)) {
        return jsonResponse({ success: false, error: "Invalid user ID" }, 400);
      }

      // Users can only update their own profile, admins can update any
      if (payload.userId !== id && !requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      const body = await request.json();
      const { name, department_id, avatar_url, role } = body;

      // Build update query dynamically
      const updates: string[] = [];
      const values: unknown[] = [];

      if (name !== undefined) {
        updates.push("name = ?");
        values.push(name.trim());
      }
      if (department_id !== undefined) {
        updates.push("department_id = ?");
        values.push(department_id);
      }
      if (avatar_url !== undefined) {
        updates.push("avatar_url = ?");
        values.push(avatar_url);
      }
      // Role change restrictions:
      // - Only superusers can assign superuser role
      // - Admins can only assign 'user' role, not 'admin' or 'superuser'
      if (role !== undefined && requireAdmin(payload)) {
        // Superusers can assign any role
        if (payload.role === "superuser") {
          updates.push("role = ?");
          values.push(role);
        }
        // Admins can only assign 'user' role
        else if (payload.role === "admin" && role === "user") {
          updates.push("role = ?");
          values.push(role);
        }
        // Admins trying to assign admin/superuser role - forbidden
        else if (
          payload.role === "admin" &&
          (role === "admin" || role === "superuser")
        ) {
          return jsonResponse(
            {
              success: false,
              error: "Admins cannot assign admin or superuser roles",
            },
            403,
          );
        }
      }

      if (updates.length === 0) {
        return jsonResponse(
          { success: false, error: "No fields to update" },
          400,
        );
      }

      // Get current user state for audit log
      const currentUsers = await db<
        UserPublic[]
      >`SELECT * FROM v_users_public WHERE id = ${id}`;
      const beforeState = currentUsers[0] ? { ...currentUsers[0] } : undefined;

      values.push(id);
      await db.unsafe(
        `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );

      const updatedUsers = await db<
        UserPublic[]
      >`SELECT * FROM v_users_public WHERE id = ${id}`;
      const updatedUser = updatedUsers[0];

      // Audit log
      await auditLogger.log({
        action: "update",
        objectType: "user",
        objectId: id,
        actor: auditLogger.createActorFromPayload(payload),
        changes: {
          before: beforeState,
          after: { name, department_id, avatar_url, role },
        },
      });

      return jsonResponse({
        success: true,
        data: updatedUser,
        message: "User updated",
      });
    } catch (error) {
      console.error("Update user error:", error);
      return jsonResponse(
        { success: false, error: "Failed to update user" },
        500,
      );
    }
  },

  // DELETE /api/users/:id
  async delete(
    request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      // Only superusers can delete users
      if (payload.role !== "superuser") {
        return jsonResponse(
          { success: false, error: "Forbidden - Superuser access required" },
          403,
        );
      }

      const id = parseInt(params.id);
      if (isNaN(id)) {
        return jsonResponse({ success: false, error: "Invalid user ID" }, 400);
      }

      // Prevent self-deletion
      if (payload.userId === id) {
        return jsonResponse(
          { success: false, error: "Cannot delete your own account" },
          400,
        );
      }

      // Check if user has active borrow requests
      const activeRequests = await db<{ count: number }[]>`
        SELECT COUNT(*) as count FROM borrow_requests 
        WHERE user_id = ${id} AND status IN ('pending', 'approved', 'active')
      `;
      if (activeRequests[0].count > 0) {
        return jsonResponse(
          {
            success: false,
            error: "Cannot delete user with active borrow requests",
          },
          400,
        );
      }

      // Get user info for audit log before deletion
      const userToDelete = await db<
        UserPublic[]
      >`SELECT * FROM v_users_public WHERE id = ${id}`;
      const deletedUser = userToDelete[0] ? { ...userToDelete[0] } : undefined;

      await db`DELETE FROM users WHERE id = ${id}`;

      // Audit log
      await auditLogger.log({
        action: "delete",
        objectType: "user",
        objectId: id,
        actor: auditLogger.createActorFromPayload(payload),
        changes: {
          before: deletedUser,
        },
      });

      return jsonResponse({ success: true, message: "User deleted" });
    } catch (error) {
      console.error("Delete user error:", error);
      return jsonResponse(
        { success: false, error: "Failed to delete user" },
        500,
      );
    }
  },

  // PATCH /api/users/:id/password
  async resetPassword(
    request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      // Only superusers can reset passwords
      if (payload.role !== "superuser") {
        return jsonResponse(
          { success: false, error: "Forbidden - Superuser access required" },
          403,
        );
      }

      const id = parseInt(params.id);
      if (isNaN(id)) {
        return jsonResponse({ success: false, error: "Invalid user ID" }, 400);
      }

      const body = await request.json();
      const { password } = body as { password: string };

      if (!password || password.length < 6) {
        return jsonResponse(
          { success: false, error: "Password must be at least 6 characters" },
          400,
        );
      }

      // Hash the new password
      const password_hash = await hashPassword(password);

      await db`UPDATE users SET password_hash = ${password_hash} WHERE id = ${id}`;

      // Audit log
      await auditLogger.log({
        action: "password_reset",
        objectType: "user",
        objectId: id,
        actor: auditLogger.createActorFromPayload(payload),
        metadata: {
          targetUserId: id,
        },
      });

      return jsonResponse({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      return jsonResponse(
        { success: false, error: "Failed to reset password" },
        500,
      );
    }
  },

  // PATCH /api/users/:id/status
  async toggleStatus(
    request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      // Only superusers can toggle user status
      if (payload.role !== "superuser") {
        return jsonResponse(
          { success: false, error: "Forbidden - Superuser access required" },
          403,
        );
      }

      const id = parseInt(params.id);
      if (isNaN(id)) {
        return jsonResponse({ success: false, error: "Invalid user ID" }, 400);
      }

      // Prevent self-locking
      if (payload.userId === id) {
        return jsonResponse(
          { success: false, error: "Cannot change your own account status" },
          400,
        );
      }

      const body = await request.json();
      const { is_active } = body as { is_active: boolean };

      if (typeof is_active !== "boolean") {
        return jsonResponse(
          { success: false, error: "is_active must be a boolean" },
          400,
        );
      }

      await db`UPDATE users SET is_active = ${is_active} WHERE id = ${id}`;

      const updatedUsers = await db<
        UserPublic[]
      >`SELECT * FROM v_users_public WHERE id = ${id}`;
      const updatedUser = updatedUsers[0];

      // Audit log
      await auditLogger.log({
        action: is_active ? "account_unlock" : "account_lock",
        objectType: "user",
        objectId: id,
        actor: auditLogger.createActorFromPayload(payload),
        changes: {
          before: { is_active: !is_active },
          after: { is_active },
        },
      });

      return jsonResponse({
        success: true,
        data: updatedUser,
        message: is_active ? "User account unlocked" : "User account locked",
      });
    } catch (error) {
      console.error("Toggle status error:", error);
      return jsonResponse(
        { success: false, error: "Failed to toggle user status" },
        500,
      );
    }
  },
};
