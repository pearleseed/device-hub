import { db } from "../db/connection";
import { authenticateRequest, requireAdmin } from "../middleware/auth";
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
      const { borrowing_request_id, condition, notes } = body;

      // Validation
      if (!borrowing_request_id) {
        return jsonResponse(
          { success: false, error: "Borrowing request ID is required" },
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

      // Get the borrowing request
      const borrowingRequests = await db<{
        id: number;
        user_id: number;
        status: string;
        equipment_id: number;
      }>`
        SELECT id, user_id, status, equipment_id FROM borrowing_requests WHERE id = ${borrowing_request_id}
      `;
      const borrowingRequest = borrowingRequests[0];

      if (!borrowingRequest) {
        return jsonResponse(
          { success: false, error: "Borrowing request not found" },
          404,
        );
      }

      // Only the borrower or an admin can create a return request
      if (
        borrowingRequest.user_id !== payload.userId &&
        !requireAdmin(payload)
      ) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      // Check if request is in active status
      if (borrowingRequest.status !== "active") {
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
        SELECT id FROM return_requests WHERE borrowing_request_id = ${borrowing_request_id}
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
          INSERT INTO return_requests (borrowing_request_id, return_date, device_condition, notes)
          VALUES (${borrowing_request_id}, CURDATE(), ${condition}, ${notesValue})
        `;

        // Update borrowing request status to returned
        await tx`
          UPDATE borrowing_requests 
          SET status = 'returned', updated_at = NOW()
          WHERE id = ${borrowing_request_id}
        `;

        // Update equipment status based on condition
        const newStatus = condition === "damaged" ? "maintenance" : "available";
        await tx`UPDATE equipment SET status = ${newStatus} WHERE id = ${borrowingRequest.equipment_id}`;
      });

      // Get the created return request
      const newReturns = await db<ReturnRequestWithDetails>`
        SELECT * FROM v_return_details WHERE borrowing_request_id = ${borrowing_request_id}
      `;

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
