import { db } from "../db/connection";
import { requireAdmin } from "../middleware/auth";
import { auditLogger } from "../services/audit-logger";
import { ok, created, err, notFound, forbidden, parseId, withAuth, withAdmin } from "./_helpers";
import type { Device, DeviceWithDepartment, CreateDeviceRequest, UpdateDeviceRequest, DeviceCategory, DeviceStatus } from "../types";

// Allowed values for categories and statuses
const VALID_CATEGORIES = ["laptop", "mobile", "tablet", "monitor", "accessories", "storage", "ram"];
const VALID_STATUSES = ["available", "inuse", "maintenance", "updating", "storage", "discard", "transferred"];

export const devicesRoutes = {
  /**
   * GET /api/devices
   * Search and filter devices.
   */
  async getAll(request: Request): Promise<Response> {
    return withAuth(request, async () => {
      const url = new URL(request.url);
      const { category, status, department_id, search, min_price, max_price, price_field } = Object.fromEntries(url.searchParams);

      let sql = "SELECT * FROM v_device_details WHERE 1=1";
      const params: unknown[] = [];

      // Dynamic Query Building
      if (category) { sql += " AND category = ?"; params.push(category); }
      if (status) { sql += " AND status = ?"; params.push(status); }
      if (department_id) { sql += " AND department_id = ?"; params.push(+department_id); }
      if (search) {
        // Multi-column search
        sql += " AND (name LIKE ? OR asset_tag LIKE ? OR brand LIKE ? OR model LIKE ?)";
        const term = `%${search}%`;
        params.push(term, term, term, term);
      }
      // Price range filtering
      const priceCol = price_field === "selling_price" ? "selling_price" : "purchase_price";
      if (min_price) { sql += ` AND ${priceCol} >= ?`; params.push(+min_price); }
      if (max_price) { sql += ` AND ${priceCol} < ?`; params.push(+max_price); }
      sql += " ORDER BY name";

      const devices = await db.unsafe<DeviceWithDepartment[]>(sql, params);
      return ok(devices);
    });
  },

  /**
   * GET /api/devices/:id
   * Get detailed information for a specific device.
   */
  async getById(request: Request, params: Record<string, string>): Promise<Response> {
    return withAuth(request, async () => {
      const id = parseId(params.id);
      if (!id) return err("Invalid device ID");
      const [device] = await db<DeviceWithDepartment[]>`SELECT * FROM v_device_details WHERE id = ${id}`;
      return device ? ok(device) : notFound("Device");
    });
  },

  /**
   * POST /api/devices
   * Create a new device.
   * Access: Admin only.
   */
  async create(request: Request): Promise<Response> {
    return withAdmin(request, async (payload) => {
      const body: CreateDeviceRequest = await request.json();
      const { name, asset_tag, category, brand, model, department_id, purchase_price, purchase_date, specs_json, notes, image_url } = body;

      if (!name?.trim()) return err("Name is required");
      if (!asset_tag?.trim()) return err("Asset tag is required");
      if (!category) return err("Category is required");
      if (!brand?.trim()) return err("Brand is required");
      if (!model?.trim()) return err("Model is required");
      if (!department_id) return err("Department is required");
      if (purchase_price === undefined || purchase_price < 0) return err("Valid purchase price is required");
      if (!purchase_date) return err("Purchase date is required");

      const assetTagUpper = asset_tag.toUpperCase().trim();
      const [existing] = await db<Device[]>`SELECT id FROM devices WHERE asset_tag = ${assetTagUpper}`;
      if (existing) return err("Asset tag already exists");

      await db`INSERT INTO devices (name, asset_tag, category, brand, model, department_id, purchase_price, purchase_date, specs_json, notes, image_url)
               VALUES (${name.trim()}, ${assetTagUpper}, ${category}, ${brand.trim()}, ${model.trim()}, ${department_id}, ${purchase_price}, ${purchase_date}, ${specs_json || "{}"}, ${notes || null}, ${image_url || ""})`;

      const [newDevice] = await db<Device[]>`SELECT * FROM devices WHERE asset_tag = ${assetTagUpper}`;

      await auditLogger.log({
        action: "create", objectType: "device", objectId: newDevice.id,
        actor: auditLogger.createActorFromPayload(payload),
        changes: { after: { name: name.trim(), asset_tag: assetTagUpper, category, brand: brand.trim(), model: model.trim(), department_id, purchase_price, purchase_date } },
      });

      return created(newDevice, "Device created");
    });
  },

  /**
   * PUT /api/devices/:id
   * Update device details.
   * Access: Admin only.
   */
  async update(request: Request, params: Record<string, string>): Promise<Response> {
    return withAdmin(request, async (payload) => {
      const id = parseId(params.id);
      if (!id) return err("Invalid device ID");

      const body: UpdateDeviceRequest = await request.json();
      const updates: string[] = [], values: unknown[] = [];

      if (body.name !== undefined) { updates.push("name = ?"); values.push(body.name.trim()); }
      if (body.asset_tag !== undefined) {
        const tag = body.asset_tag.toUpperCase().trim();
        const [dup] = await db<Device[]>`SELECT id FROM devices WHERE asset_tag = ${tag} AND id != ${id}`;
        if (dup) return err("Asset tag already exists");
        updates.push("asset_tag = ?"); values.push(tag);
      }
      if (body.category !== undefined) { updates.push("category = ?"); values.push(body.category); }
      if (body.brand !== undefined) { updates.push("brand = ?"); values.push(body.brand.trim()); }
      if (body.model !== undefined) { updates.push("model = ?"); values.push(body.model.trim()); }
      if (body.status !== undefined) { updates.push("status = ?"); values.push(body.status); }
      if (body.department_id !== undefined) { updates.push("department_id = ?"); values.push(body.department_id); }
      if (body.purchase_price !== undefined) { updates.push("purchase_price = ?"); values.push(body.purchase_price); }
      if (body.purchase_date !== undefined) { updates.push("purchase_date = ?"); values.push(body.purchase_date); }
      if (body.specs_json !== undefined) { updates.push("specs_json = ?"); values.push(body.specs_json); }
      if (body.image_url !== undefined) { updates.push("image_url = ?"); values.push(body.image_url); }
      if (body.notes !== undefined) { updates.push("notes = ?"); values.push(body.notes); }

      if (!updates.length) return err("No fields to update");

      const [before] = await db<DeviceWithDepartment[]>`SELECT * FROM v_device_details WHERE id = ${id}`;
      values.push(id);
      await db.unsafe(`UPDATE devices SET ${updates.join(", ")} WHERE id = ?`, values);
      const [updated] = await db<DeviceWithDepartment[]>`SELECT * FROM v_device_details WHERE id = ${id}`;

      await auditLogger.log({
        action: "update", objectType: "device", objectId: id,
        actor: auditLogger.createActorFromPayload(payload),
        changes: { before: before ? { ...before } : undefined, after: body as Record<string, unknown> },
      });

      return ok(updated, "Device updated");
    });
  },

  /**
   * DELETE /api/devices/:id
   * Soft delete or hard delete a device. A device can only be deleted if it has no active/pending related records.
   * Access: Admin.
   */
  async delete(request: Request, params: Record<string, string>): Promise<Response> {
    return withAdmin(request, async (payload) => {
      const id = parseId(params.id);
      if (!id) return err("Invalid device ID");

      // Integrity Check: Do not delete devices that are currently borrowed
      const [active] = await db<{ count: number }[]>`
        SELECT COUNT(*) as count FROM borrow_requests WHERE device_id = ${id} AND status IN ('pending', 'approved', 'active')`;
      if (active.count > 0) return err("Cannot delete device with active borrow requests");

      const [before] = await db<DeviceWithDepartment[]>`SELECT * FROM v_device_details WHERE id = ${id}`;
      await db`DELETE FROM devices WHERE id = ${id}`;

      await auditLogger.log({
        action: "delete", objectType: "device", objectId: id,
        actor: auditLogger.createActorFromPayload(payload),
        changes: { before: before ? { ...before } : undefined },
      });

      return ok(null, "Device deleted");
    });
  },

  /**
   * GET /api/devices/category/:category
   * Get all devices in a specific category.
   */
  async getByCategory(request: Request, params: Record<string, string>): Promise<Response> {
    return withAuth(request, async () => {
      const category = params.category as DeviceCategory;
      if (!VALID_CATEGORIES.includes(category)) return err("Invalid category");
      const devices = await db<DeviceWithDepartment[]>`SELECT * FROM v_device_details WHERE category = ${category} ORDER BY name`;
      return ok(devices);
    });
  },

  /**
   * GET /api/devices/status/:status
   * Get all devices with a specific status.
   */
  async getByStatus(request: Request, params: Record<string, string>): Promise<Response> {
    return withAuth(request, async () => {
      const status = params.status as DeviceStatus;
      if (!VALID_STATUSES.includes(status)) return err("Invalid status");
      const devices = await db<DeviceWithDepartment[]>`SELECT * FROM v_device_details WHERE status = ${status} ORDER BY name`;
      return ok(devices);
    });
  },

  /**
   * GET /api/devices/pending/ids
   * Get IDs of devices that have pending or approved borrow requests.
   * Used for frontend availability checking.
   */
  async getPendingDeviceIds(request: Request): Promise<Response> {
    return withAuth(request, async () => {
      const results = await db<{ device_id: number }[]>`
        SELECT DISTINCT device_id FROM borrow_requests WHERE status IN ('pending', 'approved')`;
      const deviceIds = results.map(r => r.device_id);
      return ok(deviceIds);
    });
  },
};
