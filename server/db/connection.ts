import { SQL } from "bun";

// ============================================================================
// Types
// ============================================================================

/**
 * Pool status information for health monitoring
 */
export interface PoolStatus {
  active: number;
  idle: number;
  total: number;
  healthy: boolean;
}

/**
 * Custom database error with additional context
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly query?: string,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = "DatabaseError";
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError);
    }
  }
}

/**
 * Retryable error codes for MySQL
 */
const RETRYABLE_ERROR_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "PROTOCOL_CONNECTION_LOST",
  "ER_LOCK_DEADLOCK",
  "ER_LOCK_WAIT_TIMEOUT",
]);

// ============================================================================
// Configuration
// ============================================================================

/**
 * Build SSL configuration if enabled
 */
function buildSSLConfig(): object | undefined {
  if (process.env.DB_SSL !== "true") {
    return undefined;
  }

  return {
    ssl: {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
      ...(process.env.DB_SSL_CA && { ca: process.env.DB_SSL_CA }),
    },
  };
}

/**
 * Database configuration from environment variables with connection pooling
 */
const DB_CONFIG = {
  adapter: "mysql" as const,
  hostname: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "device_hub",
  // Connection pool settings
  max: parseInt(process.env.DB_POOL_MAX || "20"),
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || "30"),
  maxLifetime: parseInt(process.env.DB_MAX_LIFETIME || "3600"),
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || "10"),
  // SSL configuration (spread only if defined)
  ...buildSSLConfig(),
};

// Create database connection using Bun SQL
// Use as tagged template: db`SELECT * FROM users WHERE id = ${id}`
export const db = new SQL(DB_CONFIG);

// Re-export SQL type for transaction callbacks
export type { SQL };

// ============================================================================
// Health & Monitoring
// ============================================================================

/**
 * Health check - verifies database connection is working
 */
