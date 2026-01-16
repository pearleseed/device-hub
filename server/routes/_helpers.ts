/**
 * Shared route helpers to reduce boilerplate and enforce DRY (Don't Repeat Yourself).
 * Includes standard response configurations, common auth checks, and validation utils.
 */
import { authenticateRequest, requireAdmin } from "../middleware/auth";
import type { JWTPayload } from "../types";

// JSON response helper
/**
 * Creates a JSON response with the given data, status, and headers.
 */
export const json = (data: unknown, status = 200, headers: HeadersInit = {}): Response =>
  new Response(JSON.stringify(data), { 
    status, 
    headers: { 
      "Content-Type": "application/json",
      ...headers
    } 
  });

// Standardized JSON response helper
/**
 * Returns a 200 OK JSON response with success: true.
 */
export const ok = <T>(data: T, message?: string) => json({ success: true, data, message });
/**
 * Returns a 201 Created JSON response with success: true.
 */
export const created = <T>(data: T, message?: string) => json({ success: true, data, message }, 201);
/**
 * Returns a 400 Bad Request (or specified status) JSON response with success: false.
 */
export const err = (error: string, status = 400) => json({ success: false, error }, status);

// Standard HTTP Error shortcuts
/**
 * Returns a 401 Unauthorized response.
 */
export const unauthorized = () => err("Unauthorized", 401);
/**
 * Returns a 403 Forbidden response.
 */
export const forbidden = (msg = "Forbidden") => err(msg, 403);
/**
 * Returns a 404 Not Found response.
 */
export const notFound = (entity: string) => err(`${entity} not found`, 404);

// Validation helpers
/**
 * Parses a string ID into a number, returning null if invalid.
 */
export const parseId = (id: string): number | null => {
  const n = parseInt(id);
  return isNaN(n) ? null : n;
};

/**
 * Validates a required field, returning an error message if missing or empty.
 */
export const requireField = (val: unknown, name: string): string | null =>
  !val || (typeof val === "string" && !val.trim()) ? `${name} is required` : null;

/**
 * Higher-order function for authenticated routes.
 * Wraps the route handler logic, ensuring the user is authenticated before proceeding.
 * Returns 401 Unauthorized immediately if authentication fails.
 */
export async function withAuth(
  request: Request,
  handler: (payload: JWTPayload) => Promise<Response>
): Promise<Response> {
  const result = await authenticateRequest(request);
  // If result is a Response (e.g. error), return it
  if (result instanceof Response) return result;
  if (!result) return unauthorized();
  return handler(result);
}

/**
 * Higher-order function for ADMIN-only routes.
 * Extends withAuth by also checking if the user has 'admin' or 'superuser' role.
 * Returns 403 Forbidden if the user exists but lacks permissions.
 */
export async function withAdmin(
  request: Request,
  handler: (payload: JWTPayload) => Promise<Response>
): Promise<Response> {
  const result = await authenticateRequest(request);
  if (result instanceof Response) return result;
  if (!result) return unauthorized();
  if (!requireAdmin(result)) return forbidden("Admin access required");
  return handler(result);
}

/**
 * Higher-order function for SUPERUSER-only routes.
 * Checks if the user is authenticated and has the 'superuser' role.
 */
export async function withSuperuser(
  request: Request,
  handler: (payload: JWTPayload) => Promise<Response>
): Promise<Response> {
  const result = await authenticateRequest(request);
  if (result instanceof Response) return result;
  if (!result) return unauthorized();
  if (result.role !== "superuser") return forbidden("Superuser access required");
  return handler(result);
}

// CSV response helper
/**
 * Creates a CSV file download response.
 */
export const csvResponse = (content: string, filename: string): Response =>
  new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
