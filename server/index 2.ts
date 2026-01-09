import { authRoutes } from "./routes/auth";
import { usersRoutes } from "./routes/users";
import { departmentsRoutes } from "./routes/departments";
import { devicesRoutes } from "./routes/devices";
import { borrowRoutes } from "./routes/borrow";
import { returnsRoutes } from "./routes/returns";
import { closeConnection, getPoolStatus, logDbConfig } from "./db/connection";

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:8080";

// ============================================================================
// Graceful Shutdown
// ============================================================================

let isShuttingDown = false;

/**
 * Handle graceful shutdown on process termination signals
 */
async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    console.log("Shutdown already in progress...");
    return;
  }

  isShuttingDown = true;
  console.log(`\nReceived ${signal}, shutting down gracefully...`);

  try {
    // Close database connections
    await closeConnection();
    console.log("All connections closed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
}

// Register shutdown handlers
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  gracefulShutdown("uncaughtException");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled rejection at:", promise, "reason:", reason);
});

// ============================================================================
// CORS & Response Helpers
// ============================================================================

// CORS headers
function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": CORS_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

// JSON response helper
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}

// Error response helper
function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ success: false, error: message }, status);
}

// ============================================================================
// Router
// ============================================================================

// Route handler type
type RouteHandler = (
  request: Request,
  params: Record<string, string>,
) => Promise<Response>;

// Simple router
interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

const routes: Route[] = [];

function addRoute(method: string, path: string, handler: RouteHandler): void {
  // Convert path pattern to regex
  const paramNames: string[] = [];
  const pattern = path.replace(/:([^/]+)/g, (_, paramName) => {
    paramNames.push(paramName);
    return "([^/]+)";
  });
  routes.push({
    method,
    pattern: new RegExp(`^${pattern}$`),
    paramNames,
    handler,
  });
}

// ============================================================================
// Route Registration
// ============================================================================

// Register all routes
function registerRoutes(): void {
  // Health check with database pool status
  addRoute("GET", "/api/health", async () => {
    try {
      const dbHealth = await getPoolStatus();
      return jsonResponse({
        status: dbHealth.healthy ? "ok" : "degraded",
        timestamp: new Date().toISOString(),
        database: {
          healthy: dbHealth.healthy,
          pool: {
            active: dbHealth.active,
            idle: dbHealth.idle,
            total: dbHealth.total,
          },
        },
      });
    } catch (error) {
      console.error("Health check error:", error);
      return jsonResponse(
        {
          status: "error",
          timestamp: new Date().toISOString(),
          database: {
            healthy: false,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        },
        503,
      );
    }
  });

  // Readiness check (for container orchestration)
  addRoute("GET", "/api/ready", async () => {
    try {
      const dbHealth = await getPoolStatus();
      if (dbHealth.healthy) {
        return jsonResponse({ ready: true });
      }
      return jsonResponse(
        { ready: false, reason: "Database unavailable" },
        503,
      );
    } catch {
      return jsonResponse({ ready: false, reason: "Health check failed" }, 503);
    }
  });

  // Liveness check (for container orchestration)
  addRoute("GET", "/api/live", async () => {
    return jsonResponse({ live: true });
  });

  // Auth routes
  addRoute("POST", "/api/auth/login", authRoutes.login);
  addRoute("POST", "/api/auth/signup", authRoutes.signup);
  addRoute("GET", "/api/auth/me", authRoutes.me);

  // Users routes
  addRoute("GET", "/api/users", usersRoutes.getAll);
  addRoute("GET", "/api/users/:id", usersRoutes.getById);
  addRoute("PUT", "/api/users/:id", usersRoutes.update);
  addRoute("DELETE", "/api/users/:id", usersRoutes.delete);

  // Departments routes
  addRoute("GET", "/api/departments", departmentsRoutes.getAll);
  addRoute("GET", "/api/departments/:id", departmentsRoutes.getById);
  addRoute("POST", "/api/departments", departmentsRoutes.create);
  addRoute("PUT", "/api/departments/:id", departmentsRoutes.update);
  addRoute("DELETE", "/api/departments/:id", departmentsRoutes.delete);

  // Devices routes
  addRoute("GET", "/api/devices", devicesRoutes.getAll);
  addRoute("GET", "/api/devices/:id", devicesRoutes.getById);
  addRoute("POST", "/api/devices", devicesRoutes.create);
  addRoute("PUT", "/api/devices/:id", devicesRoutes.update);
  addRoute("DELETE", "/api/devices/:id", devicesRoutes.delete);
  addRoute(
    "GET",
    "/api/devices/category/:category",
    devicesRoutes.getByCategory,
  );
  addRoute("GET", "/api/devices/status/:status", devicesRoutes.getByStatus);

  // Borrow request routes
  addRoute("GET", "/api/borrow", borrowRoutes.getAll);
  addRoute("GET", "/api/borrow/:id", borrowRoutes.getById);
  addRoute("POST", "/api/borrow", borrowRoutes.create);
  addRoute("PATCH", "/api/borrow/:id/status", borrowRoutes.updateStatus);
  addRoute("GET", "/api/borrow/user/:userId", borrowRoutes.getByUser);
  addRoute("GET", "/api/borrow/status/:status", borrowRoutes.getByStatus);

  // Return request routes
  addRoute("GET", "/api/returns", returnsRoutes.getAll);
  addRoute("GET", "/api/returns/:id", returnsRoutes.getById);
  addRoute("POST", "/api/returns", returnsRoutes.create);
}

// Initialize routes
registerRoutes();

// ============================================================================
// Server
// ============================================================================

// Main server
const server = Bun.serve({
  port: PORT,
  async fetch(request: Request): Promise<Response> {
    // Reject new requests if shutting down
    if (isShuttingDown) {
      return errorResponse("Server is shutting down", 503);
    }

    const url = new URL(request.url);
    const method = request.method;
    const pathname = url.pathname;

    // Handle CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    // Find matching route
    for (const route of routes) {
      if (route.method !== method) continue;

      const match = pathname.match(route.pattern);
      if (match) {
        const params: Record<string, string> = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        try {
          const response = await route.handler(request, params);
          // Add CORS headers to response
          const newHeaders = new Headers(response.headers);
          Object.entries(corsHeaders()).forEach(([key, value]) => {
            newHeaders.set(key, value);
          });
          return new Response(response.body, {
            status: response.status,
            headers: newHeaders,
          });
        } catch (error) {
          console.error("Route handler error:", error);
          return errorResponse("Internal server error", 500);
        }
      }
    }

    // 404 for unmatched routes
    return errorResponse("Not found", 404);
  },
});

// Log startup info
console.log(`🚀 Server running at http://localhost:${server.port}`);
logDbConfig();
