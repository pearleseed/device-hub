import { db } from "../db/connection";
import { requireAdmin } from "../middleware/auth";
import { auditLogger } from "../services/audit-logger";
import { createNotification, notifyAdmins } from "./in-app-notifications";
import { ok, created, err, notFound, forbidden, parseId, withAuth } from "./_helpers";
import type { BorrowRequest, BorrowRequestWithDetails, CreateBorrowRequest, RequestStatus } from "../types";

const VALID_STATUSES: RequestStatus[] = ["pending", "approved", "active", "returned", "rejected"];
const TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  pending: ["approved", "rejected"], approved: ["active", "rejected"], active: ["returned"], returned: [], rejected: [],
};

export const borrowRoutes = {
  async getAll(request: Request): Promise<Response> {
    return withAuth(request, async (payload) => {
      try {
        const url = new URL(request.url);
        const { status, device_id } = Object.fromEntries(url.searchParams);
        let sql = "SELECT * FROM v_borrow_details WHERE 1=1";
        const params: unknown[] = [];
        if (!requireAdmin(payload)) { sql += " AND user_id = ?"; params.push(payload.userId); }
        if (status) { sql += " AND status = ?"; params.push(status); }
        if (device_id) { sql += " AND device_id = ?"; params.push(+device_id); }
        sql += " ORDER BY created_at DESC";
        return ok(await db.unsafe<BorrowRequestWithDetails>(sql, params));
      } catch (e) { console.error("Get borrow requests error:", e); return err("Failed to get borrow requests", 500); }
    });
  },

  async getById(request: Request, params: Record<string, string>): Promise<Response> {
    return withAuth(request, async (payload) => {
      try {
        const id = parseId(params.id);
        if (!id) return err("Invalid request ID");
        const [req] = await db<BorrowRequestWithDetails[]>`SELECT * FROM v_borrow_details WHERE id = ${id}`;
        if (!req) return notFound("Request");
        if (!requireAdmin(payload) && req.user_id !== payload.userId) return forbidden();
        return ok(req);
      } catch (e) { console.error("Get borrow request error:", e); return err("Failed to get borrow request", 500); }
    });
  },

  async create(request: Request): Promise<Response> {
    return withAuth(request, async (payload) => {
      try {
        const { device_id, start_date, end_date, reason }: CreateBorrowRequest = await request.json();
        if (!device_id) return err("Device ID is required");
        if (!start_date) return err("Start date is required");
        if (!end_date) return err("End date is required");
        if (!reason?.trim()) return err("Reason is required");

        const today = new Date().toISOString().split("T")[0];
        if (start_date < today) return err("Start date cannot be in the past");
        if (new Date(end_date) < new Date(start_date)) return err("End date must be after start date");

        const [device] = await db<{ id: number; status: string }[]>`SELECT id, status FROM devices WHERE id = ${device_id}`;
        if (!device) return notFound("Device");
        if (device.status === "maintenance") return err("Device is under maintenance");
        if (device.status === "borrowed") return err("Device is currently borrowed");

        // Check for any pending, approved, or active requests - block new requests
        const [conflict] = await db<{ count: number }[]>`SELECT COUNT(*) as count FROM borrow_requests WHERE device_id = ${device_id} AND status IN ('pending', 'approved', 'active')`;
        if (conflict.count > 0) return err("Device already has a pending or active request");

        await db`INSERT INTO borrow_requests (device_id, user_id, start_date, end_date, reason) VALUES (${device_id}, ${payload.userId}, ${start_date}, ${end_date}, ${reason.trim()})`;
        const [newReq] = await db<BorrowRequestWithDetails[]>`SELECT * FROM v_borrow_details WHERE device_id = ${device_id} AND user_id = ${payload.userId} ORDER BY created_at DESC LIMIT 1`;

        if (newReq) notifyAdmins("new_request", "New Device Request", `${newReq.user_name} requested ${newReq.device_name}`, "/admin/requests?tab=borrow", newReq.id, device_id).catch(console.error);
        return created(newReq, "Borrow request created");
      } catch (e) { console.error("Create borrow request error:", e); return err("Failed to create borrow request", 500); }
    });
  },

  async updateStatus(request: Request, params: Record<string, string>): Promise<Response> {
    return withAuth(request, async (payload) => {
      try {
        const id = parseId(params.id);
        if (!id) return err("Invalid request ID");
        const { status } = await request.json() as { status: RequestStatus };
        if (!VALID_STATUSES.includes(status)) return err("Invalid status");

        const [current] = await db<BorrowRequest[]>`SELECT * FROM borrow_requests WHERE id = ${id}`;
        if (!current) return notFound("Request");
        if (["approved", "rejected", "active"].includes(status) && !requireAdmin(payload)) return forbidden();
        if (!TRANSITIONS[current.status].includes(status)) return err(`Cannot transition from ${current.status} to ${status}`);

        await db.begin(async (tx) => {
          const approvedBy = ["approved", "rejected"].includes(status) ? payload.userId : current.approved_by;
          await tx`UPDATE borrow_requests SET status = ${status}, approved_by = ${approvedBy}, updated_at = NOW() WHERE id = ${id}`;
          if (status === "active") await tx`UPDATE devices SET status = 'borrowed' WHERE id = ${current.device_id}`;
          else if (status === "returned" || status === "rejected") {
            const [other] = await tx<{ count: number }[]>`SELECT COUNT(*) as count FROM borrow_requests WHERE device_id = ${current.device_id} AND status = 'active' AND id != ${id}`;
            if (other.count === 0) await tx`UPDATE devices SET status = 'available' WHERE id = ${current.device_id}`;
          }
        });

        const [updated] = await db<BorrowRequestWithDetails[]>`SELECT * FROM v_borrow_details WHERE id = ${id}`;
        if (updated && (status === "approved" || status === "rejected")) {
          createNotification({ user_id: current.user_id, type: status === "approved" ? "request_approved" : "request_rejected", title: status === "approved" ? "Request Approved" : "Request Rejected", message: `Your request for ${updated.device_name} has been ${status}`, link: status === "approved" ? "/loans?tab=active" : "/loans?tab=history", related_request_id: id, related_device_id: current.device_id }).catch(console.error);
        }

        await auditLogger.log({ action: "status_change", objectType: "borrow_request", objectId: id, actor: auditLogger.createActorFromPayload(payload), changes: { before: { status: current.status }, after: { status } }, metadata: { device_id: current.device_id, user_id: current.user_id } });
        return ok(updated, "Status updated");
      } catch (e) { console.error("Update status error:", e); return err("Failed to update status", 500); }
    });
  },

  async getByUser(request: Request, params: Record<string, string>): Promise<Response> {
    return withAuth(request, async (payload) => {
      try {
        const userId = parseId(params.userId);
        if (!userId) return err("Invalid user ID");
        if (payload.userId !== userId && !requireAdmin(payload)) return forbidden();
        return ok(await db<BorrowRequestWithDetails[]>`SELECT * FROM v_borrow_details WHERE user_id = ${userId} ORDER BY created_at DESC`);
      } catch (e) { console.error("Get user requests error:", e); return err("Failed to get requests", 500); }
    });
  },

  async getByStatus(request: Request, params: Record<string, string>): Promise<Response> {
    return withAuth(request, async (payload) => {
      try {
        const status = params.status as RequestStatus;
        if (!VALID_STATUSES.includes(status)) return err("Invalid status");
        let sql = "SELECT * FROM v_borrow_details WHERE status = ?";
        const sqlParams: unknown[] = [status];
        if (!requireAdmin(payload)) { sql += " AND user_id = ?"; sqlParams.push(payload.userId); }
        sql += " ORDER BY created_at DESC";
        return ok(await db.unsafe<BorrowRequestWithDetails>(sql, sqlParams));
      } catch (e) { console.error("Get requests by status error:", e); return err("Failed to get requests", 500); }
    });
  },
};
