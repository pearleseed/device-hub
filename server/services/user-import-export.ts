/**
 * User Import/Export Service
 * Handles CSV import and Excel export for user management
 */

import { db } from "../db/connection";
import { hashPassword } from "../middleware/auth";
import { auditLogger } from "./audit-logger";
import type { UserPublic, UserRole, JWTPayload } from "../types";

/**
 * Generate a random temporary password
 */
export function generateTemporaryPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}

export interface CSVUserRow {
  name: string;
  email: string;
  department: string;
  role?: string;
  rowNumber: number;
}

export interface ImportResult {
  success: boolean;
  created: number;
  updated: number;
  failed: number;
  errors: string[];
  createdUsers: { id: number; email: string; tempPassword: string }[];
  updatedUsers: { id: number; email: string }[];
}

export interface PreviewRow {
  rowNumber: number;
  name: string;
  email: string;
  department: string;
  role: string;
  status: "create" | "update" | "error";
  error?: string;
  existingUser?: { id: number; name: string; department: string; role: string };
}

export interface PreviewResult {
  success: boolean;
  totalRows: number;
  toCreate: number;
  toUpdate: number;
  errors: number;
  rows: PreviewRow[];
  availableDepartments: string[];
}

/**
 * Parse CSV string into structured user rows.
 */
