import { db } from "../db/connection";
import { requireAdmin } from "../middleware/auth";
import { auditLogger } from "../services/audit-logger";
import { createNotification, notifyAdmins } from "./in-app-notifications";
import { ok, created, err, notFound, forbidden, parseId, withAuth } from "./_helpers";
import type { BorrowRequest, BorrowRequestWithDetails, CreateBorrowRequest, RequestStatus } from "../types";

const VALID_STATUSES: RequestStatus[] = ["pending", "approved", "active", "returned", "rejected"];
// Define allowed status transitions (State Machine)
const TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  pending: ["approved", "rejected"],    // Initial state
  approved: ["active", "rejected"],     // Approved, waiting for pickup/start
  active: ["returned"],                 // Device is in use
  returned: [],                         // Terminal state
  rejected: [],                         // Terminal state
};

export const borrowRoutes = {
  /**
   * GET /api/borrow
   * Retrieve borrow requests.
   * Access: Admin (all), User (own only).
   * Query Params: status, device_id.
   */
  async getAll(request: Request): Promise<Response> {
    return withAuth(request, async (payload) => {
      const url = new URL(request.url);
      const { status, device_id } = Object.fromEntries(url.searchParams);
      let sql = "SELECT * FROM v_borrow_details WHERE 1=1";
      const params: unknown[] = [];
      
      // Access Logic: Admins see all, Users see only their own
      if (!requireAdmin(payload)) {
        sql += " AND user_id = ?";
        params.push(payload.userId);
      }
      if (status) {
        sql += " AND status = ?";
        params.push(status);
      }
      if (device_id) {
        sql += " AND device_id = ?";
        params.push(+device_id);
      }
      sql += " ORDER BY created_at DESC";
      return ok(await db.unsafe<BorrowRequestWithDetails[]>(sql, params));
    });
  },

  /**
   * GET /api/borrow/:id
   * Get details of a specific borrow request.
   * Access: Admin or Request Owner.
   */
  async getById(request: Request, params: Record<string, string>): Promise<Response> {
    return withAuth(request, async (payload) => {
      const id = parseId(params.id);
      if (!id) return err("Invalid request ID");
      const [req] = await db<BorrowRequestWithDetails[]>`SELECT * FROM v_borrow_details WHERE id = ${id}`;
      if (!req) return notFound("Request");
      if (!requireAdmin(payload) && req.user_id !== payload.userId) return forbidden();
      return ok(req);
    });
  },

  /**
   * POST /api/borrow
   * Create a new borrow request.
   * Handles date validation, availability checking, and notifications.
   */
  async create(request: Request): Promise<Response> {
    return withAuth(request, async (payload) => {
      const body: CreateBorrowRequest & { user_id?: number } = await request.json();
      const { device_id, start_date, end_date, reason, user_id: requestedUserId } = body;
      if (!device_id) { console.log("[BORROW] Missing device_id"); return err("Device ID is required"); }
      if (!start_date) { console.log("[BORROW] Missing start_date"); return err("Start date is required"); }
      if (!end_date) { console.log("[BORROW] Missing end_date"); return err("End date is required"); }
      if (!reason?.trim()) { console.log("[BORROW] Missing reason"); return err("Reason is required"); }

      // Admin can create request on behalf of another user
      let targetUserId = payload.userId;
      if (requestedUserId && requestedUserId !== payload.userId) {
        if (!requireAdmin(payload)) {
          return forbidden("Only admins can create requests on behalf of other users");
        }
        // Verify target user exists and is active
        const [targetUser] = await db<{ id: number; is_active: boolean }[]>`SELECT id, is_active FROM users WHERE id = ${requestedUserId}`;
        if (!targetUser) return notFound("User");
        if (!targetUser.is_active) return err("Cannot create request for inactive user");
        targetUserId = requestedUserId;
      }

      const today = new Date().toISOString().split("T")[0];
      if (start_date < today) { console.log(`[BORROW] Past start date: ${start_date} < ${today}`); return err("Start date cannot be in the past"); }
      if (new Date(end_date) < new Date(start_date)) { console.log(`[BORROW] End before start: ${end_date} < ${start_date}`); return err("End date must be after start date"); }

      const [device] = await db<{ id: number; status: string }[]>`SELECT id, status FROM devices WHERE id = ${device_id}`;

      if (!device) { console.log(`[BORROW] Device not found: ${device_id}`); return notFound("Device"); }
      if (device.status === "maintenance") { console.log(`[BORROW] Device in maintenance: ${device_id}`); return err("Device is under maintenance"); }
      
      // Check for overlapping bookings
      const conflicts = await db<{ count: number; id: number; start_date: string; end_date: string; status: string }[]>`
        SELECT id, start_date, end_date, status FROM borrow_requests 
        WHERE device_id = ${device_id} 
        AND status IN ('pending', 'approved', 'active')
        AND DATE(start_date) < ${end_date} AND DATE(end_date) > ${start_date}`;
      
      if (conflicts.length > 0) {
        console.log(`[BORROW] Conflict detected for ${device_id}:`, conflicts);
        return err("Device is already booked for the requested period");
      }

      await db`INSERT INTO borrow_requests (device_id, user_id, start_date, end_date, reason) VALUES (${device_id}, ${targetUserId}, ${start_date}, ${end_date}, ${reason.trim()})`;
      const [newReq] = await db<BorrowRequestWithDetails[]>`SELECT * FROM v_borrow_details WHERE device_id = ${device_id} AND user_id = ${targetUserId} ORDER BY created_at DESC LIMIT 1`;

      if (newReq) {
        // If admin created on behalf of user, notify the user
        if (targetUserId !== payload.userId) {
          createNotification({
            user_id: targetUserId,
            type: "info",
            title: "notifications.requestCreated",
            message: `An admin has created a borrow request for ${newReq.device_name} on your behalf.`,
            link: "/loans?tab=history",
            related_request_id: newReq.id,
            related_device_id: device_id
          }).catch(console.error);
        } else {
          // Notify Admins
          notifyAdmins("new_request", "notifications.newRequest", `${newReq.user_name} requested ${newReq.device_name}`, "/admin/requests?tab=borrow", newReq.id, device_id).catch(console.error);
          
          // Notify User (Confirmation)
          createNotification({
            user_id: payload.userId,
            type: "info",
            title: "notifications.requestSubmitted",
            message: `Your request for ${newReq.device_name} has been submitted successfully.`,
            link: "/loans?tab=history",
            related_request_id: newReq.id,
            related_device_id: device_id
          }).catch(console.error);
        }
      }
      return created(newReq, "Borrow request created");
    });
  },

  /**
   * PUT /api/borrow/:id/status
   * Update the status of a borrow request (e.g. approve, reject, start loan, return).
   * Access: Admin only for most transitions.
   */
  async updateStatus(request: Request, params: Record<string, string>): Promise<Response> {
    return withAuth(request, async (payload) => {
      const id = parseId(params.id);
      if (!id) return err("Invalid request ID");
      const { status } = await request.json() as { status: RequestStatus };
      if (!VALID_STATUSES.includes(status)) return err("Invalid status");

      const [current] = await db<BorrowRequest[]>`SELECT * FROM borrow_requests WHERE id = ${id}`;
      if (!current) return notFound("Request");
      // Access control: Only Admins can approve/reject/start active loans
      if (["approved", "rejected", "active"].includes(status) && !requireAdmin(payload)) return forbidden();
      // State machine validation
      if (!TRANSITIONS[current.status].includes(status)) return err(`Cannot transition from ${current.status} to ${status}`);

      await db.begin(async (tx) => {
        const approvedBy = ["approved", "rejected"].includes(status) ? payload.userId : current.approved_by;
        await tx`UPDATE borrow_requests SET status = ${status}, approved_by = ${approvedBy}, updated_at = NOW() WHERE id = ${id}`;
        
        // Update device status logic based on loan status
        if (status === "active") {
          // If active, device is in use
          await tx`UPDATE devices SET status = 'inuse' WHERE id = ${current.device_id}`;
        }
        else if (status === "returned" || status === "rejected") {
           // If returned/rejected, check if there are other active loans (unlikely but safe)
           // otherwise mark as available
          const [other] = await tx<{ count: number }[]>`SELECT COUNT(*) as count FROM borrow_requests WHERE device_id = ${current.device_id} AND status = 'active' AND id != ${id}`;
          if (other.count === 0) await tx`UPDATE devices SET status = 'available' WHERE id = ${current.device_id}`;
        }
      });

      const [updated] = await db<BorrowRequestWithDetails[]>`SELECT * FROM v_borrow_details WHERE id = ${id}`;
      if (updated && (status === "approved" || status === "rejected")) {
        const notification = await createNotification({ 
          user_id: current.user_id, 
          type: status === "approved" ? "request_approved" : "request_rejected", 
          title: status === "approved" ? "notifications.requestApproved" : "notifications.requestRejected", 
          message: `Your request for ${updated.device_name} has been ${status}`, 
          link: status === "approved" ? "/loans?tab=active" : "/loans?tab=history", 
          related_request_id: id, 
          related_device_id: current.device_id 
        });
        if (!notification) console.error(`[BORROW] Failed to create ${status} notification for user ${current.user_id}`);
      }

      await auditLogger.log({ action: "status_change", objectType: "borrow_request", objectId: id, actor: auditLogger.createActorFromPayload(payload), changes: { before: { status: current.status }, after: { status } }, metadata: { device_id: current.device_id, user_id: current.user_id } });
      return ok(updated, "Status updated");
    });
  },

  /**
   * GET /api/borrow/user/:userId
   * Get all borrow requests for a specific user.
   * Access: Admin or User (self).
   */
  async getByUser(request: Request, params: Record<string, string>): Promise<Response> {
    return withAuth(request, async (payload) => {
      const userId = parseId(params.userId);
      if (!userId) return err("Invalid user ID");
      if (payload.userId !== userId && !requireAdmin(payload)) return forbidden();
      return ok(await db<BorrowRequestWithDetails[]>`SELECT * FROM v_borrow_details WHERE user_id = ${userId} ORDER BY created_at DESC`);
    });
  },

  /**
   * GET /api/borrow/status/:status
   * Get all borrow requests with a specific status.
   * Access: Admin (all), User (own only).
   */
  async getByStatus(request: Request, params: Record<string, string>): Promise<Response> {
    return withAuth(request, async (payload) => {
      const status = params.status as RequestStatus;
      if (!VALID_STATUSES.includes(status)) return err("Invalid status");
      let sql = "SELECT * FROM v_borrow_details WHERE status = ?";
      const sqlParams: unknown[] = [status];
      if (!requireAdmin(payload)) {
        sql += " AND user_id = ?";
        sqlParams.push(payload.userId);
      }
      sql += " ORDER BY created_at DESC";
      return ok(await db.unsafe<BorrowRequestWithDetails[]>(sql, sqlParams));
    });
  },
};
