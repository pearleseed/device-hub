import { auditLogger } from "../services/audit-logger";
import { importUsersFromCSV, exportUsersWithPasswords, exportUsersForAdmin, getImportTemplate, clearAllTemporaryPasswords } from "../services/user-import-export";
import { ok, err, csvResponse, withAdmin, withSuperuser } from "./_helpers";

export const userImportExportRoutes = {
  async importUsers(request: Request): Promise<Response> {
    return withAdmin(request, async (payload) => {
      try {
        const contentType = request.headers.get("content-type") || "";
        let csvContent: string;

        if (contentType.includes("multipart/form-data")) {
          const formData = await request.formData();
          const file = formData.get("file");
          if (!file || !(file instanceof File)) return err("No CSV file provided");
          if (!file.name.endsWith(".csv") && file.type !== "text/csv") return err("File must be a CSV");
          if (file.size > 5 * 1024 * 1024) return err("File size must be less than 5MB");
          csvContent = await file.text();
        } else if (contentType.includes("application/json")) {
          const body = await request.json();
          csvContent = body.csvContent;
          if (!csvContent) return err("CSV content is required");
        } else {
          return err("Invalid content type");
        }

        const result = await importUsersFromCSV(csvContent, payload);
        await auditLogger.log({ action: "bulk_import", objectType: "user", objectId: 0, actor: auditLogger.createActorFromPayload(payload), metadata: { created: result.created, failed: result.failed, errors: result.errors.slice(0, 10) } });

        return ok({ created: result.created, failed: result.failed, errors: result.errors, createdUsers: result.createdUsers.map(u => ({ id: u.id, email: u.email })) }, `Successfully imported ${result.created} users${result.failed > 0 ? `, ${result.failed} failed` : ""}`);
      } catch (e) { console.error("Import users error:", e); return err("Failed to import users", 500); }
    });
  },

  async exportUsers(request: Request): Promise<Response> {
    return withAdmin(request, async (payload) => {
      try {
        const url = new URL(request.url);
        const idsParam = url.searchParams.get("ids");
        const userIds = idsParam ? idsParam.split(",").map(id => +id).filter(id => !isNaN(id)) : undefined;
        const { content, filename } = await exportUsersWithPasswords(userIds);
        await auditLogger.log({ action: "bulk_export", objectType: "user", objectId: 0, actor: auditLogger.createActorFromPayload(payload), metadata: { exportType: "users_with_passwords", userCount: userIds?.length || "all" } });
        return csvResponse(content, filename);
      } catch (e) { console.error("Export users error:", e); return err("Failed to export users", 500); }
    });
  },

  async exportUsersAdmin(request: Request): Promise<Response> {
    return withSuperuser(request, async (payload) => {
      try {
        const { content, filename } = await exportUsersForAdmin();
        await auditLogger.log({ action: "admin_export", objectType: "user", objectId: 0, actor: auditLogger.createActorFromPayload(payload), metadata: { exportType: "admin_with_passwords", securitySensitive: true } });
        return csvResponse(content, filename);
      } catch (e) { console.error("Admin export users error:", e); return err("Failed to export users", 500); }
    });
  },

  async getTemplate(request: Request): Promise<Response> {
    return withAdmin(request, async () => {
      try { return csvResponse(getImportTemplate(), "user_import_template.csv"); }
      catch (e) { console.error("Get template error:", e); return err("Failed to get template", 500); }
    });
  },

  async clearPasswords(request: Request): Promise<Response> {
    return withSuperuser(request, async (payload) => {
      try {
        clearAllTemporaryPasswords();
        await auditLogger.log({ action: "clear_temp_passwords", objectType: "user", objectId: 0, actor: auditLogger.createActorFromPayload(payload), metadata: { securityAction: true } });
        return ok(null, "Temporary passwords cleared");
      } catch (e) { console.error("Clear passwords error:", e); return err("Failed to clear passwords", 500); }
    });
  },
};
