
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { returnsRoutes } from "../../server/routes/returns";
import { db } from "../../server/db/connection";
import { auditLogger } from "../../server/services/audit-logger";

// Mock dependencies
vi.mock("../../server/db/connection", () => ({
  db: vi.fn(),
}));

vi.mock("../../server/services/audit-logger", () => ({
  auditLogger: {
    log: vi.fn(),
    createActorFromPayload: vi.fn(),
  },
}));

vi.mock("../../server/middleware/auth", () => ({
  authenticateRequest: vi.fn().mockResolvedValue({ userId: 1, role: "admin" }),
  requireAdmin: vi.fn().mockReturnValue(true),
}));

describe("returnsRoutes.updateCondition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update condition successfully and handle missing device_id safely", async () => {
    // Mock Request
    const req = new Request("http://localhost/api/returns/1/condition", {
      method: "PATCH",
      body: JSON.stringify({ condition: "good" }),
    });

    // Mock DB responses
    // 1. Get return request (v_return_details)
    const mockReturnRequest = { 
      id: 1, 
      device_id: 123, 
      device_condition: "damaged" 
    };
    
    // 2. Mock db template literal calls
    // The db mock needs to handle template literals.
    // In Bun SQL/Postgres.js, db`...` returns a Promise resolving to array
    const dbMock = db as unknown as Mock;
    
    // We need to simulate the sequence of DB calls
    // Call 1: Select return request
    // Call 2: Update return_requests (ignored return)
    // Call 3: Update devices (ignored return)
    // Call 4: Select updated return request

    dbMock.mockImplementation((strings, ...values) => {
      const query = strings.join("?");
      if (query.includes("SELECT * FROM v_return_details")) {
        // Return existing or updated depending on context? 
        // For simplicity, return mockReturnRequest always or updated one
        return Promise.resolve([mockReturnRequest]);
      }
      if (query.includes("UPDATE return_requests")) {
        return Promise.resolve([]);
      }
      if (query.includes("UPDATE devices")) {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    const response = await returnsRoutes.updateCondition(req, { id: "1" });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    
    // Verify db calls
    expect(dbMock).toHaveBeenCalledTimes(4); // Select, Update RR, Update Device, Select Updated
  });

  it("should warn and skip device update if device_id is missing", async () => {
    const req = new Request("http://localhost/api/returns/1/condition", {
        method: "PATCH",
        body: JSON.stringify({ condition: "good" }),
      });
  
      // Mock return request WITHOUT device_id
      const mockReturnRequestNoDevice = { 
        id: 1, 
        device_id: null, 
        device_condition: "damaged" 
      };
      
    const dbMock = db as unknown as Mock;
      
      dbMock.mockImplementation((strings, ...values) => {
        const query = strings.join("?");
        if (query.includes("SELECT * FROM v_return_details")) {
          return Promise.resolve([mockReturnRequestNoDevice]);
        }
        return Promise.resolve([]);
      });
  
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  
      const response = await returnsRoutes.updateCondition(req, { id: "1" });
      
      expect(response.status).toBe(200);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Device ID missing"));
      
      // Verify Update Device was NOT called (Update RR is called, Select calls)
      // We expect 3 calls: Select, Update RR, Select Updated. (Missing Update Device)
      // Actually, we must check if UPDATE devices was called.
      
      const calls = dbMock.mock.calls;
      const updateDeviceCall = calls.find(call => call[0].join("?").includes("UPDATE devices"));
      expect(updateDeviceCall).toBeUndefined();
  });
});
