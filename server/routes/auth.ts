import { db } from "../db/connection";
import { generateToken, hashPassword, verifyPassword, authenticateRequest } from "../middleware/auth";
import { json, ok, err, unauthorized, notFound, withAuth } from "./_helpers";
import type { User, UserPublic, LoginRequest, SignupRequest, AuthResponse } from "../types";

interface UserWithPwdFlag extends User { must_change_password: boolean; }
interface UserPublicWithPwdFlag extends UserPublic { must_change_password: boolean; }

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9._-]+$/;
const isValidEmailOrUsername = (s: string) => EMAIL_REGEX.test(s) || USERNAME_REGEX.test(s);

export const authRoutes = {
  async login(request: Request): Promise<Response> {
    try {
      const { email, password, rememberMe }: LoginRequest = await request.json();
      if (!email || !password) return err("Email and password are required");

      const emailLower = email.toLowerCase();
      const users = await db<UserWithPwdFlag[]>`SELECT * FROM users WHERE email = ${emailLower}`;
      const user = users[0];

      if (!user || !(await verifyPassword(password, user.password_hash))) {
        return err("Invalid email or password", 401);
      }
      if (!user.is_active) {
        return err("Your account has been locked. Please contact an administrator.", 403);
      }

      await db`UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}`;
      const token = await generateToken(user.id, user.email, user.role, rememberMe || false);
      const [userPublic] = await db<UserPublicWithPwdFlag[]>`SELECT * FROM v_users_public WHERE id = ${user.id}`;

      return json({ success: true, token, user: userPublic, mustChangePassword: user.must_change_password || false } as AuthResponse & { mustChangePassword?: boolean });
    } catch (e) {
      console.error("Login error:", e);
      return err("Login failed", 500);
    }
  },

  async signup(request: Request): Promise<Response> {
    try {
      const { name, email, password, department_id }: SignupRequest = await request.json();

      if (!name?.trim()) return err("Name is required");
      if (!email?.trim()) return err("Email is required");
      if (!isValidEmailOrUsername(email.trim())) return err("Invalid email/username format");
      if (!password || password.length < 6) return err("Password must be at least 6 characters");
      if (!department_id) return err("Department is required");

      const emailLower = email.toLowerCase().trim();
      const [existing] = await db<{ id: number }[]>`SELECT id FROM users WHERE email = ${emailLower}`;
      if (existing) return err("An account with this email already exists");

      const [dept] = await db<{ id: number }[]>`SELECT id FROM departments WHERE id = ${department_id}`;
      if (!dept) return err("Invalid department");

      const password_hash = await hashPassword(password);
      const avatar_url = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`;

      await db`INSERT INTO users (name, email, password_hash, department_id, role, avatar_url) VALUES (${name.trim()}, ${emailLower}, ${password_hash}, ${department_id}, 'user', ${avatar_url})`;

      const [newUser] = await db<User[]>`SELECT * FROM users WHERE email = ${emailLower}`;
      if (!newUser) return err("Failed to create user", 500);

      const token = await generateToken(newUser.id, newUser.email, newUser.role);
      const [userPublic] = await db<UserPublic[]>`SELECT * FROM v_users_public WHERE id = ${newUser.id}`;

      return json({ success: true, token, user: userPublic } as AuthResponse, 201);
    } catch (e) {
      console.error("Signup error:", e);
      return err("Signup failed", 500);
    }
  },

  async me(request: Request): Promise<Response> {
    return withAuth(request, async (payload) => {
      try {
        const [user] = await db<UserPublicWithPwdFlag[]>`SELECT * FROM v_users_public WHERE id = ${payload.userId}`;
        if (!user) return notFound("User");
        return json({ success: true, user, mustChangePassword: user.must_change_password || false });
      } catch (e) {
        console.error("Get me error:", e);
        return err("Failed to get user", 500);
      }
    });
  },

  async changePassword(request: Request): Promise<Response> {
    return withAuth(request, async (payload) => {
      try {
        const { currentPassword, newPassword } = await request.json() as { currentPassword: string; newPassword: string };
        if (!currentPassword || !newPassword) return err("Current password and new password are required");
        if (newPassword.length < 6) return err("New password must be at least 6 characters");

        const [user] = await db<UserWithPwdFlag[]>`SELECT * FROM users WHERE id = ${payload.userId}`;
        if (!user) return notFound("User");
        if (!(await verifyPassword(currentPassword, user.password_hash))) return err("Current password is incorrect", 401);

        const newHash = await hashPassword(newPassword);
        await db`UPDATE users SET password_hash = ${newHash}, must_change_password = FALSE WHERE id = ${payload.userId}`;

        return ok(null, "Password changed successfully");
      } catch (e) {
        console.error("Change password error:", e);
        return err("Failed to change password", 500);
      }
    });
  },
};
