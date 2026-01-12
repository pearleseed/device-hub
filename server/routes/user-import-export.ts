/**
 * User Import/Export Routes
 * API endpoints for CSV import and Excel export functionality
 */

import { authenticateRequest, requireAdmin } from "../middleware/auth";
import { auditLogger } from "../services/audit-logger";
import {
  importUsersFromCSV,
  exportUsersWithPasswords,
  exportUsersForAdmin,
  getImportTemplate,
  clearAllTemporaryPasswords,
} from "../services/user-import-export";

// JSON response helper
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// CSV response helper
function csvResponse(content: string, filename: string): Response {
  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export const userImportExportRoutes = {
  /**
   * POST /api/users/import
   * Import users from CSV file
   * Requires admin access
   */
  async importUsers(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      // Only admins can import users
      if (!requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      // Parse multipart form data or JSON body
      const contentType = request.headers.get("content-type") || "";
      let csvContent: string;

      if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || !(file instanceof File)) {
          return jsonResponse(
            { success: false, error: "No CSV file provided" },
            400,
          );
        }

        // Validate file type
        if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
          return jsonResponse(
            { success: false, error: "File must be a CSV" },
            400,
          );
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          return jsonResponse(
            { success: false, error: "File size must be less than 5MB" },
            400,
          );
        }

        csvContent = await file.text();
      } else if (contentType.includes("application/json")) {
        const body = await request.json();
        csvContent = body.csvContent;

        if (!csvContent) {
          return jsonResponse(
            { success: false, error: "CSV content is required" },
            400,
          );
        }
      } else {
        return jsonResponse(
          { success: false, error: "Invalid content type" },
          400,
        );
      }

      // Import users
      const result = await importUsersFromCSV(csvContent, payload);

      // Audit log
      await auditLogger.log({
        action: "bulk_import",
        objectType: "user",
        objectId: 0,
        actor: auditLogger.createActorFromPayload(payload),
        metadata: {
          created: result.created,
          failed: result.failed,
          errors: result.errors.slice(0, 10), // Limit errors in log
        },
      });

      return jsonResponse({
        success: result.success,
        data: {
          created: result.created,
          failed: result.failed,
          errors: result.errors,
          createdUsers: result.createdUsers.map((u) => ({
            id: u.id,
            email: u.email,
            // Don't expose passwords in response - they're in the export
          })),
        },
        message: `Successfully imported ${result.created} users${result.failed > 0 ? `, ${result.failed} failed` : ""}`,
      });
    } catch (error) {
      console.error("Import users error:", error);
      return jsonResponse(
        { success: false, error: "Failed to import users" },
        500,
      );
    }
  },

  /**
   * GET /api/users/export
   * Export users with temporary passwords
   * Requires admin access
   */
  async exportUsers(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      // Only admins can export users
      if (!requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      // Get optional user IDs from query params
      const url = new URL(request.url);
      const idsParam = url.searchParams.get("ids");
      const userIds = idsParam
        ? idsParam
            .split(",")
            .map((id) => parseInt(id))
            .filter((id) => !isNaN(id))
        : undefined;

      const { content, filename } = await exportUsersWithPasswords(userIds);

      // Audit log
      await auditLogger.log({
        action: "bulk_export",
        objectType: "user",
        objectId: 0,
        actor: auditLogger.createActorFromPayload(payload),
        metadata: {
          exportType: "users_with_passwords",
          userCount: userIds?.length || "all",
        },
      });

      return csvResponse(content, filename);
    } catch (error) {
      console.error("Export users error:", error);
      return jsonResponse(
        { success: false, error: "Failed to export users" },
        500,
      );
    }
  },

  /**
   * GET /api/users/export/admin
   * Export all users with decrypted passwords (superuser only)
   * Security sensitive - requires superuser access
   */
  async exportUsersAdmin(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      // Only superusers can export with passwords
      if (payload.role !== "superuser") {
        return jsonResponse(
          { success: false, error: "Forbidden - Superuser access required" },
          403,
        );
      }

      const { content, filename } = await exportUsersForAdmin();

      // Audit log - security sensitive action
      await auditLogger.log({
        action: "admin_export",
        objectType: "user",
        objectId: 0,
        actor: auditLogger.createActorFromPayload(payload),
        metadata: {
          exportType: "admin_with_passwords",
          securitySensitive: true,
        },
      });

      return csvResponse(content, filename);
    } catch (error) {
      console.error("Admin export users error:", error);
      return jsonResponse(
        { success: false, error: "Failed to export users" },
        500,
      );
    }
  },

  /**
   * GET /api/users/import/template
   * Download CSV template for user import
   */
  async getTemplate(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      // Only admins can get template
      if (!requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Forbidden" }, 403);
      }

      const template = getImportTemplate();
      return csvResponse(template, "user_import_template.csv");
    } catch (error) {
      console.error("Get template error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get template" },
        500,
      );
    }
  },

  /**
   * POST /api/users/export/clear-passwords
   * Clear temporary passwords from memory
   * Requires superuser access
   */
  async clearPasswords(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      // Only superusers can clear passwords
      if (payload.role !== "superuser") {
        return jsonResponse(
          { success: false, error: "Forbidden - Superuser access required" },
          403,
        );
      }

      clearAllTemporaryPasswords();

      // Audit log
      await auditLogger.log({
        action: "clear_temp_passwords",
        objectType: "user",
        objectId: 0,
        actor: auditLogger.createActorFromPayload(payload),
        metadata: {
          securityAction: true,
        },
      });

      return jsonResponse({
        success: true,
        message: "Temporary passwords cleared",
      });
    } catch (error) {
      console.error("Clear passwords error:", error);
      return jsonResponse(
        { success: false, error: "Failed to clear passwords" },
        500,
      );
    }
  },
};