function parseCSV(csvContent: string): CSVUserRow[] {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("CSV must have a header row and at least one data row");
  }

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(",").map((h) => h.trim().replace(/"/g, ""));

  const nameIdx = headers.findIndex(
    (h) => h === "name" || h === "full name" || h === "fullname",
  );
  const emailIdx = headers.findIndex(
    (h) => h === "username" || h === "email" || h === "email address",
  );
  const deptIdx = headers.findIndex((h) => h === "department" || h === "dept");
  const roleIdx = headers.findIndex((h) => h === "role");

  if (nameIdx === -1) throw new Error('CSV must have a "name" column');
  if (emailIdx === -1) throw new Error('CSV must have a "username" column');
  if (deptIdx === -1) throw new Error('CSV must have a "department" column');

  const users: CSVUserRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;

    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const name = values[nameIdx]?.replace(/"/g, "").trim();
    const email = values[emailIdx]?.replace(/"/g, "").trim().toLowerCase();
    const department = values[deptIdx]?.replace(/"/g, "").trim();
    const role = roleIdx !== -1 ? values[roleIdx]?.replace(/"/g, "").trim().toLowerCase() : "user";

    if (name && email && department) {
      users.push({ name, email, department, role, rowNumber: i + 1 });
    }
  }

  return users;
}

async function getDepartmentsMap(): Promise<Map<string, number>> {
  const departments = await db<{ id: number; name: string }[]>`SELECT id, name FROM departments`;
  return new Map(departments.map((d) => [d.name.toLowerCase(), d.id]));
}

export async function getAvailableDepartments(): Promise<string[]> {
  const departments = await db<{ name: string }[]>`SELECT name FROM departments ORDER BY name`;
  return departments.map((d) => d.name);
}

function isValidUsername(value: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9._-]{3,50}$/;
  return usernameRegex.test(value);
}

/**
 * Preview import - dry run mode
 */
export async function previewImport(csvContent: string): Promise<PreviewResult> {
  const result: PreviewResult = {
    success: true,
    totalRows: 0,
    toCreate: 0,
    toUpdate: 0,
    errors: 0,
    rows: [],
    availableDepartments: [],
  };

  let users: CSVUserRow[];
  try {
    users = parseCSV(csvContent);
  } catch (error) {
    return {
      ...result,
      success: false,
      rows: [{
        rowNumber: 1,
        name: "",
        email: "",
        department: "",
        role: "",
        status: "error",
        error: error instanceof Error ? error.message : "Failed to parse CSV",
      }],
    };
  }

  result.totalRows = users.length;
  const deptMap = await getDepartmentsMap();
  result.availableDepartments = await getAvailableDepartments();

  const emails = users.map((u) => u.email);
  const existingUsers = await db<{ id: number; email: string; name: string; department_id: number; role: string }[]>`
    SELECT id, email, name, department_id, role FROM users WHERE email IN ${db(emails)}
  `;
  const existingMap = new Map(existingUsers.map((u) => [u.email, u]));

  const deptNames = await db<{ id: number; name: string }[]>`SELECT id, name FROM departments`;
  const deptIdToName = new Map(deptNames.map((d) => [d.id, d.name]));

  for (const userData of users) {
    const row: PreviewRow = {
      rowNumber: userData.rowNumber,
      name: userData.name,
      email: userData.email,
      department: userData.department,
      role: userData.role || "user",
      status: "create",
    };

    if (!isValidUsername(userData.email)) {
      row.status = "error";
      row.error = "Invalid username format (3-50 chars, alphanumeric/._-)";
      result.errors++;
      result.rows.push(row);
      continue;
    }

    const deptId = deptMap.get(userData.department.toLowerCase());
    if (!deptId) {
      row.status = "error";
      row.error = `Department "${userData.department}" not found`;
      result.errors++;
      result.rows.push(row);
      continue;
    }

    const existing = existingMap.get(userData.email);
    if (existing) {
      row.status = "update";
      row.existingUser = {
        id: existing.id,
        name: existing.name,
        department: deptIdToName.get(existing.department_id) || "Unknown",
        role: existing.role,
      };
      result.toUpdate++;
    } else {
      result.toCreate++;
    }

    result.rows.push(row);
  }

  result.success = result.errors === 0;
  return result;
}

/**
 * Import users from CSV with upsert support
 * Temp password được lưu vào DB, sẽ bị xóa khi user đổi password
 */
export async function importUsersFromCSV(
  csvContent: string,
  actor: JWTPayload,
  mode: "create" | "upsert" = "create",
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    created: 0,
    updated: 0,
    failed: 0,
    errors: [],
    createdUsers: [],
    updatedUsers: [],
  };

  let users: CSVUserRow[];
  try {
    users = parseCSV(csvContent);
  } catch (error) {
    return { ...result, success: false, errors: [error instanceof Error ? error.message : "Failed to parse CSV"] };
  }

  if (users.length === 0) {
    return { ...result, success: false, errors: ["No valid user data found in CSV"] };
  }

  const deptMap = await getDepartmentsMap();
  const availableDepts = await getAvailableDepartments();

  for (const userData of users) {
    try {
      if (!isValidUsername(userData.email)) {
        result.errors.push(`Row ${userData.rowNumber}: Invalid username: ${userData.email}`);
        result.failed++;
        continue;
      }

      const deptId = deptMap.get(userData.department.toLowerCase());
      if (!deptId) {
        result.errors.push(`Row ${userData.rowNumber}: Department "${userData.department}" not found. Available: ${availableDepts.join(", ")}`);
        result.failed++;
        continue;
      }

      const role: UserRole = userData.role === "admin" ? "admin" : "user";
      const existing = await db<{ id: number }[]>`SELECT id FROM users WHERE email = ${userData.email}`;

      if (existing.length > 0) {
        if (mode === "create") {
          result.errors.push(`Row ${userData.rowNumber}: Username already exists: ${userData.email} (skipped)`);
          result.failed++;
          continue;
        }

        const userId = existing[0].id;
        await db`UPDATE users SET name = ${userData.name}, department_id = ${deptId}, role = ${role}, updated_at = NOW() WHERE id = ${userId}`;
        result.updatedUsers.push({ id: userId, email: userData.email });
        result.updated++;

        await auditLogger.log({
          action: "update",
          objectType: "user",
          objectId: userId,
          actor: auditLogger.createActorFromPayload(actor),
          metadata: { importedFromCSV: true, username: userData.email, mode: "upsert" },
        });
      } else {
        // Create new user with temp password stored in DB
        const tempPassword = generateTemporaryPassword();
        const passwordHash = await hashPassword(tempPassword);
        const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.name)}`;

        await db`
          INSERT INTO users (name, email, password_hash, temp_password, department_id, role, avatar_url, must_change_password)
          VALUES (${userData.name}, ${userData.email}, ${passwordHash}, ${tempPassword}, ${deptId}, ${role}, ${avatarUrl}, TRUE)
        `;

        const newUser = await db<{ id: number }[]>`SELECT id FROM users WHERE email = ${userData.email}`;
        const userId = newUser[0]?.id;

        if (userId) {
          result.createdUsers.push({ id: userId, email: userData.email, tempPassword });
          result.created++;

          await auditLogger.log({
            action: "create",
            objectType: "user",
            objectId: userId,
            actor: auditLogger.createActorFromPayload(actor),
            metadata: { importedFromCSV: true, username: userData.email },
          });
        }
      }
    } catch (error) {
      result.errors.push(`Row ${userData.rowNumber}: Failed to process ${userData.email}: ${error instanceof Error ? error.message : "Unknown error"}`);
      result.failed++;
    }
  }

  result.success = result.created > 0 || result.updated > 0;
  return result;
}

// Extended type to include temp_password from view
interface UserWithTempPassword extends UserPublic {
  temp_password?: string | null;
}

/**
 * Export users - Temp password lấy từ DB
 */
export async function exportUsersWithPasswords(userIds?: number[]): Promise<{ content: string; filename: string }> {
  let users: UserWithTempPassword[];

  if (userIds && userIds.length > 0) {
    const idList = userIds.join(",");
    users = await db.unsafe<UserWithTempPassword[]>(`SELECT * FROM v_users_public WHERE id IN (${idList}) ORDER BY name`);
  } else {
    users = await db<UserWithTempPassword[]>`SELECT * FROM v_users_public ORDER BY name`;
  }

  const headers = ["ID", "Name", "Username", "Department", "Role", "Temporary Password", "Status", "Created At"];
  const rows = users.map((user) => {
    const tempPassword = user.temp_password || "N/A (password changed)";
    return [
      user.id,
      `"${user.name}"`,
      user.email,
      user.department_name || "",
      user.role,
      tempPassword,
      user.is_active ? "Active" : "Locked",
      user.created_at ? new Date(user.created_at).toISOString().split("T")[0] : "",
    ].join(",");
  });

  return {
    content: "\ufeff" + [headers.join(","), ...rows].join("\n"),
    filename: `users_export_${new Date().toISOString().split("T")[0]}.csv`,
  };
}

/**
 * Clear temp password for a user (call after password change)
 */
export async function clearTempPassword(userId: number): Promise<void> {
  await db`UPDATE users SET temp_password = NULL WHERE id = ${userId}`;
}

/**
 * Clear all temp passwords
 */
export async function clearAllTemporaryPasswords(): Promise<void> {
  await db`UPDATE users SET temp_password = NULL WHERE temp_password IS NOT NULL`;
}

/**
 * Get CSV template with dynamic departments from DB
 */
export async function getImportTemplate(): Promise<string> {
  const departments = await getAvailableDepartments();
  const headers = "name,username,department,role";
  const example1 = `"John Doe",john.doe,${departments[0] || "Engineering"},user`;
  const example2 = `"Jane Smith",jane.smith,${departments[1] || "IT"},admin`;
  const comment = `# Available departments: ${departments.join(", ")}`;
  const comment2 = "# Available roles: user, admin";

  return "\ufeff" + [comment, comment2, headers, example1, example2].join("\n");
}
