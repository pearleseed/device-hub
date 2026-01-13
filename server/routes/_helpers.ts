/**
 * Shared route helpers - DRY principle
 */
import { authenticateRequest, requireAdmin } from "../middleware/auth";
import type { JWTPayload } from "../types";

// JSON response helper
export const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });

export const ok = <T>(data: T, message?: string) => json({ success: true, data, message });
export const created = <T>(data: T, message?: string) => json({ success: true, data, message }, 201);
export const err = (error: string, status = 400) => json({ success: false, error }, status);

// Auth helpers
export const unauthorized = () => err("Unauthorized", 401);
export const forbidden = (msg = "Forbidden") => err(msg, 403);
export const notFound = (entity: string) => err(`${entity} not found`, 404);

// Validation helpers
export const parseId = (id: string): number | null => {
  const n = parseInt(id);
  return isNaN(n) ? null : n;
};

export const requireField = (val: unknown, name: string): string | null =>
  !val || (typeof val === "string" && !val.trim()) ? `${name} is required` : null;

// Auth wrapper - reduces boilerplate in routes
export async function withAuth(
  request: Request,
  handler: (payload: JWTPayload) => Promise<Response>
): Promise<Response> {
  const payload = await authenticateRequest(request);
  if (!payload) return unauthorized();
  return handler(payload);
}

export async function withAdmin(
  request: Request,
  handler: (payload: JWTPayload) => Promise<Response>
): Promise<Response> {
  const payload = await authenticateRequest(request);
  if (!payload) return unauthorized();
  if (!requireAdmin(payload)) return forbidden("Admin access required");
  return handler(payload);
}

export async function withSuperuser(
  request: Request,
  handler: (payload: JWTPayload) => Promise<Response>
): Promise<Response> {
  const payload = await authenticateRequest(request);
  if (!payload) return unauthorized();
  if (payload.role !== "superuser") return forbidden("Superuser access required");
  return handler(payload);
}

// CSV response helper
export const csvResponse = (content: string, filename: string): Response =>
  new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
