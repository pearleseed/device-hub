import * as fs from "fs";
import * as path from "path";
import type { JWTPayload } from "../types";

export type AuditAction = "create" | "update" | "delete" | "status_change" | "password_reset" | "account_lock" | "account_unlock" | "bulk_import" | "bulk_export" | "admin_export" | "clear_temp_passwords";
export type AuditObjectType = "device" | "user" | "department" | "borrow_request" | "return_request" | "renewal_request";

export interface AuditLogEntry {
  timestamp: string;
  action: AuditAction;
  objectType: AuditObjectType;
  objectId: number;
  actor: { userId: number; email: string; role: string };
  changes?: { before?: Record<string, unknown>; after?: Record<string, unknown> };
  metadata?: Record<string, unknown>;
}

const SENSITIVE = ["password", "password_hash", "token", "secret", "api_key"];

class AuditLogger {
  private logDir = path.join(process.cwd(), "server", "logs", "audit");
  private currentFile = "";

  constructor() {
    if (!fs.existsSync(this.logDir)) fs.mkdirSync(this.logDir, { recursive: true });
    this.currentFile = this.getFileName();
  }

  private getFileName = () => path.join(this.logDir, `audit-${new Date().toISOString().split("T")[0]}.json`);

  private mask = (data?: Record<string, unknown>) => {
    if (!data) return undefined;
    const m = { ...data };
    for (const k of Object.keys(m)) if (SENSITIVE.some(s => k.toLowerCase().includes(s))) m[k] = "[REDACTED]";
    return m;
  };

  async log(entry: Omit<AuditLogEntry, "timestamp">): Promise<void> {
    const file = this.getFileName();
    if (this.currentFile !== file) this.currentFile = file;

    const logEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      changes: entry.changes ? { before: this.mask(entry.changes.before), after: this.mask(entry.changes.after) } : undefined,
    };

    try {
      let logs: AuditLogEntry[] = [];
      if (fs.existsSync(this.currentFile)) {
        try { logs = JSON.parse(fs.readFileSync(this.currentFile, "utf-8")); } catch { logs = []; }
      }
      logs.push(logEntry);
      fs.writeFileSync(this.currentFile, JSON.stringify(logs, null, 2));
      console.log(`[AUDIT] ${logEntry.action.toUpperCase()} ${logEntry.objectType}#${logEntry.objectId} by user#${logEntry.actor.userId}`);
    } catch (e) { console.error("Failed to write audit log:", e); }
  }

  createActorFromPayload = (p: JWTPayload): AuditLogEntry["actor"] => ({ userId: p.userId, email: p.email, role: p.role });

  async getLogs(opts?: { startDate?: string; endDate?: string; objectType?: AuditObjectType; objectId?: number; actorId?: number; action?: AuditAction; limit?: number }): Promise<AuditLogEntry[]> {
    const all: AuditLogEntry[] = [];
    try {
      for (const f of fs.readdirSync(this.logDir).filter(f => f.endsWith(".json"))) {
        try { all.push(...JSON.parse(fs.readFileSync(path.join(this.logDir, f), "utf-8"))); } catch { continue; }
      }
    } catch { return []; }

    let filtered = all;
    if (opts?.startDate) filtered = filtered.filter(l => l.timestamp >= opts.startDate!);
    if (opts?.endDate) filtered = filtered.filter(l => l.timestamp <= opts.endDate!);
    if (opts?.objectType) filtered = filtered.filter(l => l.objectType === opts.objectType);
    if (opts?.objectId) filtered = filtered.filter(l => l.objectId === opts.objectId);
    if (opts?.actorId) filtered = filtered.filter(l => l.actor.userId === opts.actorId);
    if (opts?.action) filtered = filtered.filter(l => l.action === opts.action);
    filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return opts?.limit ? filtered.slice(0, opts.limit) : filtered;
  }
}

export const auditLogger = new AuditLogger();
