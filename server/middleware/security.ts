import type { JWTPayload } from "../types";

// Simple in-memory rate limiter
// In a distributed environment, use Redis or similar instead
const rateLimit = new Map<string, { count: number; reset: number }>();
const LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // Limit per IP per minute

/**
 * Middleware to enforce rate limiting based on IP address.
 * @param req The incoming request
 * @returns Response if blocked (429), null if allowed
 */
export function securityMiddleware(req: Request): Response | null {
  // 1. Rate Limiting
  // Note: x-forwarded-for handling is naive here, should validate trusted proxies in prod
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  
  if (ip !== "unknown") {
    const now = Date.now();
    const record = rateLimit.get(ip);
    
    if (record && now < record.reset) {
      if (record.count >= MAX_REQUESTS) {
        return new Response(JSON.stringify({ success: false, error: "Too many requests" }), {
          status: 429,
          headers: { "Content-Type": "application/json" }
        });
      }
      record.count++;
    } else {
      rateLimit.set(ip, { count: 1, reset: now + LIMIT_WINDOW });
    }
  }

  // Clean up old entries periodically to prevent memory leaks
  if (rateLimit.size > 1000) {
    const now = Date.now();
    for (const [key, val] of rateLimit) {
      if (now > val.reset) rateLimit.delete(key);
    }
  }

  return null; // Continue processing
}

/**
 * Adds standard security headers to every response.
 * Follows OWASP recommendations.
 */
export function addSecurityHeaders(res: Response): void {
  const h = res.headers;
  h.set("X-Content-Type-Options", "nosniff");
  h.set("X-Frame-Options", "DENY");
  h.set("X-XSS-Protection", "1; mode=block");
  // Limit referrer info leakage
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // CSP: Allow only self and specific sources (customize as needed)
  h.set("Content-Security-Policy", "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' http: https: ws:;");
  // HSTS: Force HTTPS for 1 year (only effective if served over HTTPS)
  h.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
}
