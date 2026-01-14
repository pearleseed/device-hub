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
      const url = new URL(request.url);
      const status = url.searchParams.get("status");
      let sql = "SELECT * FROM v_renewal_details WHERE 1=1";
      const params: unknown[] = [];
      if (!requireAdmin(payload)) {
        sql += " AND user_id = ?";
        params.push(payload.userId);
      }
      if (status) {
        sql += " AND status = ?";
        params.push(status);
      }
      sql += " ORDER BY created_at DESC";
      return ok(await db.unsafe<RenewalRequestWithDetails[]>(sql, params));
    });
  },

  async getById(request: Request, params: Record<string, string>): Promise<Response> {
    return withAuth(request, async (payload) => {
      const id = parseId(params.id);
      if (!id) return err("Invalid renewal ID");
      const [renewal] = await db<RenewalRequestWithDetails[]>`SELECT * FROM v_renewal_details WHERE id = ${id}`;
      if (!renewal) return notFound("Renewal");
      if (!requireAdmin(payload) && renewal.user_id !== payload.userId) return forbidden();
      return ok(renewal);
    });
  },

  async create(request: Request): Promise<Response> {
    return withAuth(request, async (payload) => {
      const body: CreateRenewalRequest = await request.json();
      const { borrow_request_id, requested_end_date, reason } = body;
      if (!borrow_request_id || !requested_end_date || !reason?.trim()) return err("Required fields missing");

      const [borrow] = await db<BorrowRequest[]>`SELECT * FROM borrow_requests WHERE id = ${borrow_request_id}`;
      if (!borrow) return notFound("Borrow request");
      if (borrow.user_id !== payload.userId && !requireAdmin(payload)) return forbidden();
      if (borrow.status !== "active") return err("Only active borrowings can be renewed");
      
      const [existing] = await db<RenewalRequest[]>`SELECT id FROM renewal_requests WHERE borrow_request_id = ${borrow_request_id} AND status = 'pending'`;
      if (existing) return err("A pending renewal request already exists for this loan");

      const requestedDate = new Date(requested_end_date);
      const currentDate = new Date(borrow.end_date);
      if (requestedDate <= currentDate) return err("Requested end date must be after current end date");

      await db`INSERT INTO renewal_requests (borrow_request_id, user_id, current_end_date, requested_end_date, reason) 
               VALUES (${borrow_request_id}, ${borrow.user_id}, ${borrow.end_date}, ${requested_end_date}, ${reason.trim()})`;
      const [newRenewal] = await db<RenewalRequestWithDetails[]>`SELECT * FROM v_renewal_details WHERE borrow_request_id = ${borrow_request_id} ORDER BY created_at DESC LIMIT 1`;

      if (newRenewal) notifyAdmins("new_request", "New Renewal Request", `${newRenewal.user_name} requested extension for ${newRenewal.device_name}`, "/admin/requests?tab=renewal", newRenewal.id, newRenewal.device_id).catch(console.error);
      return created(newRenewal, "Renewal requested successfully");
    });
  },

  async updateStatus(request: Request, params: Record<string, string>): Promise<Response> {
    return withAdmin(request, async (payload) => {
      const id = parseId(params.id);
      if (!id) return err("Invalid renewal ID");
      const { status } = await request.json() as { status: RenewalStatus };
      if (!VALID_STATUSES.includes(status)) return err("Invalid status");

      const [renewal] = await db<RenewalRequest[]>`SELECT * FROM renewal_requests WHERE id = ${id}`;
      if (!renewal) return notFound("Renewal");
      if (renewal.status !== "pending") return err("Only pending renewals can be reviewed");

      await db.begin(async (tx) => {
        await tx`UPDATE renewal_requests SET status = ${status}, reviewed_by = ${payload.userId}, reviewed_at = NOW() WHERE id = ${id}`;
        if (status === "approved") {
          const reqEndDate = renewal.requested_end_date instanceof Date ? renewal.requested_end_date.toISOString().split("T")[0] : renewal.requested_end_date;
          await tx`UPDATE borrow_requests SET end_date = ${reqEndDate}, updated_at = NOW() WHERE id = ${renewal.borrow_request_id}`;
        }
      });

      const [updated] = await db<RenewalRequestWithDetails[]>`SELECT * FROM v_renewal_details WHERE id = ${id}`;
      if (updated) {
        createNotification({ user_id: renewal.user_id, type: status === "approved" ? "renewal_approved" : "renewal_rejected", title: status === "approved" ? "Renewal Approved" : "Renewal Rejected", message: `Your renewal for ${updated.device_name} has been ${status}`, link: "/loans?tab=active", related_request_id: renewal.borrow_request_id, related_device_id: updated.device_id }).catch(console.error);
      }

      await auditLogger.log({ action: "status_change", objectType: "renewal_request", objectId: id, actor: auditLogger.createActorFromPayload(payload), changes: { before: { status: "pending" }, after: { status } }, metadata: { borrow_request_id: renewal.borrow_request_id } });
      return ok(updated, `Renewal ${status}`);
    });
  },

  async getByBorrowRequest(request: Request, params: Record<string, string>): Promise<Response> {
    return withAuth(request, async (payload) => {
      const borrowId = parseId(params.borrowId);
      if (!borrowId) return err("Invalid borrow request ID");
      const [borrow] = await db<BorrowRequest[]>`SELECT * FROM borrow_requests WHERE id = ${borrowId}`;
      if (!borrow) return notFound("Borrow request");
      if (borrow.user_id !== payload.userId && !requireAdmin(payload)) return forbidden();
      return ok(await db<RenewalRequestWithDetails[]>`SELECT * FROM v_renewal_details WHERE borrow_request_id = ${borrowId} ORDER BY created_at DESC`);
    });
  },

  async getByStatus(request: Request, params: Record<string, string>): Promise<Response> {
    return withAdmin(request, async () => {
      const { status } = params;
      return ok(await db<RenewalRequestWithDetails[]>`SELECT * FROM v_renewal_details WHERE status = ${status} ORDER BY created_at DESC`);
    });
  },
};
