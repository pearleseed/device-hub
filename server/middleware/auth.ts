import type { JWTPayload, UserRole } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "device-hub-secret-key-change-in-production";
const JWT_EXPIRY = { default: 24 * 60 * 60, rememberMe: 30 * 24 * 60 * 60 };
const PBKDF2_ITERATIONS = 100000;

const b64Encode = (s: string) => Buffer.from(s).toString("base64url");
const b64Decode = (s: string) => Buffer.from(s, "base64url").toString("utf-8");

const createSignature = async (data: string): Promise<string> => {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(JWT_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return Buffer.from(await crypto.subtle.sign("HMAC", key, enc.encode(data))).toString("base64url");
};

export async function generateToken(userId: number, email: string, role: UserRole, rememberMe = false): Promise<string> {
  const header = b64Encode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64Encode(JSON.stringify({ userId, email, role, exp: Math.floor(Date.now() / 1000) + (rememberMe ? JWT_EXPIRY.rememberMe : JWT_EXPIRY.default) }));
  return `${header}.${payload}.${await createSignature(`${header}.${payload}`)}`;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const [h, p, sig] = token.split(".");
    if (!h || !p || !sig || await createSignature(`${h}.${p}`) !== sig) return null;
    const payload: JWTPayload = JSON.parse(b64Decode(p));
    return payload.exp >= Math.floor(Date.now() / 1000) ? payload : null;
  } catch { return null; }
}

const derivePBKDF2 = async (password: string, salt: Uint8Array | Buffer): Promise<ArrayBuffer> => {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const saltBuffer = salt instanceof Buffer ? new Uint8Array(salt) : salt;
  return crypto.subtle.deriveBits({ name: "PBKDF2", salt: saltBuffer as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" }, key, 256);
};

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePBKDF2(password, salt);
  return `${Buffer.from(salt).toString("hex")}:${Buffer.from(hash).toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [saltHex, hashHex] = storedHash.split(":");
    const computed = await derivePBKDF2(password, Buffer.from(saltHex, "hex"));
    return Buffer.from(computed).toString("hex") === hashHex;
  } catch { return false; }
}

export const extractToken = (req: Request): string | null => {
  const auth = req.headers.get("Authorization");
  return auth?.startsWith("Bearer ") ? auth.slice(7) : null;
};

export const authenticateRequest = async (req: Request): Promise<JWTPayload | null> => {
  const token = extractToken(req);
  return token ? verifyToken(token) : null;
};

export const requireAdmin = (p: JWTPayload | null) => p?.role === "admin" || p?.role === "superuser";
export const requireSuperuser = (p: JWTPayload | null) => p?.role === "superuser";
