/**
 * User Import/Export Service
 * Handles CSV import and Excel export for user management
 */

import { db } from "../db/connection";
import { hashPassword } from "../middleware/auth";
import { auditLogger } from "./audit-logger";
import type { UserPublic, UserRole, JWTPayload } from "../types";

// Temporary password storage for export (in-memory, cleared after export)
// In production, consider using Redis with TTL or encrypted storage
const temporaryPasswords = new Map<number, string>();

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

/**
 * Parse CSV content into user data
 */
export interface CSVUserRow {
  name: string;
  email: string;
  department: string;
  role?: string;
}

export interface ImportResult {
  success: boolean;
  created: number;
  failed: number;
  errors: string[];
  createdUsers: { id: number; email: string; tempPassword: string }[];
}

/**
 * Parse CSV string into rows
 */
function parseCSV(csvContent: string): CSVUserRow[] {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("CSV must have a header row and at least one data row");
  }

  // Parse header
  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(",").map((h) => h.trim().replace(/"/g, ""));

  // Find column indices
  const nameIdx = headers.findIndex(
    (h) => h === "name" || h === "full name" || h === "fullname",
  );
  const emailIdx = headers.findIndex(
    (h) => h === "email" || h === "email address" || h === "username",
  );
  const deptIdx = headers.findIndex((h) => h === "department" || h === "dept");
  const roleIdx = headers.findIndex((h) => h === "role");

  if (nameIdx === -1) throw new Error('CSV must have a "name" column');
  if (emailIdx === -1) throw new Error('CSV must have an "email" column');
  if (deptIdx === -1) throw new Error('CSV must have a "department" column');

  const users: CSVUserRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parsing (handles quoted values)
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
    const role =
      roleIdx !== -1
        ? values[roleIdx]?.replace(/"/g, "").trim().toLowerCase()
        : "user";

    if (name && email && department) {
      users.push({ name, email, department, role });
    }
  }

  return users;
}

/**
 * Validate department name against allowed values
 */
const VALID_DEPARTMENTS = [
  "IT",
  "Engineering",
  "Design",
  "Marketing",
  "HR",
  "Finance",
  "Operations",
  "Sales",
];

function normalizeDepartment(dept: string): string | null {
  const normalized = dept.charAt(0).toUpperCase() + dept.slice(1).toLowerCase();
  const found = VALID_DEPARTMENTS.find(
    (d) => d.toLowerCase() === dept.toLowerCase(),
  );
  return found || null;
}

/**
 * Import users from CSV content
 */
export async function importUsersFromCSV(
  csvContent: string,
  actor: JWTPayload,
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    created: 0,
    failed: 0,
    errors: [],
    createdUsers: [],
  };

  let users: CSVUserRow[];
  try {
    users = parseCSV(csvContent);
  } catch (error) {
    return {
      ...result,
      success: false,
      errors: [error instanceof Error ? error.message : "Failed to parse CSV"],
    };
  }

  if (users.length === 0) {
    return {
      ...result,
      success: false,
      errors: ["No valid user data found in CSV"],
    };
  }

  // Get department mappings
  const departments = await db<
    { id: number; name: string }[]
  >`SELECT id, name FROM departments`;
  const deptMap = new Map(departments.map((d) => [d.name.toLowerCase(), d.id]));

  for (const userData of users) {
    try {
      // Validate email/username format - allow either:
      // 1. Full email format: user@domain.com
      // 2. Simple username for support accounts: alphanumeric, dots, underscores, hyphens
      const fullEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const simpleUsernameRegex = /^[a-zA-Z0-9._-]+$/;
      if (!fullEmailRegex.test(userData.email) && !simpleUsernameRegex.test(userData.email)) {
        result.errors.push(`Invalid username format: ${userData.email}`);
        result.failed++;
        continue;
      }

      // Check if email already exists
      const existing = await db<
        { id: number }[]
      >`SELECT id FROM users WHERE email = ${userData.email}`;
      if (existing.length > 0) {
        result.errors.push(`Username already exists: ${userData.email}`);
        result.failed++;
        continue;
      }

      // Validate and get department ID
      const normalizedDept = normalizeDepartment(userData.department);
      if (!normalizedDept) {
        result.errors.push(
          `Invalid department "${userData.department}" for ${userData.email}. Valid: ${VALID_DEPARTMENTS.join(", ")}`,
        );
        result.failed++;
        continue;
      }

      const deptId = deptMap.get(normalizedDept.toLowerCase());
      if (!deptId) {
        result.errors.push(
          `Department not found: ${normalizedDept} for ${userData.email}`,
        );
        result.failed++;
        continue;
      }

      // Validate role
      const role: UserRole = userData.role === "admin" ? "admin" : "user";

      // Generate temporary password
      const tempPassword = generateTemporaryPassword();
      const passwordHash = await hashPassword(tempPassword);

      // Generate avatar URL
      const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userData.name)}`;

      // Insert user with must_change_password = true
      const insertResult = await db`
        INSERT INTO users (name, email, password_hash, department_id, role, avatar_url, must_change_password)
        VALUES (${userData.name}, ${userData.email}, ${passwordHash}, ${deptId}, ${role}, ${avatarUrl}, TRUE)
      `;

      // Get the inserted user ID
      const newUser = await db<
        { id: number }[]
      >`SELECT id FROM users WHERE email = ${userData.email}`;
      const userId = newUser[0]?.id;

      if (userId) {
        // Store temporary password for export
        temporaryPasswords.set(userId, tempPassword);

        result.createdUsers.push({
          id: userId,
          email: userData.email,
          tempPassword,
        });
        result.created++;

        // Audit log
        await auditLogger.log({
          action: "create",
          objectType: "user",
          objectId: userId,
          actor: auditLogger.createActorFromPayload(actor),
          metadata: {
            importedFromCSV: true,
            email: userData.email,
          },
        });
      }
    } catch (error) {
      result.errors.push(
        `Failed to create user ${userData.email}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      result.failed++;
    }
  }

  result.success = result.created > 0;
  return result;
}

