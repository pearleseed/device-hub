import { authenticateRequest, requireAdmin } from "../middleware/auth";
import {
  auditLogger,
  type AuditAction,
  type AuditObjectType,
} from "../services/audit-logger";

// JSON response helper
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const auditRoutes = {
  // GET /api/audit
  async getLogs(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload || !requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const url = new URL(request.url);
      const startDate = url.searchParams.get("startDate") || undefined;
      const endDate = url.searchParams.get("endDate") || undefined;
      const objectType = url.searchParams.get("objectType") as
        | AuditObjectType
        | undefined;
      const objectId = url.searchParams.get("objectId");
      const actorId = url.searchParams.get("actorId");
      const action = url.searchParams.get("action") as AuditAction | undefined;
      const limit = url.searchParams.get("limit");

      const logs = await auditLogger.getLogs({
        startDate,
        endDate,
        objectType,
        objectId: objectId ? parseInt(objectId) : undefined,
        actorId: actorId ? parseInt(actorId) : undefined,
        action,
        limit: limit ? parseInt(limit) : 100,
      });

      return jsonResponse({ success: true, data: logs });
    } catch (error) {
      console.error("Get audit logs error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get audit logs" },
        500,
      );
    }
  },

  // GET /api/audit/object/:type/:id
  async getByObject(
    request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload || !requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const objectType = params.type as AuditObjectType;
      const objectId = parseInt(params.id);

      if (isNaN(objectId)) {
        return jsonResponse(
          { success: false, error: "Invalid object ID" },
          400,
        );
      }

      const validTypes: AuditObjectType[] = [
        "device",
        "user",
        "department",
        "borrow_request",
        "return_request",
        "renewal_request",
      ];

      if (!validTypes.includes(objectType)) {
        return jsonResponse(
          { success: false, error: "Invalid object type" },
          400,
        );
      }

      const logs = await auditLogger.getLogs({ objectType, objectId });

      return jsonResponse({ success: true, data: logs });
    } catch (error) {
      console.error("Get audit logs by object error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get audit logs" },
        500,
      );
    }
  },
};
