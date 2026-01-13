import { db } from "../db/connection";
import { requireAdmin } from "../middleware/auth";
import { auditLogger } from "../services/audit-logger";
import { createNotification, notifyAdmins } from "./in-app-notifications";
import { ok, created, err, notFound, forbidden, parseId, withAuth, withAdmin } from "./_helpers";
import type { ReturnRequest, ReturnRequestWithDetails, CreateReturnRequest, DeviceCondition } from "../types";

const VALID_CONDITIONS: DeviceCondition[] = ["excellent", "good", "fair", "damaged"];

export const returnsRoutes = {
  async getAll(request: Request): Promise<Response> {
    return withAuth(request, async (payload) => {
      try {
        const url = new URL(request.url);
        const condition = url.searchParams.get("condition");
        let sql = "SELECT * FROM v_return_details WHERE 1=1";
        const params: unknown[] = [];
        if (!requireAdmin(payload)) { sql += " AND user_id = ?"; params.push(payload.userId); }
        if (condition) { sql += " AND device_condition = ?"; params.push(condition); }
        sql += " ORDER BY created_at DESC";
        return ok(await db.unsafe<ReturnRequestWithDetails[]>(sql, params));
      } catch (e) { console.error("Get return requests error:", e); return err("Failed to get return requests", 500); }
    });
  },

  async getById(request: Request, params: Record<string, string>): Promise<Response> {
    return withAuth(request, async (payload) => {
      try {
        const id = parseId(params.id);
        if (!id) return err("Invalid return request ID");
        const [req] = await db<ReturnRequestWithDetails[]>`SELECT * FROM v_return_details WHERE id = ${id}`;
        if (!req) return notFound("Return request");
        if (!requireAdmin(payload) && req.user_id !== payload.userId) return forbidden();
        return ok(req);
      } catch (e) { console.error("Get return request error:", e); return err("Failed to get return request", 500); }
    });
  },

  async create(request: Request): Promise<Response> {
    return withAuth(request, async (payload) => {
      try {
        const { borrow_request_id, condition, notes }: CreateReturnRequest = await request.json();
        if (!borrow_request_id) return err("Borrow request ID is required");
        if (!condition || !VALID_CONDITIONS.includes(condition)) return err("Valid condition is required");
        if (condition === "damaged" && (!notes || !notes.trim())) return err("Notes are required when device is returned in damaged condition");

        const [borrowReq] = await db<{ id: number; user_id: number; status: string; device_id: number }[]>`SELECT id, user_id, status, device_id FROM borrow_requests WHERE id = ${borrow_request_id}`;
        if (!borrowReq) return notFound("Borrow request");
        if (borrowReq.user_id !== payload.userId && !requireAdmin(payload)) return forbidden();
        if (borrowReq.status !== "active") return err("Can only create return request for active borrowings");

        const [existing] = await db<ReturnRequest[]>`SELECT id FROM return_requests WHERE borrow_request_id = ${borrow_request_id}`;
        if (existing) return err("Return request already exists");

        await db.begin(async (tx) => {
          await tx`INSERT INTO return_requests (borrow_request_id, return_date, device_condition, notes) VALUES (${borrow_request_id}, CURDATE(), ${condition}, ${notes || null})`;
          await tx`UPDATE borrow_requests SET status = 'returned', updated_at = NOW() WHERE id = ${borrow_request_id}`;
          await tx`UPDATE devices SET status = ${condition === "damaged" ? "maintenance" : "available"} WHERE id = ${borrowReq.device_id}`;
        });

        const [newReturn] = await db<ReturnRequestWithDetails[]>`SELECT * FROM v_return_details WHERE borrow_request_id = ${borrow_request_id}`;
        if (newReturn) {
          notifyAdmins("device_returned", "Device Returned", `${newReturn.user_name} returned ${newReturn.device_name} (${condition})`, "/admin/inventory", borrow_request_id, newReturn.device_id).catch(console.error);
          createNotification({ user_id: borrowReq.user_id, type: "device_returned", title: "Device Return Confirmed", message: `Your return of ${newReturn.device_name} has been processed`, link: "/loans?tab=history", related_request_id: borrow_request_id, related_device_id: newReturn.device_id }).catch(console.error);
        }

        await auditLogger.log({ action: "create", objectType: "return_request", objectId: newReturn?.id || 0, actor: auditLogger.createActorFromPayload(payload), changes: { after: { borrow_request_id, condition, notes, device_id: borrowReq.device_id } } });
        return created(newReturn, "Return request created");
      } catch (e) { console.error("Create return request error:", e); return err("Failed to create return request", 500); }
    });
  },

  async updateCondition(request: Request, params: Record<string, string>): Promise<Response> {
    return withAdmin(request, async (payload) => {
      try {
        const id = parseId(params.id);
        if (!id) return err("Invalid return request ID");
        const { condition } = await request.json() as { condition: DeviceCondition };
        if (!condition || !VALID_CONDITIONS.includes(condition)) return err("Valid condition is required");

        const [returnReq] = await db<ReturnRequestWithDetails[]>`SELECT * FROM v_return_details WHERE id = ${id}`;
        if (!returnReq) return notFound("Return request");

        await db`UPDATE return_requests SET device_condition = ${condition} WHERE id = ${id}`;
        if (returnReq.device_id) await db`UPDATE devices SET status = ${condition === "damaged" ? "maintenance" : "available"} WHERE id = ${returnReq.device_id}`;

        const [updated] = await db<ReturnRequestWithDetails[]>`SELECT * FROM v_return_details WHERE id = ${id}`;
        await auditLogger.log({ action: "update", objectType: "return_request", objectId: id, actor: auditLogger.createActorFromPayload(payload), changes: { before: { condition: returnReq.device_condition }, after: { condition } } }).catch(console.error);
        return ok(updated, "Return condition updated");
      } catch (e) { 
        const errorMessage = e instanceof Error ? e.message : (typeof e === 'object' ? JSON.stringify(e) : String(e));
        return err(`Failed to update return condition: ${errorMessage}`, 500); 
      }
    });
  },
};
