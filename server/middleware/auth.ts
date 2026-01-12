import type { JWTPayload, UserRole } from "../types";

const JWT_SECRET =
  process.env.JWT_SECRET || "device-hub-secret-key-change-in-production";
const JWT_EXPIRY_DEFAULT = 24 * 60 * 60; // 24 hours in seconds
const JWT_EXPIRY_REMEMBER_ME = 30 * 24 * 60 * 60; // 30 days in seconds

// Simple base64url encoding/decoding
function base64urlEncode(data: string): string {
  return Buffer.from(data).toString("base64url");
}

function base64urlDecode(data: string): string {
  return Buffer.from(data, "base64url").toString("utf-8");
}

// Create HMAC signature using Web Crypto API
async function createSignature(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(JWT_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Buffer.from(signature).toString("base64url");
}

// Verify HMAC signature
async function verifySignature(
  data: string,
  signature: string,
): Promise<boolean> {
  const expectedSignature = await createSignature(data);
  return signature === expectedSignature;
}

// Generate JWT token
export async function generateToken(
  userId: number,
  email: string,
  role: UserRole,
  rememberMe: boolean = false,
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const expiry = rememberMe ? JWT_EXPIRY_REMEMBER_ME : JWT_EXPIRY_DEFAULT;
  const payload: JWTPayload = {
    userId,
    email,
    role,
    exp: Math.floor(Date.now() / 1000) + expiry,
  };

  const headerB64 = base64urlEncode(JSON.stringify(header));
  const payloadB64 = base64urlEncode(JSON.stringify(payload));
  const signature = await createSignature(`${headerB64}.${payloadB64}`);

  return `${headerB64}.${payloadB64}.${signature}`;
}

// Verify and decode JWT token
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signature] = parts;

    // Verify signature
    const isValid = await verifySignature(
      `${headerB64}.${payloadB64}`,
      signature,
    );
    if (!isValid) return null;

    // Decode and validate payload
    const payload: JWTPayload = JSON.parse(base64urlDecode(payloadB64));

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// Password hashing using Web Crypto API
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Buffer.from(salt).toString("hex");

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    256,
  );

  const hashHex = Buffer.from(derivedBits).toString("hex");
  return `${saltHex}:${hashHex}`;
}

// Verify password
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  try {
    const [saltHex, hashHex] = storedHash.split(":");
    const salt = Buffer.from(saltHex, "hex");
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      key,
      256,
    );

    const computedHashHex = Buffer.from(derivedBits).toString("hex");
    return computedHashHex === hashHex;
  } catch {
    return false;
  }
}

// Extract token from Authorization header
export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

// Middleware to authenticate request
export async function authenticateRequest(
  request: Request,
): Promise<JWTPayload | null> {
  const token = extractToken(request);
  if (!token) return null;
  return verifyToken(token);
}

// Check if user has admin role (includes superuser)
export function requireAdmin(payload: JWTPayload | null): boolean {
  return payload?.role === "admin" || payload?.role === "superuser";
}

// Check if user has superuser role
export function requireSuperuser(payload: JWTPayload | null): boolean {
  return payload?.role === "superuser";
}
