import { db } from "../db/connection";
import { authenticateRequest, requireAdmin } from "../middleware/auth";
import { triggerReturnNotification } from "../mattermost";
import type {
  ReturnRequest,
  ReturnRequestWithDetails,
  CreateReturnRequest,
  DeviceCondition,
} from "../types";

// JSON response helper
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const returnsRoutes = {
  // GET /api/returns
  async getAll(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const url = new URL(request.url);
      const condition = url.searchParams.get("condition");

      // Build dynamic query with filters
      let sql = "SELECT * FROM v_return_details WHERE 1=1";
      const params: unknown[] = [];

      // Non-admins can only see their own returns
      if (!requireAdmin(payload)) {
        sql += " AND user_id = ?";
        params.push(payload.userId);
      }

      if (condition) {
        sql += " AND device_condition = ?";
        params.push(condition);
      }

      sql += " ORDER BY created_at DESC";

      const returns = await db.unsafe<ReturnRequestWithDetails>(sql, params);
      return jsonResponse({ success: true, data: returns });
    } catch (error) {
      console.error("Get return requests error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get return requests" },
        500,
      );
    }
  },

  // GET /api/returns/:id
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
          { success: false, error: "Invalid return request ID" },
          400,
        );
      }

      const returnRequests = await db<ReturnRequestWithDetails>`
        SELECT * FROM v_return_details WHERE id = ${id}
      `;
      const returnRequest = returnRequests[0];

      if (!returnRequest) {
        return jsonResponse(
          { success: false, error: "Return request not found" },
          404,
        );
      }

      // Non-admins can only see their own returns
      if (!requireAdmin(payload) && returnRequest.user_id !== payload.userId) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      return jsonResponse({ success: true, data: returnRequest });
    } catch (error) {
      console.error("Get return request error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get return request" },
        500,
      );
    }
  },

  // POST /api/returns
  async create(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const body: CreateReturnRequest = await request.json();
      const { borrow_request_id, condition, notes } = body;

      // Validation
      if (!borrow_request_id) {
        return jsonResponse(
          { success: false, error: "Borrow request ID is required" },
          400,
        );
      }

      const validConditions: DeviceCondition[] = [
        "excellent",
        "good",
        "fair",
        "damaged",
      ];
      if (!condition || !validConditions.includes(condition)) {
        return jsonResponse(
          { success: false, error: "Valid condition is required" },
          400,
        );
      }

      // Get the borrow request
      const borrowRequests = await db<{
        id: number;
        user_id: number;
        status: string;
        device_id: number;
      }>`
        SELECT id, user_id, status, device_id FROM borrow_requests WHERE id = ${borrow_request_id}
      `;
      const borrowRequest = borrowRequests[0];

      if (!borrowRequest) {
        return jsonResponse(
          { success: false, error: "Borrow request not found" },
          404,
        );
      }

      // Only the borrower or an admin can create a return request
      if (borrowRequest.user_id !== payload.userId && !requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      // Check if request is in active status
      if (borrowRequest.status !== "active") {
        return jsonResponse(
          {
            success: false,
            error: "Can only create return request for active borrowings",
          },
          400,
        );
      }

      // Check if return request already exists
      const existingReturns = (await db<ReturnRequest>`
        SELECT id FROM return_requests WHERE borrow_request_id = ${borrow_request_id}
      `) as unknown as ReturnRequest[];
      if (existingReturns.length > 0) {
        return jsonResponse(
          { success: false, error: "Return request already exists" },
          400,
        );
      }

      // Use transaction for atomicity
      await db.begin(async (tx) => {
        // Create return request
        const notesValue = notes || null;
        await tx`
          INSERT INTO return_requests (borrow_request_id, return_date, device_condition, notes)
          VALUES (${borrow_request_id}, CURDATE(), ${condition}, ${notesValue})
        `;

        // Update borrow request status to returned
        await tx`
          UPDATE borrow_requests 
          SET status = 'returned', updated_at = NOW()
          WHERE id = ${borrow_request_id}
        `;

        // Update device status based on condition
        const newStatus = condition === "damaged" ? "maintenance" : "available";
        await tx`UPDATE devices SET status = ${newStatus} WHERE id = ${borrowRequest.device_id}`;
      });

      // Get the created return request
      const newReturns = await db<ReturnRequestWithDetails>`
        SELECT * FROM v_return_details WHERE borrow_request_id = ${borrow_request_id}
      `;

      // Trigger Mattermost notification for return confirmation
      if (newReturns[0]) {
        // Fire and forget - don't block the response
        triggerReturnNotification(newReturns[0].id).catch((err) => {
          console.error("Failed to send return notification:", err);
        });
      }

      return jsonResponse(
        {
          success: true,
          data: newReturns[0],
          message: "Return request created",
        },
        201,
      );
    } catch (error) {
      console.error("Create return request error:", error);
      return jsonResponse(
        { success: false, error: "Failed to create return request" },
        500,
      );
    }
  },
};
