import { db } from "../db/connection";
import { authenticateRequest, requireAdmin } from "../middleware/auth";
import type {
  BorrowingRequest,
  BorrowingRequestWithDetails,
  CreateBorrowingRequest,
  RequestStatus,
} from "../types";

// JSON response helper
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const borrowingRoutes = {
  // GET /api/borrowing
  async getAll(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const url = new URL(request.url);
      const status = url.searchParams.get("status");
      const equipment_id = url.searchParams.get("equipment_id");

      // Build dynamic query with filters
      let sql = "SELECT * FROM v_borrowing_details WHERE 1=1";
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
      if (equipment_id) {
        sql += " AND equipment_id = ?";
        params.push(parseInt(equipment_id));
      }

      sql += " ORDER BY created_at DESC";

      const requests = await db.unsafe<BorrowingRequestWithDetails>(
        sql,
        params,
      );
      return jsonResponse({ success: true, data: requests });
    } catch (error) {
      console.error("Get borrowing requests error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get borrowing requests" },
        500,
      );
    }
  },

  // GET /api/borrowing/:id
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

      const borrowingRequests = await db<BorrowingRequestWithDetails>`
        SELECT * FROM v_borrowing_details WHERE id = ${id}
      `;
      const borrowingRequest = borrowingRequests[0];

      if (!borrowingRequest) {
        return jsonResponse(
          { success: false, error: "Request not found" },
          404,
        );
      }

      // Non-admins can only see their own requests
      if (
        !requireAdmin(payload) &&
        borrowingRequest.user_id !== payload.userId
      ) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      return jsonResponse({ success: true, data: borrowingRequest });
    } catch (error) {
      console.error("Get borrowing request error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get borrowing request" },
        500,
      );
    }
  },

  // POST /api/borrowing
  async create(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const body: CreateBorrowingRequest = await request.json();
      const { equipment_id, start_date, end_date, reason } = body;

      // Validation
      if (!equipment_id) {
        return jsonResponse(
          { success: false, error: "Equipment ID is required" },
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

      // Check if equipment exists and is available
      const equipmentList = await db<{ id: number; status: string }>`
        SELECT id, status FROM equipment WHERE id = ${equipment_id}
      `;
      const equipment = equipmentList[0];

      if (!equipment) {
        return jsonResponse(
          { success: false, error: "Equipment not found" },
          404,
        );
      }
      if (equipment.status !== "available") {
        return jsonResponse(
          { success: false, error: "Equipment is not available" },
          400,
        );
      }

      // Check for conflicting bookings
      const conflicts = await db<{ count: number }>`
        SELECT COUNT(*) as count FROM borrowing_requests 
        WHERE equipment_id = ${equipment_id} 
        AND status IN ('pending', 'approved', 'active')
        AND ((start_date <= ${end_date} AND end_date >= ${start_date}) 
             OR (start_date <= ${start_date} AND end_date >= ${start_date}) 
             OR (start_date >= ${start_date} AND end_date <= ${end_date}))
      `;
      if (conflicts[0].count > 0) {
        return jsonResponse(
          {
            success: false,
            error: "Equipment is already booked for this period",
          },
          400,
        );
      }

      const reasonTrimmed = reason.trim();
      await db`
        INSERT INTO borrowing_requests (equipment_id, user_id, start_date, end_date, reason)
        VALUES (${equipment_id}, ${payload.userId}, ${start_date}, ${end_date}, ${reasonTrimmed})
      `;

      // Get the created request
      const newRequests = await db<BorrowingRequestWithDetails>`
        SELECT * FROM v_borrowing_details 
        WHERE equipment_id = ${equipment_id} AND user_id = ${payload.userId} 
        ORDER BY created_at DESC LIMIT 1
      `;

      return jsonResponse(
        {
          success: true,
          data: newRequests[0],
          message: "Borrowing request created",
        },
        201,
      );
    } catch (error) {
      console.error("Create borrowing request error:", error);
      return jsonResponse(
        { success: false, error: "Failed to create borrowing request" },
        500,
      );
    }
  },

  // PATCH /api/borrowing/:id/status
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
      const currentRequests = await db<BorrowingRequest>`
        SELECT * FROM borrowing_requests WHERE id = ${id}
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
          UPDATE borrowing_requests 
          SET status = ${status}, approved_by = ${approvedBy}, updated_at = NOW()
          WHERE id = ${id}
        `;

        // Update equipment status based on request status
        if (status === "active") {
          await tx`UPDATE equipment SET status = 'borrowed' WHERE id = ${currentRequest.equipment_id}`;
        } else if (status === "returned" || status === "rejected") {
          // Check if there are other active requests for this equipment
          const otherActive = await tx<{ count: number }>`
            SELECT COUNT(*) as count FROM borrowing_requests 
            WHERE equipment_id = ${currentRequest.equipment_id} AND status = 'active' AND id != ${id}
          `;
          if (otherActive[0].count === 0) {
            await tx`UPDATE equipment SET status = 'available' WHERE id = ${currentRequest.equipment_id}`;
          }
        }
      });

      const updatedRequests = await db<BorrowingRequestWithDetails>`
        SELECT * FROM v_borrowing_details WHERE id = ${id}
      `;

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

  // GET /api/borrowing/user/:userId
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

      const requests = await db<BorrowingRequestWithDetails>`
        SELECT * FROM v_borrowing_details WHERE user_id = ${userId} ORDER BY created_at DESC
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

  // GET /api/borrowing/status/:status
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
      let sql = "SELECT * FROM v_borrowing_details WHERE status = ?";
      const sqlParams: unknown[] = [status];

      // Non-admins can only see their own requests
      if (!requireAdmin(payload)) {
        sql += " AND user_id = ?";
        sqlParams.push(payload.userId);
      }

      sql += " ORDER BY created_at DESC";

      const requests = await db.unsafe<BorrowingRequestWithDetails>(
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
