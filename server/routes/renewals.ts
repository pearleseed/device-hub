import { db } from "../db/connection";
import { authenticateRequest, requireAdmin } from "../middleware/auth";
// Mattermost disabled for testing
// import { triggerRenewalNotification } from "../mattermost";
import { auditLogger } from "../services/audit-logger";
import { createNotification, notifyAdmins } from "./in-app-notifications";
import type {
  RenewalRequest,
  RenewalRequestWithDetails,
  CreateRenewalRequest,
  RenewalStatus,
  BorrowRequest,
} from "../types";

// JSON response helper
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const renewalsRoutes = {
  // GET /api/renewals
  async getAll(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const url = new URL(request.url);
      const status = url.searchParams.get("status");

      // Build dynamic query with filters
      let sql = "SELECT * FROM v_renewal_details WHERE 1=1";
      const params: unknown[] = [];

      // Non-admins can only see their own renewal requests
      if (!requireAdmin(payload)) {
        sql += " AND user_id = ?";
        params.push(payload.userId);
      }

      if (status) {
        sql += " AND status = ?";
        params.push(status);
      }

      sql += " ORDER BY created_at DESC";

      const renewals = await db.unsafe<RenewalRequestWithDetails>(sql, params);
      return jsonResponse({ success: true, data: renewals });
    } catch (error) {
      console.error("Get renewal requests error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get renewal requests" },
        500,
      );
    }
  },

  // GET /api/renewals/:id
  async getById(
    request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const id = parseInt(params.id);
      if (isNaN(id)) {
        return jsonResponse(
          { success: false, error: "Invalid renewal request ID" },
          400,
        );
      }

      const renewals = await db<RenewalRequestWithDetails>`
        SELECT * FROM v_renewal_details WHERE id = ${id}
      `;
      const renewal = renewals[0];

      if (!renewal) {
        return jsonResponse(
          { success: false, error: "Renewal request not found" },
          404,
        );
      }

      // Non-admins can only see their own renewal requests
      if (!requireAdmin(payload) && renewal.user_id !== payload.userId) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      return jsonResponse({ success: true, data: renewal });
    } catch (error) {
      console.error("Get renewal request error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get renewal request" },
        500,
      );
    }
  },

  // POST /api/renewals
  async create(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const body: CreateRenewalRequest = await request.json();
      const { borrow_request_id, requested_end_date, reason } = body;

      // Validation
      if (!borrow_request_id) {
        return jsonResponse(
          { success: false, error: "Borrow request ID is required" },
          400,
        );
      }
      if (!requested_end_date) {
        return jsonResponse(
          { success: false, error: "Requested end date is required" },
          400,
        );
      }
      if (!reason?.trim()) {
        return jsonResponse(
          { success: false, error: "Reason is required" },
          400,
        );
      }

      // Check if borrow request exists and is active
      const borrowRequests = await db<BorrowRequest>`
        SELECT * FROM borrow_requests WHERE id = ${borrow_request_id}
      `;
      const borrowRequest = borrowRequests[0];

      if (!borrowRequest) {
        return jsonResponse(
          { success: false, error: "Borrow request not found" },
          404,
        );
      }

      if (borrowRequest.status !== "active") {
        return jsonResponse(
          {
            success: false,
            error: "Can only request renewal for active loans",
          },
          400,
        );
      }

      // Check if user owns the borrow request
      if (borrowRequest.user_id !== payload.userId) {
        return jsonResponse(
          {
            success: false,
            error: "You can only request renewal for your own loans",
          },
          403,
        );
      }

      // Check if requested date is after current end date
      const currentEndDate = new Date(borrowRequest.end_date);
      const newEndDate = new Date(requested_end_date);
      if (newEndDate <= currentEndDate) {
        return jsonResponse(
          {
            success: false,
            error: "Requested end date must be after current end date",
          },
          400,
        );
      }

      // Check if there's already a pending renewal for this borrow request
      const existingRenewals = await db<{ count: number }>`
        SELECT COUNT(*) as count FROM renewal_requests 
        WHERE borrow_request_id = ${borrow_request_id} AND status = 'pending'
      `;
      if (existingRenewals[0].count > 0) {
        return jsonResponse(
          {
            success: false,
            error: "A pending renewal request already exists for this loan",
          },
          400,
        );
      }

      const reasonTrimmed = reason.trim();
      const currentEndDateStr = borrowRequest.end_date
        .toISOString()
        .split("T")[0];

      await db`
        INSERT INTO renewal_requests (borrow_request_id, user_id, current_end_date, requested_end_date, reason)
        VALUES (${borrow_request_id}, ${payload.userId}, ${currentEndDateStr}, ${requested_end_date}, ${reasonTrimmed})
      `;

      // Get the created renewal request
      const newRenewals = await db<RenewalRequestWithDetails>`
        SELECT * FROM v_renewal_details 
        WHERE borrow_request_id = ${borrow_request_id} AND user_id = ${payload.userId}
        ORDER BY created_at DESC LIMIT 1
      `;

      // Notify admins about new renewal request
      const newRenewal = newRenewals[0];
      if (newRenewal) {
        notifyAdmins(
          "new_request",
          "New Renewal Request",
          `${newRenewal.user_name} requested to extend ${newRenewal.device_name}`,
          "/admin/requests?tab=renewals",
          borrow_request_id,
          newRenewal.device_id
        ).catch(err => console.error("Failed to notify admins:", err));
      }

      return jsonResponse(
        {
          success: true,
          data: newRenewals[0],
          message: "Renewal request created",
        },
        201,
      );
    } catch (error) {
      console.error("Create renewal request error:", error);
      return jsonResponse(
        { success: false, error: "Failed to create renewal request" },
        500,
      );
    }
  },

  // PATCH /api/renewals/:id/status
  async updateStatus(
    request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      // Only admins can approve/reject renewal requests
      if (!requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      const id = parseInt(params.id);
      if (isNaN(id)) {
        return jsonResponse(
          { success: false, error: "Invalid renewal request ID" },
          400,
        );
      }

      const body = await request.json();
      const { status } = body as { status: RenewalStatus };

      const validStatuses: RenewalStatus[] = [
        "pending",
        "approved",
        "rejected",
      ];
      if (!validStatuses.includes(status)) {
        return jsonResponse({ success: false, error: "Invalid status" }, 400);
      }

      // Get current renewal request
      const currentRenewals = await db<RenewalRequest>`
        SELECT * FROM renewal_requests WHERE id = ${id}
      `;
      const currentRenewal = currentRenewals[0];

      if (!currentRenewal) {
        return jsonResponse(
          { success: false, error: "Renewal request not found" },
          404,
        );
      }

      // Can only change status from pending
      if (currentRenewal.status !== "pending") {
        return jsonResponse(
          {
            success: false,
            error: "Can only update status of pending renewal requests",
          },
          400,
        );
      }

      // Use transaction for atomicity
      await db.begin(async (tx) => {
        // Update renewal request status
        await tx`
          UPDATE renewal_requests 
          SET status = ${status}, reviewed_by = ${payload.userId}, reviewed_at = NOW()
          WHERE id = ${id}
        `;

        // If approved, update the borrow request end date
        if (status === "approved") {
          const requestedEndDate = currentRenewal.requested_end_date
            .toISOString()
            .split("T")[0];
          await tx`
            UPDATE borrow_requests 
            SET end_date = ${requestedEndDate}, updated_at = NOW()
            WHERE id = ${currentRenewal.borrow_request_id}
          `;
        }
      });

      const updatedRenewals = await db<RenewalRequestWithDetails>`
        SELECT * FROM v_renewal_details WHERE id = ${id}
      `;

      const updatedRenewal = updatedRenewals[0];

      // Send notification to user based on status change
      if (updatedRenewal) {
        if (status === "approved") {
          createNotification({
            user_id: currentRenewal.user_id,
            type: "renewal_approved",
            title: "Renewal Approved",
            message: `Your renewal request for ${updatedRenewal.device_name} has been approved`,
            link: "/loans?tab=active",
            related_request_id: currentRenewal.borrow_request_id,
            related_device_id: updatedRenewal.device_id,
          }).catch(err => console.error("Failed to create notification:", err));
        } else if (status === "rejected") {
          createNotification({
            user_id: currentRenewal.user_id,
            type: "renewal_rejected",
            title: "Renewal Rejected",
            message: `Your renewal request for ${updatedRenewal.device_name} has been rejected`,
            link: "/loans?tab=active",
            related_request_id: currentRenewal.borrow_request_id,
            related_device_id: updatedRenewal.device_id,
          }).catch(err => console.error("Failed to create notification:", err));
        }
      }

      // Audit log
      await auditLogger.log({
        action: "status_change",
        objectType: "renewal_request",
        objectId: id,
        actor: auditLogger.createActorFromPayload(payload),
        changes: {
          before: { status: currentRenewal.status },
          after: { status },
        },
        metadata: {
          borrow_request_id: currentRenewal.borrow_request_id,
          user_id: currentRenewal.user_id,
          requested_end_date: currentRenewal.requested_end_date,
        },
      });

      // Trigger Mattermost notification for approved renewals - disabled for testing
      // if (status === "approved") {
      //   // Fire and forget - don't block the response
      //   triggerRenewalNotification(id).catch((err) => {
      //     console.error("Failed to send renewal notification:", err);
      //   });
      // }

      return jsonResponse({
        success: true,
        data: updatedRenewals[0],
        message:
          status === "approved" ? "Renewal approved" : "Renewal rejected",
      });
    } catch (error) {
      console.error("Update renewal status error:", error);
      return jsonResponse(
        { success: false, error: "Failed to update renewal status" },
        500,
      );
    }
  },

  // GET /api/renewals/borrow/:borrowId
  async getByBorrowRequest(
    request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const borrowId = parseInt(params.borrowId);
      if (isNaN(borrowId)) {
        return jsonResponse(
          { success: false, error: "Invalid borrow request ID" },
          400,
        );
      }

      // Build dynamic query
      let sql = "SELECT * FROM v_renewal_details WHERE borrow_request_id = ?";
      const sqlParams: unknown[] = [borrowId];

      // Non-admins can only see their own renewal requests
      if (!requireAdmin(payload)) {
        sql += " AND user_id = ?";
        sqlParams.push(payload.userId);
      }

      sql += " ORDER BY created_at DESC";

      const renewals = await db.unsafe<RenewalRequestWithDetails>(
        sql,
        sqlParams,
      );
      return jsonResponse({ success: true, data: renewals });
    } catch (error) {
      console.error("Get renewals by borrow request error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get renewal requests" },
        500,
      );
    }
  },

  // GET /api/renewals/status/:status
  async getByStatus(
    request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const status = params.status as RenewalStatus;
      const validStatuses: RenewalStatus[] = [
        "pending",
        "approved",
        "rejected",
      ];

      if (!validStatuses.includes(status)) {
        return jsonResponse({ success: false, error: "Invalid status" }, 400);
      }

      // Build dynamic query
      let sql = "SELECT * FROM v_renewal_details WHERE status = ?";
      const sqlParams: unknown[] = [status];

      // Non-admins can only see their own renewal requests
      if (!requireAdmin(payload)) {
        sql += " AND user_id = ?";
        sqlParams.push(payload.userId);
      }

      sql += " ORDER BY created_at DESC";

      const renewals = await db.unsafe<RenewalRequestWithDetails>(
        sql,
        sqlParams,
      );
      return jsonResponse({ success: true, data: renewals });
    } catch (error) {
      console.error("Get renewals by status error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get renewal requests" },
        500,
      );
    }
  },
};
