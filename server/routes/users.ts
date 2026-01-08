import { db } from "../db/connection";
import { authenticateRequest, requireAdmin } from "../middleware/auth";
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
      // Only admins can change roles
      if (role !== undefined && requireAdmin(payload)) {
        updates.push("role = ?");
        values.push(role);
      }

      if (updates.length === 0) {
        return jsonResponse(
          { success: false, error: "No fields to update" },
          400,
        );
      }

      values.push(id);
      await db.unsafe(
        `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );

      const updatedUsers = await db<
        UserPublic[]
      >`SELECT * FROM v_users_public WHERE id = ${id}`;
      const updatedUser = updatedUsers[0];

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

      // Only admins can delete users
      if (!requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
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

      // Check if user has active borrowing requests
      const activeRequests = await db<{ count: number }[]>`
        SELECT COUNT(*) as count FROM borrowing_requests 
        WHERE user_id = ${id} AND status IN ('pending', 'approved', 'active')
      `;
      if (activeRequests[0].count > 0) {
        return jsonResponse(
          {
            success: false,
            error: "Cannot delete user with active borrowing requests",
          },
          400,
        );
      }

      await db`DELETE FROM users WHERE id = ${id}`;
      return jsonResponse({ success: true, message: "User deleted" });
    } catch (error) {
      console.error("Delete user error:", error);
      return jsonResponse(
        { success: false, error: "Failed to delete user" },
        500,
      );
    }
  },
};
