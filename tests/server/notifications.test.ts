
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { inAppNotificationsRoutes } from "../../server/routes/in-app-notifications";
import { db } from "../../server/db/connection";

// Mock dependencies
vi.mock("../../server/db/connection", () => ({
  db: vi.fn(),
}));

vi.mock("../../server/middleware/auth", () => ({
  authenticateRequest: vi.fn().mockResolvedValue({ userId: 1, role: "user" }),
}));

describe("inAppNotificationsRoutes.markAllAsRead", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should update all notifications to read for user", async () => {
        const req = new Request("http://localhost/api/in-app-notifications/read-all", {
            method: "PATCH",
        });

        const dbMock = db as unknown as Mock;
        dbMock.mockResolvedValue([]); // Update returns result

        const response = await inAppNotificationsRoutes.markAllAsRead(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        // Verify DB called with correct update query
        expect(dbMock).toHaveBeenCalledTimes(1);
        const call = dbMock.mock.calls[0];
        // Check if query contains expected SQL parts
        const query = call[0].join("?");
        expect(query).toContain("UPDATE notifications");
        expect(query).toContain("SET is_read = TRUE");
        expect(query).toContain("user_id =");
    });
});
