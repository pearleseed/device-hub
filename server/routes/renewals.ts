import { db } from "../db/connection";
import { requireAdmin } from "../middleware/auth";
import { auditLogger } from "../services/audit-logger";
import { createNotification, notifyAdmins } from "./in-app-notifications";
import { ok, created, err, notFound, forbidden, parseId, withAuth, withAdmin } from "./_helpers";
import type { RenewalRequest, RenewalRequestWithDetails, CreateRenewalRequest, RenewalStatus, BorrowRequest } from "../types";

const VALID_STATUSES: RenewalStatus[] = ["pending", "approved", "rejected"];

export const renewalsRoutes = {
  async getAll(request: Request): Promise<Response> {
    return withAuth(request, async (payload) => {
      try {
        const url = new URL(request.url);
        const status = url.searchParams.get("status");
        let sql = "SELECT * FROM v_renewal_details WHERE 1=1";
        const params: unknown[] = [];
        if (!requireAdmin(payload)) { sql += " AND user_id = ?"; params.push(payload.userId); }
        if (status) { sql += " AND status = ?"; params.push(status); }
        sql += " ORDER BY created_at DESC";
        return ok(await db.unsafe<RenewalRequestWithDetails>(sql, params));
      } catch (e) { console.error("Get renewal requests error:", e); return err("Failed to get renewal requests", 500); }
    });
  },

  async getById(request: Request, params: Record<string, string>): Promise<Response> {
    return withAuth(request, async (payload) => {
      try {
        const id = parseId(params.id);
        if (!id) return err("Invalid renewal request ID");
        const [renewal] = await db<RenewalRequestWithDetails[]>`SELECT * FROM v_renewal_details WHERE id = ${id}`;
        if (!renewal) return notFound("Renewal request");
        if (!requireAdmin(payload) && renewal.user_id !== payload.userId) return forbidden();
        return ok(renewal);
      } catch (e) { console.error("Get renewal request error:", e); return err("Failed to get renewal request", 500); }
    });
  },

  async create(request: Request): Promise<Response> {
    return withAuth(request, async (payload) => {
      try {
        const { borrow_request_id, requested_end_date, reason }: CreateRenewalRequest = await request.json();
        if (!borrow_request_id) return err("Borrow request ID is required");
        if (!requested_end_date) return err("Requested end date is required");
        if (!reason?.trim()) return err("Reason is required");

        const [borrowReq] = await db<BorrowRequest[]>`SELECT * FROM borrow_requests WHERE id = ${borrow_request_id}`;
        if (!borrowReq) return notFound("Borrow request");
        if (borrowReq.status !== "active") return err("Can only request renewal for active loans");
        if (borrowReq.user_id !== payload.userId) return forbidden("You can only request renewal for your own loans");
        if (new Date(requested_end_date) <= new Date(borrowReq.end_date)) return err("Requested end date must be after current end date");

        const [existing] = await db<{ count: number }[]>`SELECT COUNT(*) as count FROM renewal_requests WHERE borrow_request_id = ${borrow_request_id} AND status = 'pending'`;
        if (existing.count > 0) return err("A pending renewal request already exists for this loan");

        const currentEndStr = borrowReq.end_date.toISOString().split("T")[0];
        await db`INSERT INTO renewal_requests (borrow_request_id, user_id, current_end_date, requested_end_date, reason) VALUES (${borrow_request_id}, ${payload.userId}, ${currentEndStr}, ${requested_end_date}, ${reason.trim()})`;

        const [newRenewal] = await db<RenewalRequestWithDetails[]>`SELECT * FROM v_renewal_details WHERE borrow_request_id = ${borrow_request_id} AND user_id = ${payload.userId} ORDER BY created_at DESC LIMIT 1`;
        if (newRenewal) notifyAdmins("new_request", "New Renewal Request", `${newRenewal.user_name} requested to extend ${newRenewal.device_name}`, "/admin/requests?tab=renewals", borrow_request_id, newRenewal.device_id).catch(console.error);
        return created(newRenewal, "Renewal request created");
      } catch (e) { console.error("Create renewal request error:", e); return err("Failed to create renewal request", 500); }
    });
  },

  async updateStatus(request: Request, params: Record<string, string>): Promise<Response> {
    return withAdmin(request, async (payload) => {
      try {
        const id = parseId(params.id);
        if (!id) return err("Invalid renewal request ID");
        const { status } = await request.json() as { status: RenewalStatus };
        if (!VALID_STATUSES.includes(status)) return err("Invalid status");

        const [current] = await db<RenewalRequest[]>`SELECT * FROM renewal_requests WHERE id = ${id}`;
        if (!current) return notFound("Renewal request");
        if (current.status !== "pending") return err("Can only update status of pending renewal requests");

        await db.begin(async (tx) => {
          if (status === "approved") {
            const [borrowReq] = await tx<{ device_id: number; end_date: Date }[]>`SELECT device_id, end_date FROM borrow_requests WHERE id = ${current.borrow_request_id}`;
            if (borrowReq) {
              const [conflict] = await tx<{ count: number }[]>`SELECT COUNT(*) as count FROM borrow_requests WHERE device_id = ${borrowReq.device_id} AND status IN ('pending', 'approved', 'active') AND id != ${current.borrow_request_id} AND start_date <= ${current.requested_end_date} AND end_date >= ${borrowReq.end_date}`;
              if (conflict.count > 0) throw new Error("Device is booked for the requested renewal period");
            }
          }
          await tx`UPDATE renewal_requests SET status = ${status}, reviewed_by = ${payload.userId}, reviewed_at = NOW() WHERE id = ${id}`;
          if (status === "approved") {
            const reqEndDate = current.requested_end_date.toISOString().split("T")[0];
            await tx`UPDATE borrow_requests SET end_date = ${reqEndDate}, updated_at = NOW() WHERE id = ${current.borrow_request_id}`;
          }
        });

        const [updated] = await db<RenewalRequestWithDetails[]>`SELECT * FROM v_renewal_details WHERE id = ${id}`;
        if (updated && (status === "approved" || status === "rejected")) {
          createNotification({ user_id: current.user_id, type: status === "approved" ? "renewal_approved" : "renewal_rejected", title: status === "approved" ? "Renewal Approved" : "Renewal Rejected", message: `Your renewal request for ${updated.device_name} has been ${status}`, link: "/loans?tab=active", related_request_id: current.borrow_request_id, related_device_id: updated.device_id }).catch(console.error);
        }

        await auditLogger.log({ action: "status_change", objectType: "renewal_request", objectId: id, actor: auditLogger.createActorFromPayload(payload), changes: { before: { status: current.status }, after: { status } }, metadata: { borrow_request_id: current.borrow_request_id, user_id: current.user_id, requested_end_date: current.requested_end_date } });
        return ok(updated, status === "approved" ? "Renewal approved" : "Renewal rejected");
      } catch (e) { console.error("Update renewal status error:", e); return err("Failed to update renewal status", 500); }
    });
  },

  async getByBorrowRequest(request: Request, params: Record<string, string>): Promise<Response> {
    return withAuth(request, async (payload) => {
      try {
        const borrowId = parseId(params.borrowId);
        if (!borrowId) return err("Invalid borrow request ID");
        let sql = "SELECT * FROM v_renewal_details WHERE borrow_request_id = ?";
        const sqlParams: unknown[] = [borrowId];
        if (!requireAdmin(payload)) { sql += " AND user_id = ?"; sqlParams.push(payload.userId); }
        sql += " ORDER BY created_at DESC";
        return ok(await db.unsafe<RenewalRequestWithDetails[]>(sql, sqlParams));
      } catch (e) { console.error("Get renewals by borrow request error:", e); return err("Failed to get renewal requests", 500); }
    });
  },

  async getByStatus(request: Request, params: Record<string, string>): Promise<Response> {
    return withAuth(request, async (payload) => {
      try {
        const status = params.status as RenewalStatus;
        if (!VALID_STATUSES.includes(status)) return err("Invalid status");
        let sql = "SELECT * FROM v_renewal_details WHERE status = ?";
        const sqlParams: unknown[] = [status];
        if (!requireAdmin(payload)) { sql += " AND user_id = ?"; sqlParams.push(payload.userId); }
        sql += " ORDER BY created_at DESC";
        return ok(await db.unsafe<RenewalRequestWithDetails[]>(sql, sqlParams));
      } catch (e) { console.error("Get renewals by status error:", e); return err("Failed to get renewal requests", 500); }
    });
  },
};
