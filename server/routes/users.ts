import { db } from "../db/connection";
import { hashPassword, requireAdmin } from "../middleware/auth";
import { auditLogger } from "../services/audit-logger";
import { json, ok, created, err, notFound, forbidden, parseId, withAuth, withAdmin, withSuperuser } from "./_helpers";
import type { UserPublic } from "../types";

export const usersRoutes = {
  async getAll(request: Request): Promise<Response> {
    return withAdmin(request, async () => {
      try {
        const users = await db<UserPublic[]>`SELECT * FROM v_users_public ORDER BY name`;
        return ok(users);
      } catch (e) {
        console.error("Get users error:", e);
        return err("Failed to get users", 500);
      }
    });
  },

  async create(request: Request): Promise<Response> {
    return withAdmin(request, async (payload) => {
      try {
        const { name, email, password, department_id, role } = await request.json() as {
          name: string; email: string; password: string; department_id: number; role?: "user" | "admin" | "superuser";
        };

        if (!name?.trim()) return err("Name is required");
        if (!email?.trim()) return err("Email is required");
        if (!password || password.length < 6) return err("Password must be at least 6 characters");
        if (!department_id) return err("Department is required");

        const emailLower = email.toLowerCase().trim();
        const [existing] = await db<{ id: number }[]>`SELECT id FROM users WHERE LOWER(email) = ${emailLower}`;
        if (existing) return err("Email already exists");

        let userRole: "user" | "admin" | "superuser" = "user";
        if (role) {
          if (payload.role === "superuser") userRole = role;
          else if (payload.role === "admin" && role !== "user") return forbidden("Admins can only create user accounts");
        }

        const password_hash = await hashPassword(password);
        const avatar_url = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`;

        await db`INSERT INTO users (name, email, password_hash, department_id, role, avatar_url, must_change_password)
                 VALUES (${name.trim()}, ${emailLower}, ${password_hash}, ${department_id}, ${userRole}, ${avatar_url}, true)`;

        const [newUser] = await db<UserPublic[]>`SELECT * FROM v_users_public WHERE email = ${emailLower}`;
        if (!newUser) return err("Failed to create user", 500);

        await auditLogger.log({
          action: "create", objectType: "user", objectId: newUser.id,
          actor: auditLogger.createActorFromPayload(payload),
          changes: { after: { name: name.trim(), email: emailLower, department_id, role: userRole } },
        });

        return created(newUser, "User created successfully");
      } catch (e) {
        console.error("Create user error:", e);
        return err("Failed to create user", 500);
      }
    });
  },

  async getById(request: Request, params: Record<string, string>): Promise<Response> {
    return withAuth(request, async (payload) => {
      try {
        const id = parseId(params.id);
        if (!id) return err("Invalid user ID");
        if (payload.userId !== id && !requireAdmin(payload)) return forbidden();

        const [user] = await db<UserPublic[]>`SELECT * FROM v_users_public WHERE id = ${id}`;
        return user ? ok(user) : notFound("User");
      } catch (e) {
        console.error("Get user error:", e);
        return err("Failed to get user", 500);
      }
    });
  },

  async update(request: Request, params: Record<string, string>): Promise<Response> {
    return withAuth(request, async (payload) => {
      try {
        const id = parseId(params.id);
        if (!id) return err("Invalid user ID");
        if (payload.userId !== id && !requireAdmin(payload)) return forbidden();

        const { name, department_id, avatar_url, role } = await request.json();
        const updates: string[] = [], values: unknown[] = [];

        if (name !== undefined) { updates.push("name = ?"); values.push(name.trim()); }
        if (department_id !== undefined) { updates.push("department_id = ?"); values.push(department_id); }
        if (avatar_url !== undefined) { updates.push("avatar_url = ?"); values.push(avatar_url); }

        if (role !== undefined && requireAdmin(payload)) {
          if (payload.role === "superuser") { updates.push("role = ?"); values.push(role); }
          else if (payload.role === "admin" && role === "user") { updates.push("role = ?"); values.push(role); }
          else if (payload.role === "admin" && (role === "admin" || role === "superuser")) {
            return forbidden("Admins cannot assign admin or superuser roles");
          }
        }

        if (!updates.length) return err("No fields to update");

        const [before] = await db<UserPublic[]>`SELECT * FROM v_users_public WHERE id = ${id}`;
        values.push(id);
        await db.unsafe(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);
        const [updated] = await db<UserPublic[]>`SELECT * FROM v_users_public WHERE id = ${id}`;

        await auditLogger.log({
          action: "update", objectType: "user", objectId: id,
          actor: auditLogger.createActorFromPayload(payload),
          changes: { before: before ? { ...before } : undefined, after: { name, department_id, avatar_url, role } },
        });

        return ok(updated, "User updated");
      } catch (e) {
        console.error("Update user error:", e);
        return err("Failed to update user", 500);
      }
    });
  },

  async delete(request: Request, params: Record<string, string>): Promise<Response> {
    return withSuperuser(request, async (payload) => {
      try {
        const id = parseId(params.id);
        if (!id) return err("Invalid user ID");
        if (payload.userId === id) return err("Cannot delete your own account");

        const [active] = await db<{ count: number }[]>`
          SELECT COUNT(*) as count FROM borrow_requests WHERE user_id = ${id} AND status IN ('pending', 'approved', 'active')`;
        if (active.count > 0) return err("Cannot delete user with active borrow requests");

        const [before] = await db<UserPublic[]>`SELECT * FROM v_users_public WHERE id = ${id}`;
        await db`DELETE FROM users WHERE id = ${id}`;

        await auditLogger.log({
          action: "delete", objectType: "user", objectId: id,
          actor: auditLogger.createActorFromPayload(payload),
          changes: { before: before ? { ...before } : undefined },
        });

        return ok(null, "User deleted");
      } catch (e) {
        console.error("Delete user error:", e);
        return err("Failed to delete user", 500);
      }
    });
  },

  async resetPassword(request: Request, params: Record<string, string>): Promise<Response> {
    return withSuperuser(request, async (payload) => {
      try {
        const id = parseId(params.id);
        if (!id) return err("Invalid user ID");

        const { password } = await request.json() as { password: string };
        if (!password || password.length < 6) return err("Password must be at least 6 characters");

        const hash = await hashPassword(password);
        await db`UPDATE users SET password_hash = ${hash} WHERE id = ${id}`;

        await auditLogger.log({
          action: "password_reset", objectType: "user", objectId: id,
          actor: auditLogger.createActorFromPayload(payload),
          metadata: { targetUserId: id },
        });

        return ok(null, "Password reset successfully");
      } catch (e) {
        console.error("Reset password error:", e);
        return err("Failed to reset password", 500);
      }
    });
  },

  async toggleStatus(request: Request, params: Record<string, string>): Promise<Response> {
    return withSuperuser(request, async (payload) => {
      try {
        const id = parseId(params.id);
        if (!id) return err("Invalid user ID");
        if (payload.userId === id) return err("Cannot change your own account status");

        const { is_active } = await request.json() as { is_active: boolean };
        if (typeof is_active !== "boolean") return err("is_active must be a boolean");

        await db`UPDATE users SET is_active = ${is_active} WHERE id = ${id}`;
        const [updated] = await db<UserPublic[]>`SELECT * FROM v_users_public WHERE id = ${id}`;

        await auditLogger.log({
          action: is_active ? "account_unlock" : "account_lock", objectType: "user", objectId: id,
          actor: auditLogger.createActorFromPayload(payload),
          changes: { before: { is_active: !is_active }, after: { is_active } },
        });

        return ok(updated, is_active ? "User account unlocked" : "User account locked");
      } catch (e) {
        console.error("Toggle status error:", e);
        return err("Failed to toggle user status", 500);
      }
    });
  },
};
