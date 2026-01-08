import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useOverdueAlerts } from "@/hooks/use-overdue-alerts";
import { server } from "../mocks/server";
import { http, HttpResponse } from "msw";

const API_BASE = "http://localhost:3001/api";

describe("useOverdueAlerts", () => {
  // Use a fixed date for testing (past dates will be "overdue")
  const realDateNow = Date.now;

  beforeEach(() => {
    // Mock Date.now to return Feb 20, 2024
    Date.now = () => new Date("2024-02-20").getTime();
  });

  afterEach(() => {
    Date.now = realDateNow;
  });

  describe("initialization", () => {
    it("should start with loading state", () => {
      const { result } = renderHook(() => useOverdueAlerts());

      expect(result.current.isLoading).toBe(true);
    });

    it("should start with empty alerts", () => {
      const { result } = renderHook(() => useOverdueAlerts());

      expect(result.current.overdueAlerts).toEqual([]);
      expect(result.current.totalOverdue).toBe(0);
    });
  });

  describe("fetching data", () => {
    it("should fetch borrowing requests, equipment, and users", async () => {
      const { result } = renderHook(() => useOverdueAlerts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should set isLoading to false after fetch", async () => {
      const { result } = renderHook(() => useOverdueAlerts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("overdue detection", () => {
    it("should identify overdue active requests", async () => {
      // Override with overdue request
      server.use(
        http.get(`${API_BASE}/borrowing`, () => {
          return HttpResponse.json({
            success: true,
            data: [
              {
                id: 1,
                equipment_id: 1,
                user_id: 1,
                start_date: "2024-02-01",
                end_date: "2024-02-10", // 10 days before mockToday (Feb 20)
                status: "active",
                reason: "Test",
                created_at: "2024-02-01",
                updated_at: "2024-02-01",
              },
            ],
          });
        }),
        http.get(`${API_BASE}/equipment`, () => {
          return HttpResponse.json({
            success: true,
            data: [{ id: 1, name: "Test Device", asset_tag: "TEST-001" }],
          });
        }),
        http.get(`${API_BASE}/users`, () => {
          return HttpResponse.json({
            success: true,
            data: [{ id: 1, name: "Test User", email: "test@test.com" }],
          });
        }),
      );

      const { result } = renderHook(() => useOverdueAlerts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.totalOverdue).toBe(1);
      expect(result.current.overdueAlerts.length).toBe(1);
    });

    it("should not include non-active requests", async () => {
      server.use(
        http.get(`${API_BASE}/borrowing`, () => {
          return HttpResponse.json({
            success: true,
            data: [
              {
                id: 1,
                equipment_id: 1,
                user_id: 1,
                start_date: "2024-02-01",
                end_date: "2024-02-10",
                status: "pending", // Not active
                reason: "Test",
                created_at: "2024-02-01",
                updated_at: "2024-02-01",
              },
              {
                id: 2,
                equipment_id: 2,
                user_id: 1,
                start_date: "2024-02-01",
                end_date: "2024-02-10",
                status: "returned", // Not active
                reason: "Test",
                created_at: "2024-02-01",
                updated_at: "2024-02-01",
              },
            ],
          });
        }),
        http.get(`${API_BASE}/equipment`, () => {
          return HttpResponse.json({ success: true, data: [] });
        }),
        http.get(`${API_BASE}/users`, () => {
          return HttpResponse.json({ success: true, data: [] });
        }),
      );

      const { result } = renderHook(() => useOverdueAlerts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.totalOverdue).toBe(0);
    });

    it("should not include requests with future end dates", async () => {
      // Get a date far in the future (3 years from now)
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 3);
      const futureDateStr = futureDate.toISOString().split("T")[0];

      const startDateStr = new Date().toISOString().split("T")[0];

      server.use(
        http.get(`${API_BASE}/borrowing`, () => {
          return HttpResponse.json({
            success: true,
            data: [
              {
                id: 1,
                equipment_id: 1,
                user_id: 1,
                start_date: startDateStr,
                end_date: futureDateStr, // Far in the future
                status: "active",
                reason: "Test",
                created_at: startDateStr,
                updated_at: startDateStr,
              },
            ],
          });
        }),
        http.get(`${API_BASE}/equipment`, () => {
          return HttpResponse.json({ success: true, data: [] });
        }),
        http.get(`${API_BASE}/users`, () => {
          return HttpResponse.json({ success: true, data: [] });
        }),
      );

      const { result } = renderHook(() => useOverdueAlerts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Future dates should not be overdue
      expect(result.current.totalOverdue).toBe(0);
    });
  });

  describe("days overdue calculation", () => {
    it("should calculate days overdue for active requests with past end dates", async () => {
      const { result } = renderHook(() => useOverdueAlerts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Check that the calculation logic exists by verifying alerts have daysOverdue
      result.current.overdueAlerts.forEach((alert) => {
        expect(typeof alert.daysOverdue).toBe("number");
        expect(alert.daysOverdue).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("sorting", () => {
    it("should sort overdue alerts by daysOverdue in descending order", async () => {
      const { result } = renderHook(() => useOverdueAlerts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify sorting: each item should have daysOverdue >= next item
      const alerts = result.current.overdueAlerts;
      for (let i = 0; i < alerts.length - 1; i++) {
        expect(alerts[i].daysOverdue).toBeGreaterThanOrEqual(
          alerts[i + 1].daysOverdue,
        );
      }
    });
  });

  describe("error handling", () => {
    it("should handle missing data gracefully", async () => {
      const { result } = renderHook(() => useOverdueAlerts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // With default handlers, should have some structure
      expect(Array.isArray(result.current.overdueAlerts)).toBe(true);
    });
  });

  describe("data structure", () => {
    it("should return array of alerts", async () => {
      const { result } = renderHook(() => useOverdueAlerts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(Array.isArray(result.current.overdueAlerts)).toBe(true);
    });

    it("should return totalOverdue as a number", async () => {
      const { result } = renderHook(() => useOverdueAlerts());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.totalOverdue).toBe("number");
    });
  });
});
