import { auditLogger, type AuditAction, type AuditObjectType } from "../services/audit-logger";
import { ok, err, parseId, withAdmin } from "./_helpers";

const VALID_TYPES: AuditObjectType[] = ["device", "user", "department", "borrow_request", "return_request", "renewal_request"];

export const auditRoutes = {
  async getLogs(request: Request): Promise<Response> {
    return withAdmin(request, async () => {
      try {
        const url = new URL(request.url);
        const p = Object.fromEntries(url.searchParams);
        const logs = await auditLogger.getLogs({
          startDate: p.startDate, endDate: p.endDate,
          objectType: p.objectType as AuditObjectType | undefined,
          objectId: p.objectId ? +p.objectId : undefined,
          actorId: p.actorId ? +p.actorId : undefined,
          action: p.action as AuditAction | undefined,
          limit: p.limit ? +p.limit : 100,
        });
        return ok(logs);
      } catch (e) { console.error("Get audit logs error:", e); return err("Failed to get audit logs", 500); }
    });
  },

  async getByObject(request: Request, params: Record<string, string>): Promise<Response> {
    return withAdmin(request, async () => {
      try {
        const objectType = params.type as AuditObjectType;
        const objectId = parseId(params.id);
        if (!objectId) return err("Invalid object ID");
        if (!VALID_TYPES.includes(objectType)) return err("Invalid object type");
        return ok(await auditLogger.getLogs({ objectType, objectId }));
      } catch (e) { console.error("Get audit logs by object error:", e); return err("Failed to get audit logs", 500); }
    });
  },
};
