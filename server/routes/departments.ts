import { db } from "../db/connection";
import { auditLogger } from "../services/audit-logger";
import { json, ok, created, err, notFound, parseId, withAdmin } from "./_helpers";
import type { Department, DepartmentName } from "../types";
import { DEPARTMENT_NAMES } from "../types";

type DeptWithCounts = Department & { user_count: number; device_count: number };

export const departmentsRoutes = {
  async getNames(): Promise<Response> {
    return ok(DEPARTMENT_NAMES);
  },

  async getAll(): Promise<Response> {
    try {
      const depts = await db<DeptWithCounts[]>`
        SELECT d.*, COUNT(DISTINCT u.id) as user_count, COUNT(DISTINCT dev.id) as device_count
        FROM departments d LEFT JOIN users u ON d.id = u.department_id LEFT JOIN devices dev ON d.id = dev.department_id
        GROUP BY d.id ORDER BY d.name`;
      return ok(depts);
    } catch (e) {
      console.error("Get departments error:", e);
      return err("Failed to get departments", 500);
    }
  },

  async getById(_: Request, params: Record<string, string>): Promise<Response> {
    try {
      const id = parseId(params.id);
      if (!id) return err("Invalid department ID");

      const [dept] = await db<DeptWithCounts[]>`
        SELECT d.*, COUNT(DISTINCT u.id) as user_count, COUNT(DISTINCT dev.id) as device_count
        FROM departments d LEFT JOIN users u ON d.id = u.department_id LEFT JOIN devices dev ON d.id = dev.department_id
        WHERE d.id = ${id} GROUP BY d.id`;
      return dept ? ok(dept) : notFound("Department");
    } catch (e) {
      console.error("Get department error:", e);
      return err("Failed to get department", 500);
    }
  },

  async create(request: Request): Promise<Response> {
    return withAdmin(request, async (payload) => {
      try {
        const { name, code } = await request.json();
        if (!name?.trim()) return err("Name is required");
        if (!DEPARTMENT_NAMES.includes(name as DepartmentName)) {
          return err(`Invalid department name. Must be one of: ${DEPARTMENT_NAMES.join(", ")}`);
        }
        if (!code?.trim()) return err("Code is required");

        const codeUpper = code.toUpperCase().trim();
        const [existing] = await db<Department[]>`SELECT id FROM departments WHERE code = ${codeUpper}`;
        if (existing) return err("Department code already exists");

        await db`INSERT INTO departments (name, code) VALUES (${name.trim()}, ${codeUpper})`;
        const [newDept] = await db<Department[]>`SELECT * FROM departments WHERE code = ${codeUpper}`;

        await auditLogger.log({
          action: "create", objectType: "department", objectId: newDept.id,
          actor: auditLogger.createActorFromPayload(payload),
          changes: { after: { name: name.trim(), code: codeUpper } },
        });

        return created(newDept, "Department created");
      } catch (e) {
        console.error("Create department error:", e);
        return err("Failed to create department", 500);
      }
    });
  },

  async update(request: Request, params: Record<string, string>): Promise<Response> {
    return withAdmin(request, async (payload) => {
      try {
        const id = parseId(params.id);
        if (!id) return err("Invalid department ID");

        const { name, code } = await request.json();
        const updates: string[] = [], values: unknown[] = [];

        if (name !== undefined) {
          if (!DEPARTMENT_NAMES.includes(name as DepartmentName)) {
            return err(`Invalid department name. Must be one of: ${DEPARTMENT_NAMES.join(", ")}`);
          }
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
        values.push(id);
        await db.unsafe(`UPDATE departments SET ${updates.join(", ")} WHERE id = ?`, values);
        const [updated] = await db<Department[]>`SELECT * FROM departments WHERE id = ${id}`;

        await auditLogger.log({
          action: "update", objectType: "department", objectId: id,
          actor: auditLogger.createActorFromPayload(payload),
          changes: { before: before ? { ...before } : undefined, after: { name, code } },
        });

        return ok(updated, "Department updated");
      } catch (e) {
        console.error("Update department error:", e);
        return err("Failed to update department", 500);
      }
    });
  },

  async delete(request: Request, params: Record<string, string>): Promise<Response> {
    return withAdmin(request, async (payload) => {
      try {
        const id = parseId(params.id);
        if (!id) return err("Invalid department ID");

        const [counts] = await db<{ user_count: number; device_count: number }[]>`
          SELECT (SELECT COUNT(*) FROM users WHERE department_id = ${id}) as user_count,
                 (SELECT COUNT(*) FROM devices WHERE department_id = ${id}) as device_count`;
        if (counts?.user_count > 0 || counts?.device_count > 0) {
          return err("Cannot delete department with users or devices");
        }

        const [before] = await db<Department[]>`SELECT * FROM departments WHERE id = ${id}`;
        await db`DELETE FROM departments WHERE id = ${id}`;

        await auditLogger.log({
          action: "delete", objectType: "department", objectId: id,
          actor: auditLogger.createActorFromPayload(payload),
          changes: { before: before ? { ...before } : undefined },
        });

        return ok(null, "Department deleted");
      } catch (e) {
        console.error("Delete department error:", e);
        return err("Failed to delete department", 500);
      }
    });
  },
};
