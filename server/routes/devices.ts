import { db } from "../db/connection";
import { authenticateRequest, requireAdmin } from "../middleware/auth";
import { auditLogger } from "../services/audit-logger";
import type {
  Device,
  DeviceWithDepartment,
  CreateDeviceRequest,
  UpdateDeviceRequest,
  DeviceCategory,
  DeviceStatus,
} from "../types";

// JSON response helper
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const devicesRoutes = {
  // GET /api/devices
  async getAll(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const category = url.searchParams.get("category");
      const status = url.searchParams.get("status");
      const department_id = url.searchParams.get("department_id");
      const search = url.searchParams.get("search");
      const min_price = url.searchParams.get("min_price");
      const max_price = url.searchParams.get("max_price");
      const price_field =
        url.searchParams.get("price_field") || "purchase_price"; // or "selling_price"

      // Build dynamic query with filters
      let sql = "SELECT * FROM v_device_details WHERE 1=1";
      const params: unknown[] = [];

      if (category) {
        sql += " AND category = ?";
        params.push(category);
      }
      if (status) {
        sql += " AND status = ?";
        params.push(status);
      }
      if (department_id) {
        sql += " AND department_id = ?";
        params.push(parseInt(department_id));
      }
      if (search) {
        sql +=
          " AND (name LIKE ? OR asset_tag LIKE ? OR brand LIKE ? OR model LIKE ?)";
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      // Price range filtering
      const priceColumn =
        price_field === "selling_price" ? "selling_price" : "purchase_price";
      if (min_price) {
        sql += ` AND ${priceColumn} >= ?`;
        params.push(parseFloat(min_price));
      }
      if (max_price) {
        sql += ` AND ${priceColumn} < ?`;
        params.push(parseFloat(max_price));
      }

      sql += " ORDER BY name";

      const devices = await db.unsafe<DeviceWithDepartment[]>(
        sql,
        params,
      );

      // Parse JSON specs (handle both string and already-parsed object)
      const devicesWithSpecs = devices.map((e) => ({
        ...e,
        specs: e.specs_json
          ? typeof e.specs_json === "string"
            ? JSON.parse(e.specs_json)
            : e.specs_json
          : {},
      }));

      return jsonResponse({ success: true, data: devicesWithSpecs });
    } catch (error) {
      console.error("Get devices error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get devices" },
        500,
      );
    }
  },

  // GET /api/devices/:id
  async getById(
    request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      const id = parseInt(params.id);
      if (isNaN(id)) {
        return jsonResponse(
          { success: false, error: "Invalid device ID" },
          400,
        );
      }

      const devices = await db<DeviceWithDepartment[]>`
        SELECT * FROM v_device_details WHERE id = ${id}
      `;

      if (devices.length === 0) {
        return jsonResponse({ success: false, error: "Device not found" }, 404);
      }

      // Parse JSON specs (handle both string and already-parsed object)
      const deviceWithSpecs = {
        ...devices[0],
        specs: devices[0].specs_json
          ? typeof devices[0].specs_json === "string"
            ? JSON.parse(devices[0].specs_json)
            : devices[0].specs_json
          : {},
      };

      return jsonResponse({ success: true, data: deviceWithSpecs });
    } catch (error) {
      console.error("Get device error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get device" },
        500,
      );
    }
  },

  // POST /api/devices
  async create(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload || !requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const body: CreateDeviceRequest = await request.json();
      const {
        name,
        asset_tag,
        category,
        brand,
        model,
        department_id,
        purchase_price,
        purchase_date,
        specs_json,
        image_url,
      } = body;

      // Validation
      if (!name?.trim()) {
        return jsonResponse({ success: false, error: "Name is required" }, 400);
      }
      if (!asset_tag?.trim()) {
        return jsonResponse(
          { success: false, error: "Asset tag is required" },
          400,
        );
      }
      if (!category) {
        return jsonResponse(
          { success: false, error: "Category is required" },
          400,
        );
      }
      if (!brand?.trim()) {
        return jsonResponse(
          { success: false, error: "Brand is required" },
          400,
        );
      }
      if (!model?.trim()) {
        return jsonResponse(
          { success: false, error: "Model is required" },
          400,
        );
      }
      if (!department_id) {
        return jsonResponse(
          { success: false, error: "Department is required" },
          400,
        );
      }
      if (purchase_price === undefined || purchase_price < 0) {
        return jsonResponse(
          { success: false, error: "Valid purchase price is required" },
          400,
        );
      }
      if (!purchase_date) {
        return jsonResponse(
          { success: false, error: "Purchase date is required" },
          400,
        );
      }

      const assetTagUpper = asset_tag.toUpperCase();

      // Check for duplicate asset tag
      const existing = await db<Device[]>`SELECT id FROM devices WHERE asset_tag = ${assetTagUpper}`;
      if (existing.length > 0) {
        return jsonResponse(
          { success: false, error: "Asset tag already exists" },
          400,
        );
      }

      const nameTrimmed = name.trim();
      const assetTagTrimmed = assetTagUpper.trim();
      const brandTrimmed = brand.trim();
      const modelTrimmed = model.trim();
      const specsValue = specs_json || "{}";
      const imageValue = image_url || "";

      await db`
        INSERT INTO devices 
        (name, asset_tag, category, brand, model, department_id, purchase_price, purchase_date, specs_json, image_url)
        VALUES (${nameTrimmed}, ${assetTagTrimmed}, ${category}, ${brandTrimmed}, ${modelTrimmed}, 
                ${department_id}, ${purchase_price}, ${purchase_date}, ${specsValue}, ${imageValue})
      `;

      const newDevice =
        await db<Device[]>`SELECT * FROM devices WHERE asset_tag = ${assetTagUpper}`;

      // Audit log
      await auditLogger.log({
        action: "create",
        objectType: "device",
        objectId: newDevice[0].id,
        actor: auditLogger.createActorFromPayload(payload),
        changes: {
          after: {
            name: nameTrimmed,
            asset_tag: assetTagTrimmed,
            category,
            brand: brandTrimmed,
            model: modelTrimmed,
            department_id,
            purchase_price,
            purchase_date,
          },
        },
      });

      return jsonResponse(
        { success: true, data: newDevice[0], message: "Device created" },
        201,
      );
    } catch (error) {
      console.error("Create device error:", error);
      return jsonResponse(
        { success: false, error: "Failed to create device" },
        500,
      );
    }
  },

  // PUT /api/devices/:id
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
          { success: false, error: "Invalid device ID" },
          400,
        );
      }

      const body: UpdateDeviceRequest = await request.json();
      const updates: string[] = [];
      const values: unknown[] = [];

      if (body.name !== undefined) {
        updates.push("name = ?");
        values.push(body.name.trim());
      }
      if (body.asset_tag !== undefined) {
        const assetTagUpper = body.asset_tag.toUpperCase();
        // Check for duplicate
        const existing = await db<Device[]>`
          SELECT id FROM devices WHERE asset_tag = ${assetTagUpper} AND id != ${id}
        `;
        if (existing.length > 0) {
          return jsonResponse(
            { success: false, error: "Asset tag already exists" },
            400,
          );
        }
        updates.push("asset_tag = ?");
        values.push(assetTagUpper.trim());
      }
      if (body.category !== undefined) {
        updates.push("category = ?");
        values.push(body.category);
      }
      if (body.brand !== undefined) {
        updates.push("brand = ?");
        values.push(body.brand.trim());
      }
      if (body.model !== undefined) {
        updates.push("model = ?");
        values.push(body.model.trim());
      }
      if (body.status !== undefined) {
        updates.push("status = ?");
        values.push(body.status);
      }
      if (body.department_id !== undefined) {
        updates.push("department_id = ?");
        values.push(body.department_id);
      }
      if (body.purchase_price !== undefined) {
        updates.push("purchase_price = ?");
        values.push(body.purchase_price);
      }
      if (body.purchase_date !== undefined) {
        updates.push("purchase_date = ?");
        values.push(body.purchase_date);
      }
      if (body.specs_json !== undefined) {
        updates.push("specs_json = ?");
        values.push(body.specs_json);
      }
      if (body.image_url !== undefined) {
        updates.push("image_url = ?");
        values.push(body.image_url);
      }

      if (updates.length === 0) {
        return jsonResponse(
          { success: false, error: "No fields to update" },
          400,
        );
      }

      // Get current device state for audit log
      const currentDevice =
        await db<DeviceWithDepartment[]>`SELECT * FROM v_device_details WHERE id = ${id}`;
      const beforeState = currentDevice[0]
        ? { ...currentDevice[0] }
        : undefined;

      values.push(id);
      await db.unsafe(
        `UPDATE devices SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );

      const updated =
        await db<DeviceWithDepartment[]>`SELECT * FROM v_device_details WHERE id = ${id}`;

      // Audit log
      await auditLogger.log({
        action: "update",
        objectType: "device",
        objectId: id,
        actor: auditLogger.createActorFromPayload(payload),
        changes: {
          before: beforeState,
          after: body as Record<string, unknown>,
        },
      });

      return jsonResponse({
        success: true,
        data: updated[0],
        message: "Device updated",
      });
    } catch (error) {
      console.error("Update device error:", error);
      return jsonResponse(
        { success: false, error: "Failed to update device" },
        500,
      );
    }
  },

  // DELETE /api/devices/:id
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
          { success: false, error: "Invalid device ID" },
          400,
        );
      }

      // Check for active borrow requests
      const activeRequests = await db<{ count: number }[]>`
        SELECT COUNT(*) as count FROM borrow_requests 
        WHERE device_id = ${id} AND status IN ('pending', 'approved', 'active')
      `;
      if (activeRequests[0].count > 0) {
        return jsonResponse(
          {
            success: false,
            error: "Cannot delete device with active borrow requests",
          },
          400,
        );
      }

      // Get device info for audit log before deletion
      const deviceToDelete =
        await db<DeviceWithDepartment[]>`SELECT * FROM v_device_details WHERE id = ${id}`;
      const deletedDevice = deviceToDelete[0]
        ? { ...deviceToDelete[0] }
        : undefined;

      await db`DELETE FROM devices WHERE id = ${id}`;

      // Audit log
      await auditLogger.log({
        action: "delete",
        objectType: "device",
        objectId: id,
        actor: auditLogger.createActorFromPayload(payload),
        changes: {
          before: deletedDevice,
        },
      });

      return jsonResponse({ success: true, message: "Device deleted" });
    } catch (error) {
      console.error("Delete device error:", error);
      return jsonResponse(
        { success: false, error: "Failed to delete device" },
        500,
      );
    }
  },

  // GET /api/devices/category/:category
  async getByCategory(
    request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      const category = params.category as DeviceCategory;
      const validCategories = [
        "laptop",
        "mobile",
        "tablet",
        "monitor",
        "accessories",
        "storage",
        "ram",
      ];

      if (!validCategories.includes(category)) {
        return jsonResponse({ success: false, error: "Invalid category" }, 400);
      }

      const devices = await db<DeviceWithDepartment[]>`
        SELECT * FROM v_device_details WHERE category = ${category} ORDER BY name
      `;

      const devicesWithSpecs = devices.map((e) => ({
        ...e,
        specs: e.specs_json
          ? typeof e.specs_json === "string"
            ? JSON.parse(e.specs_json)
            : e.specs_json
          : {},
      }));

      return jsonResponse({ success: true, data: devicesWithSpecs });
    } catch (error) {
      console.error("Get devices by category error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get devices" },
        500,
      );
    }
  },

  // GET /api/devices/status/:status
  async getByStatus(
    request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      const status = params.status as DeviceStatus;
      const validStatuses = ["available", "borrowed", "maintenance"];

      if (!validStatuses.includes(status)) {
        return jsonResponse({ success: false, error: "Invalid status" }, 400);
      }

      const devices = await db<DeviceWithDepartment[]>`
        SELECT * FROM v_device_details WHERE status = ${status} ORDER BY name
      `;

      const devicesWithSpecs = devices.map((e) => ({
        ...e,
        specs: e.specs_json
          ? typeof e.specs_json === "string"
            ? JSON.parse(e.specs_json)
            : e.specs_json
          : {},
      }));

      return jsonResponse({ success: true, data: devicesWithSpecs });
    } catch (error) {
      console.error("Get devices by status error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get devices" },
        500,
      );
    }
  },
};
