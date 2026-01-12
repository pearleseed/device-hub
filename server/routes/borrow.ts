import { db } from "../db/connection";
import { authenticateRequest, requireAdmin } from "../middleware/auth";
// Mattermost disabled for testing
// import { triggerBorrowNotification } from "../mattermost";
import { auditLogger } from "../services/audit-logger";
import { createNotification, notifyAdmins } from "./in-app-notifications";
import type {
  BorrowRequest,
  BorrowRequestWithDetails,
  CreateBorrowRequest,
  RequestStatus,
} from "../types";

// JSON response helper
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const borrowRoutes = {
  // GET /api/borrow
  async getAll(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const url = new URL(request.url);
      const status = url.searchParams.get("status");
      const device_id = url.searchParams.get("device_id");

      // Build dynamic query with filters
      let sql = "SELECT * FROM v_borrow_details WHERE 1=1";
      const params: unknown[] = [];

      // Non-admins can only see their own requests
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
        params.push(parseInt(device_id));
      }

      sql += " ORDER BY created_at DESC";

      const requests = await db.unsafe<BorrowRequestWithDetails>(sql, params);
      return jsonResponse({ success: true, data: requests });
    } catch (error) {
      console.error("Get borrow requests error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get borrow requests" },
        500,
      );
    }
  },

  // GET /api/borrow/:id
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
          { success: false, error: "Invalid request ID" },
          400,
        );
      }

      const borrowRequests = await db<BorrowRequestWithDetails>`
        SELECT * FROM v_borrow_details WHERE id = ${id}
      `;
      const borrowRequest = borrowRequests[0];

      if (!borrowRequest) {
        return jsonResponse(
          { success: false, error: "Request not found" },
          404,
        );
      }

      // Non-admins can only see their own requests
      if (!requireAdmin(payload) && borrowRequest.user_id !== payload.userId) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      return jsonResponse({ success: true, data: borrowRequest });
    } catch (error) {
      console.error("Get borrow request error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get borrow request" },
        500,
      );
    }
  },

  // POST /api/borrow
  async create(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const body: CreateBorrowRequest = await request.json();
      const { device_id, start_date, end_date, reason } = body;

      // Validation
      if (!device_id) {
        return jsonResponse(
          { success: false, error: "Device ID is required" },
          400,
        );
      }
      if (!start_date) {
        return jsonResponse(
          { success: false, error: "Start date is required" },
          400,
        );
      }
      if (!end_date) {
        return jsonResponse(
          { success: false, error: "End date is required" },
          400,
        );
      }
      if (!reason?.trim()) {
        return jsonResponse(
          { success: false, error: "Reason is required" },
          400,
        );
      }

      // Check date validity
      const startDateObj = new Date(start_date);
      const endDateObj = new Date(end_date);
      if (endDateObj < startDateObj) {
        return jsonResponse(
          { success: false, error: "End date must be after start date" },
          400,
        );
      }

      // Check if device exists and is available
      const deviceList = await db<{ id: number; status: string }>`
        SELECT id, status FROM devices WHERE id = ${device_id}
      `;
      const device = deviceList[0];

      if (!device) {
        return jsonResponse({ success: false, error: "Device not found" }, 404);
      }
      if (device.status !== "available") {
        return jsonResponse(
          { success: false, error: "Device is not available" },
          400,
        );
      }

      // Check for conflicting bookings
      const conflicts = await db<{ count: number }>`
        SELECT COUNT(*) as count FROM borrow_requests 
        WHERE device_id = ${device_id} 
        AND status IN ('pending', 'approved', 'active')
        AND ((start_date <= ${end_date} AND end_date >= ${start_date}) 
             OR (start_date <= ${start_date} AND end_date >= ${start_date}) 
             OR (start_date >= ${start_date} AND end_date <= ${end_date}))
      `;
      if (conflicts[0].count > 0) {
        return jsonResponse(
          {
            success: false,
            error: "Device is already booked for this period",
          },
          400,
        );
      }

      const reasonTrimmed = reason.trim();
      await db`
        INSERT INTO borrow_requests (device_id, user_id, start_date, end_date, reason)
        VALUES (${device_id}, ${payload.userId}, ${start_date}, ${end_date}, ${reasonTrimmed})
      `;

      // Get the created request
      const newRequests = await db<BorrowRequestWithDetails>`
        SELECT * FROM v_borrow_details 
        WHERE device_id = ${device_id} AND user_id = ${payload.userId} 
        ORDER BY created_at DESC LIMIT 1
      `;

      // Notify admins about new borrow request
      const newRequest = newRequests[0];
      if (newRequest) {
        notifyAdmins(
          "new_request",
          "New Device Request",
          `${newRequest.user_name} requested ${newRequest.device_name}`,
          "/admin/requests?tab=borrow",
          newRequest.id,
          device_id
        ).catch(err => console.error("Failed to notify admins:", err));
      }

      return jsonResponse(
        {
          success: true,
          data: newRequests[0],
          message: "Borrow request created",
        },
        201,
      );
    } catch (error) {
      console.error("Create borrow request error:", error);
      return jsonResponse(
        { success: false, error: "Failed to create borrow request" },
        500,
      );
    }
  },

  // PATCH /api/borrow/:id/status
  async updateStatus(
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
          { success: false, error: "Invalid request ID" },
          400,
        );
      }

      const body = await request.json();
      const { status } = body as { status: RequestStatus };

      const validStatuses: RequestStatus[] = [
        "pending",
        "approved",
        "active",
        "returned",
        "rejected",
      ];
      if (!validStatuses.includes(status)) {
        return jsonResponse({ success: false, error: "Invalid status" }, 400);
      }

      // Get current request
      const currentRequests = await db<BorrowRequest>`
        SELECT * FROM borrow_requests WHERE id = ${id}
      `;
      const currentRequest = currentRequests[0];

      if (!currentRequest) {
        return jsonResponse(
          { success: false, error: "Request not found" },
          404,
        );
      }

      // Only admins can approve/reject/activate, users can only view
      if (
        ["approved", "rejected", "active"].includes(status) &&
        !requireAdmin(payload)
      ) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      // State machine validation
      const validTransitions: Record<RequestStatus, RequestStatus[]> = {
        pending: ["approved", "rejected"],
        approved: ["active", "rejected"],
        active: ["returned"],
        returned: [],
        rejected: [],
      };

      if (!validTransitions[currentRequest.status].includes(status)) {
        return jsonResponse(
          {
            success: false,
            error: `Cannot transition from ${currentRequest.status} to ${status}`,
          },
          400,
        );
      }

      // Use transaction for atomicity
      await db.begin(async (tx) => {
        // Update request status
        const approvedBy = ["approved", "rejected"].includes(status)
          ? payload.userId
          : currentRequest.approved_by;

        await tx`
          UPDATE borrow_requests 
          SET status = ${status}, approved_by = ${approvedBy}, updated_at = NOW()
          WHERE id = ${id}
        `;

        // Update device status based on request status
        if (status === "active") {
          await tx`UPDATE devices SET status = 'borrowed' WHERE id = ${currentRequest.device_id}`;
        } else if (status === "returned" || status === "rejected") {
          // Check if there are other active requests for this device
          const otherActive = await tx<{ count: number }>`
            SELECT COUNT(*) as count FROM borrow_requests 
            WHERE device_id = ${currentRequest.device_id} AND status = 'active' AND id != ${id}
          `;
          if (otherActive[0].count === 0) {
            await tx`UPDATE devices SET status = 'available' WHERE id = ${currentRequest.device_id}`;
          }
        }
      });

      const updatedRequests = await db<BorrowRequestWithDetails>`
        SELECT * FROM v_borrow_details WHERE id = ${id}
      `;

      const updatedRequest = updatedRequests[0];

      // Send notification to user based on status change
      if (updatedRequest) {
        if (status === "approved") {
          createNotification({
            user_id: currentRequest.user_id,
            type: "request_approved",
            title: "Request Approved",
            message: `Your request for ${updatedRequest.device_name} has been approved`,
            link: "/loans?tab=active",
            related_request_id: id,
            related_device_id: currentRequest.device_id,
          }).catch(err => console.error("Failed to create notification:", err));
        } else if (status === "rejected") {
          createNotification({
            user_id: currentRequest.user_id,
            type: "request_rejected",
            title: "Request Rejected",
            message: `Your request for ${updatedRequest.device_name} has been rejected`,
            link: "/loans?tab=history",
            related_request_id: id,
            related_device_id: currentRequest.device_id,
          }).catch(err => console.error("Failed to create notification:", err));
        }
      }

      // Audit log
      await auditLogger.log({
        action: "status_change",
        objectType: "borrow_request",
        objectId: id,
        actor: auditLogger.createActorFromPayload(payload),
        changes: {
          before: { status: currentRequest.status },
          after: { status },
        },
        metadata: {
          device_id: currentRequest.device_id,
          user_id: currentRequest.user_id,
        },
      });

      // Trigger Mattermost notification for approved/active status - disabled for testing
      // if (status === "approved" || status === "active") {
      //   // Fire and forget - don't block the response
      //   triggerBorrowNotification(id).catch((err) => {
      //     console.error("Failed to send borrow notification:", err);
      //   });
      // }

      return jsonResponse({
        success: true,
        data: updatedRequests[0],
        message: "Status updated",
      });
    } catch (error) {
      console.error("Update status error:", error);
      return jsonResponse(
        { success: false, error: "Failed to update status" },
        500,
      );
    }
  },

  // GET /api/borrow/user/:userId
  async getByUser(
    request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const userId = parseInt(params.userId);
      if (isNaN(userId)) {
        return jsonResponse({ success: false, error: "Invalid user ID" }, 400);
      }

      // Users can only see their own requests, admins can see any
      if (payload.userId !== userId && !requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      const requests = await db<BorrowRequestWithDetails>`
        SELECT * FROM v_borrow_details WHERE user_id = ${userId} ORDER BY created_at DESC
      `;

      return jsonResponse({ success: true, data: requests });
    } catch (error) {
      console.error("Get user requests error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get requests" },
        500,
      );
    }
  },

  // GET /api/borrow/status/:status
  async getByStatus(
    request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const status = params.status as RequestStatus;
      const validStatuses: RequestStatus[] = [
        "pending",
        "approved",
        "active",
        "returned",
        "rejected",
      ];

      if (!validStatuses.includes(status)) {
        return jsonResponse({ success: false, error: "Invalid status" }, 400);
      }

      // Build dynamic query
      let sql = "SELECT * FROM v_borrow_details WHERE status = ?";
      const sqlParams: unknown[] = [status];

      // Non-admins can only see their own requests
      if (!requireAdmin(payload)) {
        sql += " AND user_id = ?";
        sqlParams.push(payload.userId);
      }

      sql += " ORDER BY created_at DESC";

      const requests = await db.unsafe<BorrowRequestWithDetails>(
        sql,
        sqlParams,
      );
      return jsonResponse({ success: true, data: requests });
    } catch (error) {
      console.error("Get requests by status error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get requests" },
        500,
      );
    }
  },
};
