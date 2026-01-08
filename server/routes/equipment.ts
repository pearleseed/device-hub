import { db } from "../db/connection";
import { authenticateRequest, requireAdmin } from "../middleware/auth";
import type {
  Equipment,
  EquipmentWithDepartment,
  CreateEquipmentRequest,
  UpdateEquipmentRequest,
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

export const equipmentRoutes = {
  // GET /api/equipment
  async getAll(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const category = url.searchParams.get("category");
      const status = url.searchParams.get("status");
      const department_id = url.searchParams.get("department_id");
      const search = url.searchParams.get("search");

      // Build dynamic query with filters
      let sql = "SELECT * FROM v_equipment_details WHERE 1=1";
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

      sql += " ORDER BY name";

      const equipment = (await db.unsafe<EquipmentWithDepartment>(
        sql,
        params,
      )) as unknown as EquipmentWithDepartment[];

      // Parse JSON specs (handle both string and already-parsed object)
      const equipmentWithSpecs = equipment.map((e) => ({
        ...e,
        specs: e.specs_json
          ? typeof e.specs_json === "string"
            ? JSON.parse(e.specs_json)
            : e.specs_json
          : {},
      }));

      return jsonResponse({ success: true, data: equipmentWithSpecs });
    } catch (error) {
      console.error("Get equipment error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get equipment" },
        500,
      );
    }
  },

  // GET /api/equipment/:id
  async getById(
    request: Request,
    params: Record<string, string>,
  ): Promise<Response> {
    try {
      const id = parseInt(params.id);
      if (isNaN(id)) {
        return jsonResponse(
          { success: false, error: "Invalid equipment ID" },
          400,
        );
      }

      const equipment = (await db<EquipmentWithDepartment>`
        SELECT * FROM v_equipment_details WHERE id = ${id}
      `) as unknown as EquipmentWithDepartment[];

      if (equipment.length === 0) {
        return jsonResponse(
          { success: false, error: "Equipment not found" },
          404,
        );
      }

      // Parse JSON specs (handle both string and already-parsed object)
      const equipmentWithSpecs = {
        ...equipment[0],
        specs: equipment[0].specs_json
          ? typeof equipment[0].specs_json === "string"
            ? JSON.parse(equipment[0].specs_json)
            : equipment[0].specs_json
          : {},
      };

      return jsonResponse({ success: true, data: equipmentWithSpecs });
    } catch (error) {
      console.error("Get equipment error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get equipment" },
        500,
      );
    }
  },

  // POST /api/equipment
  async create(request: Request): Promise<Response> {
    try {
      const payload = await authenticateRequest(request);
      if (!payload || !requireAdmin(payload)) {
        return jsonResponse({ success: false, error: "Unauthorized" }, 401);
      }

      const body: CreateEquipmentRequest = await request.json();
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
      const existing =
        (await db<Equipment>`SELECT id FROM equipment WHERE asset_tag = ${assetTagUpper}`) as unknown as Equipment[];
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
        INSERT INTO equipment 
        (name, asset_tag, category, brand, model, department_id, purchase_price, purchase_date, specs_json, image_url)
        VALUES (${nameTrimmed}, ${assetTagTrimmed}, ${category}, ${brandTrimmed}, ${modelTrimmed}, 
                ${department_id}, ${purchase_price}, ${purchase_date}, ${specsValue}, ${imageValue})
      `;

      const newEquipment =
        await db<Equipment>`SELECT * FROM equipment WHERE asset_tag = ${assetTagUpper}`;

      return jsonResponse(
        { success: true, data: newEquipment[0], message: "Equipment created" },
        201,
      );
    } catch (error) {
      console.error("Create equipment error:", error);
      return jsonResponse(
        { success: false, error: "Failed to create equipment" },
        500,
      );
    }
  },

  // PUT /api/equipment/:id
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
          { success: false, error: "Invalid equipment ID" },
          400,
        );
      }

      const body: UpdateEquipmentRequest = await request.json();
      const updates: string[] = [];
      const values: unknown[] = [];

      if (body.name !== undefined) {
        updates.push("name = ?");
        values.push(body.name.trim());
      }
      if (body.asset_tag !== undefined) {
        const assetTagUpper = body.asset_tag.toUpperCase();
        // Check for duplicate
        const existing = (await db<Equipment>`
          SELECT id FROM equipment WHERE asset_tag = ${assetTagUpper} AND id != ${id}
        `) as unknown as Equipment[];
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

      values.push(id);
      await db.unsafe(
        `UPDATE equipment SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );

      const updated =
        await db<EquipmentWithDepartment>`SELECT * FROM v_equipment_details WHERE id = ${id}`;

      return jsonResponse({
        success: true,
        data: updated[0],
        message: "Equipment updated",
      });
    } catch (error) {
      console.error("Update equipment error:", error);
      return jsonResponse(
        { success: false, error: "Failed to update equipment" },
        500,
      );
    }
  },

  // DELETE /api/equipment/:id
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
          { success: false, error: "Invalid equipment ID" },
          400,
        );
      }

      // Check for active borrowing requests
      const activeRequests = await db<{ count: number }>`
        SELECT COUNT(*) as count FROM borrowing_requests 
        WHERE equipment_id = ${id} AND status IN ('pending', 'approved', 'active')
      `;
      if (activeRequests[0].count > 0) {
        return jsonResponse(
          {
            success: false,
            error: "Cannot delete equipment with active borrowing requests",
          },
          400,
        );
      }

      await db`DELETE FROM equipment WHERE id = ${id}`;
      return jsonResponse({ success: true, message: "Equipment deleted" });
    } catch (error) {
      console.error("Delete equipment error:", error);
      return jsonResponse(
        { success: false, error: "Failed to delete equipment" },
        500,
      );
    }
  },

  // GET /api/equipment/category/:category
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
      ];

      if (!validCategories.includes(category)) {
        return jsonResponse({ success: false, error: "Invalid category" }, 400);
      }

      const equipment = (await db<EquipmentWithDepartment>`
        SELECT * FROM v_equipment_details WHERE category = ${category} ORDER BY name
      `) as unknown as EquipmentWithDepartment[];

      const equipmentWithSpecs = equipment.map((e) => ({
        ...e,
        specs: e.specs_json
          ? typeof e.specs_json === "string"
            ? JSON.parse(e.specs_json)
            : e.specs_json
          : {},
      }));

      return jsonResponse({ success: true, data: equipmentWithSpecs });
    } catch (error) {
      console.error("Get equipment by category error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get equipment" },
        500,
      );
    }
  },

  // GET /api/equipment/status/:status
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

      const equipment = (await db<EquipmentWithDepartment>`
        SELECT * FROM v_equipment_details WHERE status = ${status} ORDER BY name
      `) as unknown as EquipmentWithDepartment[];

      const equipmentWithSpecs = equipment.map((e) => ({
        ...e,
        specs: e.specs_json
          ? typeof e.specs_json === "string"
            ? JSON.parse(e.specs_json)
            : e.specs_json
          : {},
      }));

      return jsonResponse({ success: true, data: equipmentWithSpecs });
    } catch (error) {
      console.error("Get equipment by status error:", error);
      return jsonResponse(
        { success: false, error: "Failed to get equipment" },
        500,
      );
    }
  },
};
