import { authRoutes } from "./routes/auth";
import { usersRoutes } from "./routes/users";
import { userImportExportRoutes } from "./routes/user-import-export";
import { departmentsRoutes } from "./routes/departments";
import { devicesRoutes } from "./routes/devices";
import { borrowRoutes } from "./routes/borrow";
import { returnsRoutes } from "./routes/returns";
import { renewalsRoutes } from "./routes/renewals";
// import { notificationsRoutes } from "./routes/notifications";
// import { slashCommandsRoutes } from "./routes/slash-commands";
import { avatarsRoutes } from "./routes/avatars";
import { auditRoutes } from "./routes/audit";
import { inAppNotificationsRoutes } from "./routes/in-app-notifications";
import { closeConnection, getPoolStatus, logDbConfig } from "./db/connection";
// Mattermost disabled for testing
// import {
//   initializeNotificationService,
//   shutdownNotificationService,
//   validateConfig,
//   startSessionCleanup,
//   stopSessionCleanup,
// } from "./mattermost";

const PORT = process.env.PORT || 3001;

// Allow all local/private network origins (HTTPS only)
function isAllowedOrigin(origin?: string): boolean {
  if (!origin) return false;
  // Match: https://localhost, https://127.x.x.x, https://10.x.x.x, https://192.168.x.x, https://172.16-31.x.x
  return /^https:\/\/(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(
    origin,
  );
}

// ============================================================================
// Port Cleanup
// ============================================================================

/**
 * Kill any process using the specified port before starting the server
 */
async function killPortProcess(port: number | string): Promise<void> {
  try {
    const result = Bun.spawnSync(["lsof", "-ti", `:${port}`]);
    const pids = new TextDecoder().decode(result.stdout).trim();

    if (pids) {
      console.log(
        `⚠️  Port ${port} is in use by PID(s): ${pids.replace(/\n/g, ", ")}`,
      );
      console.log(`🔄 Killing process(es)...`);

      for (const pid of pids.split("\n")) {
        if (pid) {
          Bun.spawnSync(["kill", "-9", pid]);
        }
      }

      // Wait a moment for the port to be released
      await Bun.sleep(500);
      console.log(`✅ Port ${port} is now free`);
    }
  } catch (error) {
    // Ignore errors - port might already be free
  }
}

// Kill any existing process on the port before starting
await killPortProcess(PORT);

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
    // Mattermost disabled for testing
    // shutdownNotificationService();
    // stopSessionCleanup();

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

// CORS headers - auto-allow private network origins
function corsHeaders(origin?: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin)
      ? origin!
      : "https://localhost:8080",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

// JSON response helper
function jsonResponse(data: unknown, status = 200, origin?: string): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });
}

