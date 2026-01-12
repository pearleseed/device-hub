import { db } from "../db/connection";
import {
  generateToken,
  hashPassword,
  verifyPassword,
  authenticateRequest,
} from "../middleware/auth";
import type {
  User,
  UserPublic,
  LoginRequest,
  SignupRequest,
  AuthResponse,
} from "../types";

// Extended User type with must_change_password
interface UserWithPasswordFlag extends User {
  must_change_password: boolean;
}

// Extended UserPublic type with must_change_password
interface UserPublicWithPasswordFlag extends UserPublic {
  must_change_password: boolean;
}

// JSON response helper
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const authRoutes = {
  // POST /api/auth/login
  async login(request: Request): Promise<Response> {
    try {
      const body: LoginRequest = await request.json();
      const { email, password, rememberMe } = body;

      if (!email || !password) {
        return jsonResponse(
          { success: false, error: "Email and password are required" },
          400,
        );
      }

      // Find user by email
      const emailLower = email.toLowerCase();
      const users = await db<
        UserWithPasswordFlag[]
      >`SELECT * FROM users WHERE email = ${emailLower}`;
      const user = users[0];

      if (!user) {
        return jsonResponse(
          { success: false, error: "Invalid email or password" },
          401,
        );
      }

      // Verify password
      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) {
        return jsonResponse(
          { success: false, error: "Invalid email or password" },
          401,
        );
      }

      // Check if user account is active
      if (!user.is_active) {
        return jsonResponse(
          {
            success: false,
            error:
              "Your account has been locked. Please contact an administrator.",
          },
          403,
        );
      }

      // Update last login timestamp
      await db`UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}`;

      // Generate JWT token
      const token = await generateToken(user.id, user.email, user.role, rememberMe || false);

      // Get department name
      const usersPublic = await db<
        UserPublicWithPasswordFlag[]
      >`SELECT * FROM v_users_public WHERE id = ${user.id}`;
      const userPublic = usersPublic[0];

      const response: AuthResponse & { mustChangePassword?: boolean } = {
        success: true,
        token,
        user: userPublic!,
        mustChangePassword: user.must_change_password || false,
      };

      return jsonResponse(response);
    } catch (error) {
      console.error("Login error:", error);
      return jsonResponse({ success: false, error: "Login failed" }, 500);
    }
  },

  // POST /api/auth/signup
  async signup(request: Request): Promise<Response> {
    try {
      const body: SignupRequest = await request.json();
      const { name, email, password, department_id } = body;

      // Validate input
      if (!name?.trim()) {
        return jsonResponse({ success: false, error: "Name is required" }, 400);
      }
      if (!email?.trim()) {
        return jsonResponse(
          { success: false, error: "Email is required" },
          400,
        );
      }

      // Validate email/username format - allow either:
      // 1. Full email format: user@domain.com
      // 2. Simple username for support accounts: alphanumeric, dots, underscores, hyphens
      const fullEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const simpleUsernameRegex = /^[a-zA-Z0-9._-]+$/;
      const trimmedEmail = email.trim();
      if (!fullEmailRegex.test(trimmedEmail) && !simpleUsernameRegex.test(trimmedEmail)) {
        return jsonResponse(
          { success: false, error: "Invalid email/username format" },
          400,
        );
      }
      if (!password || password.length < 6) {
        return jsonResponse(
          { success: false, error: "Password must be at least 6 characters" },
          400,
        );
      }
      if (!department_id) {
        return jsonResponse(
          { success: false, error: "Department is required" },
          400,
        );
      }

      const emailLower = email.toLowerCase();

      // Check if email already exists
      const existingUsers = await db<
        User[]
      >`SELECT id FROM users WHERE email = ${emailLower}`;
      if (existingUsers.length > 0) {
        return jsonResponse(
          {
            success: false,
            error: "An account with this email already exists",
          },
          400,
        );
      }

      // Check if department exists
      const departments = await db<
        { id: number }[]
      >`SELECT id FROM departments WHERE id = ${department_id}`;
      if (departments.length === 0) {
        return jsonResponse(
          { success: false, error: "Invalid department" },
          400,
        );
      }

      // Hash password
      const password_hash = await hashPassword(password);

      // Generate avatar URL
      const avatar_url = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;

      // Create user
      const nameTrimmed = name.trim();
      const emailTrimmed = emailLower.trim();
      await db`INSERT INTO users (name, email, password_hash, department_id, role, avatar_url)
               VALUES (${nameTrimmed}, ${emailTrimmed}, ${password_hash}, ${department_id}, 'user', ${avatar_url})`;

      // Get the created user
      const newUsers = await db<
        User[]
      >`SELECT * FROM users WHERE email = ${emailLower}`;
      const newUser = newUsers[0];

      if (!newUser) {
        return jsonResponse(
          { success: false, error: "Failed to create user" },
          500,
        );
      }

      // Generate JWT token
      const token = await generateToken(
        newUser.id,
        newUser.email,
        newUser.role,
      );

      // Get user with department info
      const usersPublic = await db<
        UserPublic[]
      >`SELECT * FROM v_users_public WHERE id = ${newUser.id}`;
      const userPublic = usersPublic[0];

      const response: AuthResponse = {
        success: true,
        token,
        user: userPublic!,
      };

      return jsonResponse(response, 201);
    } catch (error) {
      console.error("Signup error:", error);
      return jsonResponse({ success: false, error: "Signup failed" }, 500);
    }
  },

  // GET /api/auth/me
  async me(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const users = await db<
        UserPublicWithPasswordFlag[]
      >`SELECT * FROM v_users_public WHERE id = ${payload.userId}`;
      const user = users[0];

      if (!user) {
        return jsonResponse({ success: false, error: "User not found" }, 404);
      }

      return jsonResponse({
        success: true,
        user,
        mustChangePassword: user.must_change_password || false,
      });
    } catch (error) {
      console.error("Get me error:", error);
      return jsonResponse({ success: false, error: "Failed to get user" }, 500);
    }
  },

  // POST /api/auth/change-password
  async changePassword(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const body = await request.json();
      const { currentPassword, newPassword } = body as {
        currentPassword: string;
        newPassword: string;
      };

      if (!currentPassword || !newPassword) {
        return jsonResponse(
          {
            success: false,
            error: "Current password and new password are required",
          },
          400,
        );
      }

      if (newPassword.length < 6) {
        return jsonResponse(
          {
            success: false,
            error: "New password must be at least 6 characters",
          },
          400,
        );
      }

      // Get user with current password hash
      const users = await db<
        UserWithPasswordFlag[]
      >`SELECT * FROM users WHERE id = ${payload.userId}`;
      const user = users[0];

      if (!user) {
        return jsonResponse({ success: false, error: "User not found" }, 404);
      }

      // Verify current password
      const isValid = await verifyPassword(currentPassword, user.password_hash);
      if (!isValid) {
        return jsonResponse(
          { success: false, error: "Current password is incorrect" },
          401,
        );
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update password and clear must_change_password flag
      await db`
        UPDATE users 
        SET password_hash = ${newPasswordHash}, must_change_password = FALSE 
        WHERE id = ${payload.userId}
      `;

      return jsonResponse({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      return jsonResponse(
        { success: false, error: "Failed to change password" },
        500,
      );
    }
  },
};
