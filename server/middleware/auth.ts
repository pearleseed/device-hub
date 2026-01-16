import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { db } from "../db/connection";
import type { JWTPayload, UserRole, User } from "../types";

// Basic configuration for JWT
// Using HS256 algorithm with a secret key from env
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-for-dev-only");
const JWT_ALG = "HS256";
const EXP = { DEFAULT: "24h", REMEMBER: "30d" };

// Zod schema for validating the JWT payload strucure
const PayloadSchema = z.object({
  userId: z.number(),
  email: z.string(),
  role: z.enum(["superuser", "admin", "user"]),
});

/**
 * Generates a signed JWT for a user.
 * @param userId User's database ID
 * @param email User's email
 * @param role User's role (superuser, admin, user)
 * @param rememberMe If true, token lasts for 30 days instead of 24h
 * @returns Signed JWT string
 */
export async function generateToken(userId: number, email: string, role: UserRole, rememberMe = false): Promise<string> {
  return new SignJWT({ userId, email, role })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(rememberMe ? EXP.REMEMBER : EXP.DEFAULT)
    .sign(JWT_SECRET);
}

/**
 * Verifies and decodes a JWT.
 * Also checks against the database to ensure the user still exists and is active.
 * @param token The JWT string to verify
 * @returns Decoded payload or null if invalid/expired/user inactive
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    // 1. Verify signature and expiration
    const { payload: jwtPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: [JWT_ALG] });
    // 2. Validate payload structure
    const parsed = PayloadSchema.safeParse(jwtPayload);

    if (!parsed.success) {
      console.log("[AUTH] Invalid token payload format:", parsed.error);
      return null;
    }

    const payload = parsed.data;
    // 3. Database check: User must exist and be active
    const [user] = await db<User[]>`SELECT id, email, role, department_id FROM users WHERE id = ${payload.userId} AND is_active = TRUE`;
    
    if (!user) {
      console.log("[AUTH] User not found or inactive:", payload.userId);
      return null;
    }

    return { 
      userId: user.id, 
      role: user.role, 
      email: user.email, 
      departmentId: user.department_id,
      exp: (jwtPayload.exp as number) || 0
    };
  } catch (e) {
    // Log error but don't expose details to caller
    console.error("[AUTH] Authentication error:", e);
    return null;
  }
}

// Password hashing using Argon2id - current industry standard
export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, { algorithm: "argon2id", memoryCost: 19456, timeCost: 2 });
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return Bun.password.verify(password, storedHash);
}

/**
 * Extracts the token from Cookie or Authorization header.
 * Priority: Cookie -> Authorization Header (Bearer)
 */
export const extractToken = (req: Request): string | null => {
  // Check cookie first (typical for browser apps)
  const cookieHeader = req.headers.get("Cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/auth_token=([^;]+)/);
    if (match) return match[1];
  }
  // Check Authorization header (typical for API clients)
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.substring(7);
  return null;
};

/**
 * Main authentication helper for routes.
 * Extracts token -> Verifies it -> Returns Payload or null
 */
export const authenticateRequest = async (req: Request): Promise<JWTPayload | null> => {
  const token = extractToken(req);
  if (!token) {
    // console.log("[AUTH] No token found in request");
    return null;
  }
  return verifyToken(token);
};

export const requireAdmin = (p: JWTPayload | null) => p?.role === "admin" || p?.role === "superuser";
export const requireSuperuser = (p: JWTPayload | null) => p?.role === "superuser";