// Error response helper
function errorResponse(
  message: string,
  status = 400,
  origin?: string,
): Response {
  return jsonResponse({ success: false, error: message }, status, origin);
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
  addRoute("POST", "/api/auth/change-password", authRoutes.changePassword);

  // Users routes
  addRoute("GET", "/api/users", usersRoutes.getAll);
  addRoute("GET", "/api/users/:id", usersRoutes.getById);
  addRoute("PUT", "/api/users/:id", usersRoutes.update);
  addRoute("PATCH", "/api/users/:id/password", usersRoutes.resetPassword);
  addRoute("PATCH", "/api/users/:id/status", usersRoutes.toggleStatus);
  addRoute("DELETE", "/api/users/:id", usersRoutes.delete);

  // User Import/Export routes
  addRoute("POST", "/api/users/import", userImportExportRoutes.importUsers);
  addRoute("GET", "/api/users/export", userImportExportRoutes.exportUsers);
  addRoute(
    "GET",
    "/api/users/export/admin",
    userImportExportRoutes.exportUsersAdmin,
  );
  addRoute(
    "GET",
    "/api/users/import/template",
    userImportExportRoutes.getTemplate,
  );
  addRoute(
    "POST",
    "/api/users/export/clear-passwords",
    userImportExportRoutes.clearPasswords,
  );

  // Departments routes
  addRoute("GET", "/api/departments/names", departmentsRoutes.getNames);
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

  // Renewal request routes
  addRoute("GET", "/api/renewals", renewalsRoutes.getAll);
  addRoute("GET", "/api/renewals/:id", renewalsRoutes.getById);
  addRoute("POST", "/api/renewals", renewalsRoutes.create);
  addRoute("PATCH", "/api/renewals/:id/status", renewalsRoutes.updateStatus);
  addRoute(
    "GET",
    "/api/renewals/borrow/:borrowId",
    renewalsRoutes.getByBorrowRequest,
  );
  addRoute("GET", "/api/renewals/status/:status", renewalsRoutes.getByStatus);

  // Notification routes (Mattermost) - disabled for testing
  // addRoute("POST", "/api/notifications/send", notificationsRoutes.send);
  // addRoute("GET", "/api/notifications/status", notificationsRoutes.status);
  // addRoute("GET", "/api/notifications/users", notificationsRoutes.users);
  // addRoute("GET", "/api/notifications/idempotency", notificationsRoutes.idempotency);
  // addRoute("POST", "/api/notifications/initialize", notificationsRoutes.initialize);

  // Mattermost Slash Commands routes - disabled for testing
  // addRoute("POST", "/api/mattermost/command", slashCommandsRoutes.command);
  // addRoute("POST", "/api/mattermost/interactive", slashCommandsRoutes.interactive);
  // addRoute("POST", "/api/mattermost/text-input", slashCommandsRoutes.textInput);
  // addRoute("GET", "/api/mattermost/sessions", slashCommandsRoutes.sessions);

  // Avatar routes
  addRoute("POST", "/api/avatars/user/:userId", avatarsRoutes.uploadUserAvatar);
  addRoute(
    "POST",
    "/api/avatars/device/:deviceId",
    avatarsRoutes.uploadDeviceAvatar,
  );
  addRoute(
    "DELETE",
    "/api/avatars/user/:userId",
    avatarsRoutes.deleteUserAvatar,
  );
  addRoute(
    "DELETE",
    "/api/avatars/device/:deviceId",
    avatarsRoutes.deleteDeviceAvatar,
  );

  // Audit log routes
  addRoute("GET", "/api/audit", auditRoutes.getLogs);
  addRoute("GET", "/api/audit/object/:type/:id", auditRoutes.getByObject);

  // In-App Notification routes
  addRoute("GET", "/api/in-app-notifications", inAppNotificationsRoutes.getAll);
  addRoute("GET", "/api/in-app-notifications/unread-count", inAppNotificationsRoutes.getUnreadCount);
  addRoute("PATCH", "/api/in-app-notifications/read-all", inAppNotificationsRoutes.markAllAsRead);
  addRoute("DELETE", "/api/in-app-notifications/clear", inAppNotificationsRoutes.clearAll);
  addRoute("POST", "/api/in-app-notifications", inAppNotificationsRoutes.create);
  addRoute("PATCH", "/api/in-app-notifications/:id/read", inAppNotificationsRoutes.markAsRead);
  addRoute("DELETE", "/api/in-app-notifications/:id", inAppNotificationsRoutes.delete);
}

// Initialize routes
registerRoutes();

// ============================================================================
// Server
// ============================================================================

// Main server
const server = Bun.serve({
  hostname: "0.0.0.0",
  port: PORT,
  async fetch(request: Request): Promise<Response> {
    // Reject new requests if shutting down
    if (isShuttingDown) {
      return errorResponse("Server is shutting down", 503);
    }

    const url = new URL(request.url);
    const method = request.method;
    const pathname = url.pathname;
    const origin = request.headers.get("origin") || undefined;

    // Handle CORS preflight
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
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
          Object.entries(corsHeaders(origin)).forEach(([key, value]) => {
            newHeaders.set(key, value);
          });
          return new Response(response.body, {
            status: response.status,
            headers: newHeaders,
          });
        } catch (error) {
          console.error("Route handler error:", error);
          return errorResponse("Internal server error", 500, origin);
        }
      }
    }

    // 404 for unmatched routes
    return errorResponse("Not found", 404, origin);
  },
});

// Get local IP address for network access
function getLocalIP(): string {
  try {
    const result = Bun.spawnSync(["hostname", "-I"]);
    const ips = new TextDecoder().decode(result.stdout).trim();
    if (ips) {
      return ips.split(" ")[0];
    }
  } catch {
    // Fallback for macOS
    try {
      const result = Bun.spawnSync(["ipconfig", "getifaddr", "en0"]);
      const ip = new TextDecoder().decode(result.stdout).trim();
      if (ip) return ip;
    } catch {
      // Ignore
    }
  }
  return "localhost";
}

// Log startup info
const localIP = getLocalIP();
console.log(`🚀 Server running at:`);
console.log(`   Local:   http://localhost:${server.port}`);
console.log(`   Network: http://${localIP}:${server.port}`);
console.log(`   CORS:    All private networks (HTTPS only)`);
logDbConfig();

// Mattermost disabled for testing
// const mattermostConfig = validateConfig();
// if (mattermostConfig.valid) {
//   initializeNotificationService().then((success) => {
//     if (success) {
//       console.log("📬 Mattermost notification service ready");
//     }
//   });
//   // Start session cleanup for slash commands
//   startSessionCleanup();
//   console.log("💬 Mattermost slash commands ready");
// } else {
//   console.log(
//     `⚠️  Mattermost not configured (missing: ${mattermostConfig.missing.join(", ")})`
//   );
//   console.log("   Set environment variables to enable notifications");
// }