/**
 * Export users with temporary passwords to Excel format (as CSV for simplicity)
 * Returns CSV content that can be opened in Excel
 */
export async function exportUsersWithPasswords(
  userIds?: number[],
): Promise<{ content: string; filename: string }> {
  let users: UserPublic[];

  if (userIds && userIds.length > 0) {
    users = await db<UserPublic[]>`
      SELECT * FROM v_users_public 
      WHERE id IN ${db(userIds)}
      ORDER BY name
    `;
  } else {
    users = await db<UserPublic[]>`SELECT * FROM v_users_public ORDER BY name`;
  }

  // Build CSV content
  const headers = [
    "ID",
    "Name",
    "Username",
    "Department",
    "Role",
    "Temporary Password",
    "Status",
    "Created At",
  ];
  const rows = users.map((user) => {
    const tempPassword = temporaryPasswords.get(user.id) || "N/A (already set)";
    return [
      user.id,
      `"${user.name}"`,
      user.email,
      user.department_name || "",
      user.role,
      tempPassword,
      user.is_active ? "Active" : "Locked",
      user.created_at
        ? new Date(user.created_at).toISOString().split("T")[0]
        : "",
    ].join(",");
  });

  const content = "\ufeff" + [headers.join(","), ...rows].join("\n");
  const filename = `users_export_${new Date().toISOString().split("T")[0]}.csv`;

  return { content, filename };
}

/**
 * Export all users with decrypted passwords (Admin only - security sensitive)
 * Note: This exports the temporary passwords that were generated during import
 */
export async function exportUsersForAdmin(): Promise<{
  content: string;
  filename: string;
}> {
  const users = await db<
    UserPublic[]
  >`SELECT * FROM v_users_public ORDER BY name`;

  const headers = [
    "ID",
    "Name",
    "Username",
    "Department",
    "Role",
    "Temporary Password",
    "Must Change Password",
    "Status",
    "Last Login",
    "Created At",
  ];
  const rows = users.map((user) => {
    const tempPassword = temporaryPasswords.get(user.id) || "N/A";
    return [
      user.id,
      `"${user.name}"`,
      user.email,
      user.department_name || "",
      user.role,
      tempPassword,
      (user as any).must_change_password ? "Yes" : "No",
      user.is_active ? "Active" : "Locked",
      user.last_login_at ? new Date(user.last_login_at).toISOString() : "Never",
      user.created_at
        ? new Date(user.created_at).toISOString().split("T")[0]
        : "",
    ].join(",");
  });

  const content = "\ufeff" + [headers.join(","), ...rows].join("\n");
  const filename = `users_admin_export_${new Date().toISOString().split("T")[0]}.csv`;

  return { content, filename };
}

/**
 * Clear temporary password from memory after export
 */
export function clearTemporaryPassword(userId: number): void {
  temporaryPasswords.delete(userId);
}

/**
 * Clear all temporary passwords
 */
export function clearAllTemporaryPasswords(): void {
  temporaryPasswords.clear();
}

/**
 * Get CSV template for user import
 */
export function getImportTemplate(): string {
  const headers = "name,username,department,role";
  const example1 = '"John Doe",john.doe@company.com,Engineering,user';
  const example2 = '"Jane Smith",jane.smith@company.com,IT,admin';

  return "\ufeff" + [headers, example1, example2].join("\n");
}
