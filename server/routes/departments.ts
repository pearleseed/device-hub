import { db } from "../db/connection";
import { authenticateRequest, requireAdmin } from "../middleware/auth";
import { auditLogger } from "../services/audit-logger";
import type { Department, DepartmentName } from "../types";
import { DEPARTMENT_NAMES } from "../types";

// JSON response helper
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const departmentsRoutes = {
  // GET /api/departments/names - Get available department names for dropdown
  async getNames(): Promise<Response> {
    try {
      return jsonResponse({
        success: true,
        data: DEPARTMENT_NAMES,
      });
    } catch (error) {
      console.error("Get department names error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get department names" },
        500,
      );
    }
  },

  // GET /api/departments
  async getAll(): Promise<Response> {
    try {
      const departments = await db<
        (Department & { user_count: number; device_count: number })[]
      >`
        SELECT d.*, 
               COUNT(DISTINCT u.id) as user_count,
               COUNT(DISTINCT dev.id) as device_count
        FROM departments d
        LEFT JOIN users u ON d.id = u.department_id
        LEFT JOIN devices dev ON d.id = dev.department_id
        GROUP BY d.id
        ORDER BY d.name
      `;
      return jsonResponse({ success: true, data: departments });
    } catch (error) {
      console.error("Get departments error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get departments" },
        500,
      );
    }
  },

  // GET /api/departments/:id
  async getById(
    request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      const id = parseInt(params.id);
      if (isNaN(id)) {
        return jsonResponse(
          { success: false, error: "Invalid department ID" },
          400,
        );
      }

      const departments = await db<
        (Department & { user_count: number; device_count: number })[]
      >`
        SELECT d.*, 
               COUNT(DISTINCT u.id) as user_count,
               COUNT(DISTINCT dev.id) as device_count
        FROM departments d
        LEFT JOIN users u ON d.id = u.department_id
        LEFT JOIN devices dev ON d.id = dev.department_id
        WHERE d.id = ${id}
        GROUP BY d.id
      `;
      const department = departments[0];

      if (!department) {
        return jsonResponse(
          { success: false, error: "Department not found" },
          404,
        );
      }

      return jsonResponse({ success: true, data: department });
    } catch (error) {
      console.error("Get department error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get department" },
        500,
      );
    }
  },

  // POST /api/departments
  async create(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload || !requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const body = await request.json();
      const { name, code } = body;

      if (!name?.trim()) {
        return jsonResponse({ success: false, error: "Name is required" }, 400);
      }

      // Validate department name against ENUM values
      if (!DEPARTMENT_NAMES.includes(name as DepartmentName)) {
        return jsonResponse(
          {
            success: false,
            error: `Invalid department name. Must be one of: ${DEPARTMENT_NAMES.join(", ")}`,
          },
          400,
        );
      }

      if (!code?.trim()) {
        return jsonResponse({ success: false, error: "Code is required" }, 400);
      }

      const codeUpper = code.toUpperCase();

      // Check for duplicate code
      const existing =
        (await db<Department[]>`SELECT id FROM departments WHERE code = ${codeUpper}`) as unknown as Department[];
      if (existing.length > 0) {
        return jsonResponse(
          { success: false, error: "Department code already exists" },
          400,
        );
      }

      const nameTrimmed = name.trim();
      const codeTrimmed = codeUpper.trim();
      await db`INSERT INTO departments (name, code) VALUES (${nameTrimmed}, ${codeTrimmed})`;

      const newDepartments =
        await db<Department[]>`SELECT * FROM departments WHERE code = ${codeUpper}`;
      const newDepartment = newDepartments[0];

      // Audit log
      await auditLogger.log({
        action: "create",
        objectType: "department",
        objectId: newDepartment.id,
        actor: auditLogger.createActorFromPayload(payload),
        changes: {
          after: { name: nameTrimmed, code: codeTrimmed },
        },
      });

      return jsonResponse(
        { success: true, data: newDepartment, message: "Department created" },
        201,
      );
    } catch (error) {
      console.error("Create department error:", error);
      return jsonResponse(
        { success: false, error: "Failed to create department" },
        500,
      );
    }
  },

  // PUT /api/departments/:id
  async update(
    request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload || !requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const id = parseInt(params.id);
      if (isNaN(id)) {
        return jsonResponse(
          { success: false, error: "Invalid department ID" },
          400,
        );
      }

      const body = await request.json();
      const { name, code } = body;

      const updates: string[] = [];
      const values: unknown[] = [];

      if (name !== undefined) {
        // Validate department name against ENUM values
        if (!DEPARTMENT_NAMES.includes(name as DepartmentName)) {
          return jsonResponse(
            {
              success: false,
              error: `Invalid department name. Must be one of: ${DEPARTMENT_NAMES.join(", ")}`,
            },
            400,
          );
        }
        updates.push("name = ?");
        values.push(name.trim());
      }
      if (code !== undefined) {
        const codeUpper = code.toUpperCase();
        // Check for duplicate code
        const existing = (await db<Department>`
          SELECT id FROM departments WHERE code = ${codeUpper} AND id != ${id}
        `) as unknown as Department[];
        if (existing.length > 0) {
          return jsonResponse(
            { success: false, error: "Department code already exists" },
            400,
          );
        }
        updates.push("code = ?");
        values.push(codeUpper.trim());
      }

      if (updates.length === 0) {
        return jsonResponse(
          { success: false, error: "No fields to update" },
          400,
        );
      }

      // Get current department state for audit log
      const currentDept =
        await db<Department[]>`SELECT * FROM departments WHERE id = ${id}`;
      const beforeState = currentDept[0] ? { ...currentDept[0] } : undefined;

      values.push(id);
      await db.unsafe(
        `UPDATE departments SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );

      const updated =
        await db<Department[]>`SELECT * FROM departments WHERE id = ${id}`;

      // Audit log
      await auditLogger.log({
        action: "update",
        objectType: "department",
        objectId: id,
        actor: auditLogger.createActorFromPayload(payload),
        changes: {
          before: beforeState,
          after: { name, code },
        },
      });

      return jsonResponse({
        success: true,
        data: updated[0],
        message: "Department updated",
      });
    } catch (error) {
      console.error("Update department error:", error);
      return jsonResponse(
        { success: false, error: "Failed to update department" },
        500,
      );
    }
  },

  // DELETE /api/departments/:id
  async delete(
    request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload || !requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const id = parseInt(params.id);
      if (isNaN(id)) {
        return jsonResponse(
          { success: false, error: "Invalid department ID" },
          400,
        );
      }

      // Check if department has users or devices
      const counts = await db<{ user_count: number; device_count: number }[]>`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE department_id = ${id}) as user_count,
          (SELECT COUNT(*) FROM devices WHERE department_id = ${id}) as device_count
      `;

      if (
        counts[0] &&
        (counts[0].user_count > 0 || counts[0].device_count > 0)
      ) {
        return jsonResponse(
          {
            success: false,
            error: "Cannot delete department with users or devices",
          },
          400,
        );
      }

      // Get department info for audit log before deletion
      const deptToDelete =
        await db<Department[]>`SELECT * FROM departments WHERE id = ${id}`;
      const deletedDept = deptToDelete[0] ? { ...deptToDelete[0] } : undefined;

      await db`DELETE FROM departments WHERE id = ${id}`;

      // Audit log
      await auditLogger.log({
        action: "delete",
        objectType: "department",
        objectId: id,
        actor: auditLogger.createActorFromPayload(payload),
        changes: {
          before: deletedDept,
        },
      });

      return jsonResponse({ success: true, message: "Department deleted" });
    } catch (error) {
      console.error("Delete department error:", error);
      return jsonResponse(
        { success: false, error: "Failed to delete department" },
        500,
      );
    }
  },
};
