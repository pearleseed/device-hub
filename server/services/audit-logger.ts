import * as fs from "fs";
import * as path from "path";
import type { JWTPayload } from "../types";

// Audit log types
export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "status_change"
  | "password_reset"
  | "account_lock"
  | "account_unlock";

export type AuditObjectType =
  | "device"
  | "user"
  | "department"
  | "borrow_request"
  | "return_request"
  | "renewal_request";

export interface AuditLogEntry {
  timestamp: string;
  action: AuditAction;
  objectType: AuditObjectType;
  objectId: number;
  actor: {
    userId: number;
    email: string;
    role: string;
  };
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
}

// Sensitive fields that should be masked in logs
const SENSITIVE_FIELDS = [
  "password",
  "password_hash",
  "token",
  "secret",
  "api_key",
];

class AuditLogger {
  private logDir: string;
  private currentLogFile: string;

  constructor() {
    this.logDir = path.join(process.cwd(), "server", "logs", "audit");
    this.currentLogFile = this.getLogFileName();
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogFileName(): string {
    const date = new Date().toISOString().split("T")[0];
    return path.join(this.logDir, `audit-${date}.json`);
  }

  private maskSensitiveData(
    data: Record<string, unknown> | undefined,
  ): Record<string, unknown> | undefined {
    if (!data) return undefined;

    const masked = { ...data };
    for (const key of Object.keys(masked)) {
      if (SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field))) {
        masked[key] = "[REDACTED]";
      }
    }
    return masked;
  }

  private rotateLogFileIfNeeded(): void {
    const expectedFile = this.getLogFileName();
    if (this.currentLogFile !== expectedFile) {
      this.currentLogFile = expectedFile;
    }
  }

  async log(entry: Omit<AuditLogEntry, "timestamp">): Promise<void> {
    this.rotateLogFileIfNeeded();

    const logEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      changes: entry.changes
        ? {
            before: this.maskSensitiveData(entry.changes.before),
            after: this.maskSensitiveData(entry.changes.after),
          }
        : undefined,
    };

    try {
      let logs: AuditLogEntry[] = [];

      if (fs.existsSync(this.currentLogFile)) {
        const content = fs.readFileSync(this.currentLogFile, "utf-8");
        try {
          logs = JSON.parse(content);
        } catch {
          logs = [];
        }
      }

      logs.push(logEntry);
      fs.writeFileSync(this.currentLogFile, JSON.stringify(logs, null, 2));

      // Also log to console for debugging
      console.log(
        `[AUDIT] ${logEntry.action.toUpperCase()} ${logEntry.objectType}#${logEntry.objectId} by user#${logEntry.actor.userId}`,
      );
    } catch (error) {
      console.error("Failed to write audit log:", error);
    }
  }

  // Helper method to create audit entry from JWT payload
  createActorFromPayload(payload: JWTPayload): AuditLogEntry["actor"] {
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  }

  // Get audit logs with optional filters
  async getLogs(options?: {
    startDate?: string;
    endDate?: string;
    objectType?: AuditObjectType;
    objectId?: number;
    actorId?: number;
    action?: AuditAction;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    const allLogs: AuditLogEntry[] = [];

    try {
      const files = fs
        .readdirSync(this.logDir)
        .filter((f) => f.endsWith(".json"));

      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        try {
          const logs: AuditLogEntry[] = JSON.parse(content);
          allLogs.push(...logs);
        } catch {
          continue;
        }
      }
    } catch {
      return [];
    }

    let filtered = allLogs;

    if (options?.startDate) {
      filtered = filtered.filter((l) => l.timestamp >= options.startDate!);
    }
    if (options?.endDate) {
      filtered = filtered.filter((l) => l.timestamp <= options.endDate!);
    }
    if (options?.objectType) {
      filtered = filtered.filter((l) => l.objectType === options.objectType);
    }
    if (options?.objectId) {
      filtered = filtered.filter((l) => l.objectId === options.objectId);
    }
    if (options?.actorId) {
      filtered = filtered.filter((l) => l.actor.userId === options.actorId);
    }
    if (options?.action) {
      filtered = filtered.filter((l) => l.action === options.action);
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();