export async function checkConnection(): Promise<boolean> {
  try {
    await db`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

/**
 * Get connection pool status for monitoring
 */
export async function getPoolStatus(): Promise<PoolStatus> {
  const healthy = await checkConnection();

  // Access pool metrics if available
  const poolInfo = db as unknown as {
    activeConnections?: number;
    idleConnections?: number;
    totalConnections?: number;
  };

  return {
    active: poolInfo.activeConnections ?? 0,
    idle: poolInfo.idleConnections ?? 0,
    total: poolInfo.totalConnections ?? 0,
    healthy,
  };
}

// ============================================================================
// Error Handling & Retry Logic
// ============================================================================

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const errorCode = (error as Error & { code?: string }).code;
    if (errorCode && RETRYABLE_ERROR_CODES.has(errorCode)) {
      return true;
    }
    // Check for connection-related error messages
    const message = error.message.toLowerCase();
    if (
      message.includes("connection") ||
      message.includes("timeout") ||
      message.includes("deadlock")
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute an operation with retry logic and exponential backoff
 * @param operation - The async operation to execute
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in ms for exponential backoff (default: 1000)
 * @returns The result of the operation
 * @throws DatabaseError if all retries fail
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries && isRetryableError(error)) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(
          `Database operation failed (attempt ${attempt + 1}/${maxRetries + 1}), ` +
            `retrying in ${delay}ms: ${lastError.message}`,
        );
        await sleep(delay);
      } else {
        break;
      }
    }
  }

  throw new DatabaseError(
    `Database operation failed after ${maxRetries + 1} attempts: ${lastError?.message}`,
    (lastError as Error & { code?: string })?.code,
    undefined,
    lastError,
  );
}

// ============================================================================
// Type-Safe Query Helpers
// ============================================================================

/**
 * Execute a query and return the first result or null
 * @param strings - Template strings
 * @param values - Template values
 * @returns The first result or null if not found
 */
export async function queryOne<T>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T | null> {
  const results = await db<T[]>(strings, ...values);
  return results[0] ?? null;
}

/**
 * Execute a query and return all results
 * @param strings - Template strings
 * @param values - Template values
 * @returns Array of results
 */
export async function queryMany<T>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  return await db<T[]>(strings, ...values);
}

/**
 * Execute an operation with a reserved connection
 * Useful for operations requiring connection affinity
 * @param operation - The operation to execute with the reserved connection
 * @returns The result of the operation
 */
export async function withReservedConnection<T>(
  operation: (conn: SQL) => Promise<T>,
): Promise<T> {
  const reserved = await db.reserve();
  try {
    return await operation(reserved);
  } finally {
    reserved.release();
  }
}

/**
 * Execute an operation within a transaction with retry support
 * @param operation - The transactional operation
 * @param maxRetries - Maximum retry attempts for deadlocks
 * @returns The result of the operation
 */
export async function withTransaction<T>(
  operation: (tx: SQL) => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  return withRetry(
    () => db.begin(operation),
    maxRetries,
    500, // Shorter delay for transaction retries
  );
}

// ============================================================================
// Database Initialization
// ============================================================================

/**
 * Remove SQL comments from a statement while preserving the actual SQL
 */
function stripSqlComments(sql: string): string {
  return sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .trim();
}

/**
 * Initialize database by running the schema SQL file.
 * Uses a reserved connection to ensure SET FOREIGN_KEY_CHECKS persists across statements.
 */
export async function initializeDatabase(): Promise<void> {
  const schemaFile = Bun.file(import.meta.dir + "/schema.sql");
  const schema = await schemaFile.text();

  const statements = schema
    .split(";")
    .map((s) => stripSqlComments(s))
    .filter((s) => s.length > 0);

  // Use reserved connection to ensure SET statements persist
  const reserved = await db.reserve();
  try {
    for (const statement of statements) {
      try {
        await reserved.unsafe(statement);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          "Error executing statement:",
          statement.substring(0, 100),
        );
        throw new DatabaseError(
          `Schema initialization failed: ${errorMessage}`,
          (error as Error & { code?: string })?.code,
          statement.substring(0, 200),
          error instanceof Error ? error : undefined,
        );
      }
    }
  } finally {
    reserved.release();
  }

  console.log("Database schema initialized");
}

/**
 * Seed database with initial data from seed.sql file.
 * Uses a reserved connection to ensure SET statements persist across statements.
 */
export async function seedDatabase(): Promise<void> {
  const seedFile = Bun.file(import.meta.dir + "/seed.sql");
  const seed = await seedFile.text();

  const statements = seed
    .split(";")
    .map((s) => stripSqlComments(s))
    .filter((s) => s.length > 0);

  // Use reserved connection to ensure SET statements persist
  const reserved = await db.reserve();
  try {
    for (const statement of statements) {
      try {
        await reserved.unsafe(statement);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          "Error executing seed statement:",
          statement.substring(0, 100),
        );
        throw new DatabaseError(
          `Database seeding failed: ${errorMessage}`,
          (error as Error & { code?: string })?.code,
          statement.substring(0, 200),
          error instanceof Error ? error : undefined,
        );
      }
    }
  } finally {
    reserved.release();
  }

  console.log("Database seeded successfully");
}

// ============================================================================
// Connection Lifecycle
// ============================================================================

/**
 * Close database connection gracefully.
 */
export async function closeConnection(): Promise<void> {
  try {
    await db.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error closing database connection:", error);
  }
}

/**
 * Log database configuration (without sensitive data)
 */
export function logDbConfig(): void {
  console.log("Database configuration:", {
    adapter: DB_CONFIG.adapter,
    hostname: DB_CONFIG.hostname,
    port: DB_CONFIG.port,
    database: DB_CONFIG.database,
    poolMax: DB_CONFIG.max,
    idleTimeout: DB_CONFIG.idleTimeout,
    maxLifetime: DB_CONFIG.maxLifetime,
    connectionTimeout: DB_CONFIG.connectionTimeout,
    sslEnabled: process.env.DB_SSL === "true",
  });
}
