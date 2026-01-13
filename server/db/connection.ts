import { SQL } from "bun";

// Types
export interface PoolStatus {
  active: number;
  idle: number;
  total: number;
  healthy: boolean;
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly query?: string,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = "DatabaseError";
    Error.captureStackTrace?.(this, DatabaseError);
  }
}

const RETRYABLE_ERRORS = new Set([
  "ECONNRESET", "ECONNREFUSED", "ETIMEDOUT",
  "PROTOCOL_CONNECTION_LOST", "ER_LOCK_DEADLOCK", "ER_LOCK_WAIT_TIMEOUT",
]);

// Configuration
const DB_CONFIG = {
  adapter: "mysql" as const,
  hostname: process.env.DB_HOST || "localhost",
  port: +(process.env.DB_PORT || 3306),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "device_hub",
  max: +(process.env.DB_POOL_MAX || 20),
  idleTimeout: +(process.env.DB_IDLE_TIMEOUT || 30),
  maxLifetime: +(process.env.DB_MAX_LIFETIME || 3600),
  connectionTimeout: +(process.env.DB_CONNECTION_TIMEOUT || 10),
  ...(process.env.DB_SSL === "true" && {
    ssl: {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
      ...(process.env.DB_SSL_CA && { ca: process.env.DB_SSL_CA }),
    },
  }),
};

export const db = new SQL(DB_CONFIG);
export type { SQL };

// Health & Monitoring
export async function checkConnection(): Promise<boolean> {
  try {
    await db`SELECT 1`;
    return true;
  } catch (e) {
    console.error("Database connection failed:", e);
    return false;
  }
}

export async function getPoolStatus(): Promise<PoolStatus> {
  const healthy = await checkConnection();
  const p = db as unknown as { activeConnections?: number; idleConnections?: number; totalConnections?: number };
  return { active: p.activeConnections ?? 0, idle: p.idleConnections ?? 0, total: p.totalConnections ?? 0, healthy };
}

// Retry Logic
const isRetryable = (e: unknown): boolean => {
  if (!(e instanceof Error)) return false;
  const code = (e as Error & { code?: string }).code;
  if (code && RETRYABLE_ERRORS.has(code)) return true;
  const msg = e.message.toLowerCase();
  return msg.includes("connection") || msg.includes("timeout") || msg.includes("deadlock");
};

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

export async function withRetry<T>(op: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  let lastErr: Error | undefined;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await op();
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      if (i < maxRetries && isRetryable(e)) {
        const delay = baseDelay * (2 ** i);
        console.warn(`DB op failed (${i + 1}/${maxRetries + 1}), retry in ${delay}ms: ${lastErr.message}`);
        await sleep(delay);
      } else break;
    }
  }
  throw new DatabaseError(
    `DB op failed after ${maxRetries + 1} attempts: ${lastErr?.message}`,
    (lastErr as Error & { code?: string })?.code, undefined, lastErr
  );
}

// Query Helpers
export const queryOne = async <T>(s: TemplateStringsArray, ...v: unknown[]): Promise<T | null> =>
  (await db<T[]>(s, ...v))[0] ?? null;

export const queryMany = async <T>(s: TemplateStringsArray, ...v: unknown[]): Promise<T[]> =>
  db<T[]>(s, ...v);

export async function withReservedConnection<T>(op: (conn: SQL) => Promise<T>): Promise<T> {
  const r = await db.reserve();
  try { return await op(r); } finally { r.release(); }
}

export const withTransaction = <T>(op: (tx: SQL) => Promise<T>, maxRetries = 3): Promise<T> =>
  withRetry(() => db.begin(op), maxRetries, 500);

// Database Initialization
const stripComments = (sql: string) => sql.split("\n").filter(l => !l.trim().startsWith("--")).join("\n").trim();

const runSqlFile = async (filePath: string, label: string) => {
  const content = await Bun.file(filePath).text();
  const stmts = content.split(";").map(stripComments).filter(Boolean);
  const reserved = await db.reserve();
  try {
    for (const stmt of stmts) {
      try { await reserved.unsafe(stmt); }
      catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`Error in ${label}:`, stmt.substring(0, 100));
        throw new DatabaseError(`${label} failed: ${msg}`, (e as Error & { code?: string })?.code, stmt.substring(0, 200), e instanceof Error ? e : undefined);
      }
    }
  } finally { reserved.release(); }
};

export const initializeDatabase = () => runSqlFile(import.meta.dir + "/schema.sql", "Schema init").then(() => console.log("Database schema initialized"));
export const seedDatabase = () => runSqlFile(import.meta.dir + "/seed.sql", "Seed").then(() => console.log("Database seeded successfully"));

export async function closeConnection(): Promise<void> {
  try { await db.close(); console.log("Database connection closed"); }
  catch (e) { console.error("Error closing database:", e); }
}

export const logDbConfig = () => console.log("Database config:", {
  adapter: DB_CONFIG.adapter, hostname: DB_CONFIG.hostname, port: DB_CONFIG.port,
  database: DB_CONFIG.database, poolMax: DB_CONFIG.max, idleTimeout: DB_CONFIG.idleTimeout,
  maxLifetime: DB_CONFIG.maxLifetime, connectionTimeout: DB_CONFIG.connectionTimeout, sslEnabled: process.env.DB_SSL === "true",
});
