import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { db } from "../db/connection";
import type { JWTPayload, UserRole, User } from "../types";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "device-hub-secret-key-change-in-production");
const JWT_ALG = "HS256";
const EXP = { DEFAULT: "24h", REMEMBER: "30d" };

const PayloadSchema = z.object({
  userId: z.number(),
  email: z.string(),
  role: z.enum(["superuser", "admin", "user"]),
});

export async function generateToken(userId: number, email: string, role: UserRole, rememberMe = false): Promise<string> {
  return new SignJWT({ userId, email, role })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(rememberMe ? EXP.REMEMBER : EXP.DEFAULT)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload: jwtPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: [JWT_ALG] });
    const parsed = PayloadSchema.safeParse(jwtPayload);

    if (!parsed.success) {
      console.log("[AUTH] Invalid token payload format:", parsed.error);
      return null;
    }

    const payload = parsed.data;
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
    console.error("[AUTH] Authentication error:", e);
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, { algorithm: "argon2id", memoryCost: 19456, timeCost: 2 });
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return Bun.password.verify(password, storedHash);
}

export const extractToken = (req: Request): string | null => {
  const cookieHeader = req.headers.get("Cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/auth_token=([^;]+)/);
    return match ? match[1] : null;
  }
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.substring(7);
  return null;
};

export const authenticateRequest = async (req: Request): Promise<JWTPayload | null> => {
  const token = extractToken(req);
  return token ? verifyToken(token) : null;
};

export const requireAdmin = (p: JWTPayload | null) => p?.role === "admin" || p?.role === "superuser";
export const requireSuperuser = (p: JWTPayload | null) => p?.role === "superuser";
