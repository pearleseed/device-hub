import { db } from "../db/connection";
import { auditLogger } from "../services/audit-logger";
import { ok, created, err, notFound, parseId, withAuth, withAdmin } from "./_helpers";
import type { Department, DepartmentName } from "../types";

export const departmentsRoutes = {
  /**
   * GET /api/departments/names
   * Get a simple list of all department names and IDs.
   * Used for dropdowns and filters.
   */
  async getNames(): Promise<Response> {
    const departments = await db<DepartmentName[]>`SELECT id, name FROM departments ORDER BY name`;
    return ok(departments);
  },

  /**
   * GET /api/departments
   * Returns all departments with aggregate counts of users and devices.
   */
  async getAll(request: Request): Promise<Response> {
    return withAuth(request, async (payload) => {
      // Subqueries for counts - can be optimized if scaling issues
      const departments = await db<Department[]>`
        SELECT 
          d.*,
          (SELECT COUNT(*) FROM users u WHERE u.department_id = d.id) as user_count,
          (SELECT COUNT(*) FROM devices dev WHERE dev.department_id = d.id) as device_count
        FROM departments d
        ORDER BY d.name
      `;
      return ok(departments);
    });
  },

  /**
   * GET /api/departments/:id
   * Get details of a specific department.
   */
  async getById(request: Request, params: Record<string, string>): Promise<Response> {
    return withAuth(request, async (payload) => {
      const id = parseId(params.id);
      if (!id) return err("Invalid department ID");
      const [department] = await db<Department[]>`
        SELECT 
          d.*,
          (SELECT COUNT(*) FROM users u WHERE u.department_id = d.id) as user_count,
          (SELECT COUNT(*) FROM devices dev WHERE dev.department_id = d.id) as device_count
        FROM departments d
        WHERE d.id = ${id}
      `;
      return department ? ok(department) : notFound("Department");
    });
  },

  /**
   * POST /api/departments
   * Create a new department.
   * Access: Admin only.
   */
  async create(request: Request): Promise<Response> {
    return withAdmin(request, async (payload) => {
      const { name, code } = await request.json();
      if (!name || !code) return err("Name and code are required");
      
      const VALID_DEPT_NAMES = ["QA", "DEV", "CG", "ADMIN", "STG"];
      if (!VALID_DEPT_NAMES.includes(name.trim())) {
        return err("Invalid department name");
      }

      const codeUpper = code.toUpperCase().trim();
      const [existing] = await db<Department[]>`SELECT id FROM departments WHERE code = ${codeUpper}`;
      if (existing) return err("Department code already exists");

      await db`INSERT INTO departments (name, code) VALUES (${name.trim()}, ${codeUpper})`;
      const [newDept] = await db<Department[]>`SELECT * FROM departments WHERE code = ${codeUpper}`;

      await auditLogger.log({
        action: "create", objectType: "department", objectId: newDept.id,
        actor: auditLogger.createActorFromPayload(payload),
        changes: { after: newDept as unknown as Record<string, unknown> },
      });

      return created(newDept, "Department created");
    });
  },

  /**
   * POST /api/departments/bulk
   * Create multiple departments at once.
   * Access: Admin only.
   */
  async bulkCreate(request: Request): Promise<Response> {
    return withAdmin(request, async (payload) => {
      const departments = await request.json() as { name: string; code: string }[];
      if (!Array.isArray(departments)) return err("Invalid input: expected an array");

      const results = [];
      for (const dept of departments) {
        try {
          const { name, code } = dept;
          if (!name || !code) {
            results.push({ ...dept, status: "error", error: "Name and code required" });
            continue;
          }
          const codeUpper = code.toUpperCase().trim();
          const [existing] = await db<Department[]>`SELECT id FROM departments WHERE code = ${codeUpper}`;
          if (existing) {
            results.push({ name, code, status: "error", error: "Code exists" });
            continue;
          }
          await db`INSERT INTO departments (name, code) VALUES (${name.trim()}, ${codeUpper})`;
          results.push({ name, code, status: "success" });
        } catch (e) {
          results.push({ ...dept, status: "error", error: e instanceof Error ? e.message : "Unknown error" });
        }
      }

      await auditLogger.log({
        action: "create", objectType: "department", objectId: 0,
        actor: auditLogger.createActorFromPayload(payload),
        metadata: { count: results.filter(r => r.status === "success").length, bulk: true },
      });

      return ok(results, "Bulk creation completed");
    });
  },

  /**
   * PUT /api/departments/:id
   * Update department details.
   * Access: Admin only.
   */
  async update(request: Request, params: Record<string, string>): Promise<Response> {
    return withAdmin(request, async (payload) => {
      const id = parseId(params.id);
      if (!id) return err("Invalid department ID");

      const body = await request.json();
      const { name, code } = body;
      const updates: string[] = [], values: unknown[] = [];

      if (name !== undefined) {
        updates.push("name = ?");
        values.push(name.trim());
      }
      if (code !== undefined) {
        const codeUpper = code.toUpperCase().trim();
        const [existing] = await db<Department[]>`SELECT id FROM departments WHERE code = ${codeUpper} AND id != ${id}`;
        if (existing) return err("Department code already exists");
        updates.push("code = ?");
        values.push(codeUpper);
      }

      if (!updates.length) return err("No fields to update");

      const [before] = await db<Department[]>`SELECT * FROM departments WHERE id = ${id}`;
      if (!before) return notFound("Department");

      values.push(id);
      await db.unsafe(`UPDATE departments SET ${updates.join(", ")} WHERE id = ?`, values);
      const [updated] = await db<Department[]>`SELECT * FROM departments WHERE id = ${id}`;

      await auditLogger.log({
        action: "update", objectType: "department", objectId: id,
        actor: auditLogger.createActorFromPayload(payload),
        changes: { 
          before: before as unknown as Record<string, unknown>, 
          after: updated as unknown as Record<string, unknown> 
        },
      });

      return ok(updated, "Department updated");
    });
  },

  /**
   * DELETE /api/departments/:id
   * Delete a department.
   * Note: Cannot delete if it has assigned users or devices.
   * Access: Admin only.
   */
  async delete(request: Request, params: Record<string, string>): Promise<Response> {
    return withAdmin(request, async (payload) => {
      const id = parseId(params.id);
      if (!id) return err("Invalid department ID");

      const [users] = await db<{ count: number }[]>`SELECT COUNT(*) as count FROM users WHERE department_id = ${id}`;
      const [devices] = await db<{ count: number }[]>`SELECT COUNT(*) as count FROM devices WHERE department_id = ${id}`;
      
      if (users.count > 0 || devices.count > 0) {
        return err("Cannot delete department with assigned users or devices");
      }

      const [before] = await db<Department[]>`SELECT * FROM departments WHERE id = ${id}`;
      if (!before) return notFound("Department");

      await db`DELETE FROM departments WHERE id = ${id}`;

      await auditLogger.log({
        action: "delete", objectType: "department", objectId: id,
        actor: auditLogger.createActorFromPayload(payload),
        changes: { before: before as unknown as Record<string, unknown> },
      });

      return ok(null, "Department deleted");
    });
  },
};
