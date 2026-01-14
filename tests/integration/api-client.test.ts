/**
 * API Client Integration Tests
 *
 * Tests for the frontend API client (src/lib/api-client.ts)
 * Validates token attachment, response parsing, error handling, and Content-Type headers.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import * as fc from "fast-check";
import { ApiClient, ApiError, NetworkError } from "../../src/lib/api-client";

// ============================================================================
// Test Setup
// ============================================================================

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to create a mock response
function createMockResponse<T>(
  status: number,
  data: { success: boolean; data?: T; error?: string; message?: string },
  headers: Record<string, string> = {},
): Response {
  return {
    status,
    statusText: status === 200 ? "OK" : "Error",
    ok: status >= 200 && status < 300,
    json: () => Promise.resolve(data),
    headers: new Headers(headers),
  } as Response;
}

// Helper to create a network error
function createNetworkError(): Error {
  const error = new TypeError("fetch failed");
  return error;
}

describe("API Client Integration Tests", () => {
  let apiClient: ApiClient;
  let mockGetToken: ReturnType<typeof vi.fn>;
  let mockOnUnauthorized: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetToken = vi.fn();
    mockOnUnauthorized = vi.fn();

    apiClient = new ApiClient({
      baseUrl: "https://localhost:3001",
      getToken: mockGetToken,
      onUnauthorized: mockOnUnauthorized,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Unit Tests - Token Attachment (Requirement 8.1)
  // ==========================================================================

  describe("Token Attachment", () => {
    it("should attach Authorization header when token is available", async () => {
      const token = "test-jwt-token";
      mockGetToken.mockReturnValue(token);
      mockFetch.mockResolvedValue(
        createMockResponse(200, { success: true, data: { id: 1 } }),
      );

      await apiClient.get("/api/test");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
        }),
      );
    });

    it("should not attach Authorization header when token is null", async () => {
      mockGetToken.mockReturnValue(null);
      mockFetch.mockResolvedValue(
        createMockResponse(200, { success: true, data: { id: 1 } }),
      );

      await apiClient.get("/api/test");

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1]?.headers as Record<string, string>;
      expect(headers["Authorization"]).toBeUndefined();
    });
  });

  // ==========================================================================
  // Unit Tests - 401 Response Handling (Requirement 8.2)
  // ==========================================================================

  describe("401 Response Handling", () => {
    it("should call onUnauthorized callback when receiving 401", async () => {
      mockGetToken.mockReturnValue("expired-token");
      mockFetch.mockResolvedValue(
        createMockResponse(401, { success: false, error: "Unauthorized" }),
      );

      await expect(apiClient.get("/api/protected")).rejects.toThrow(ApiError);
      expect(mockOnUnauthorized).toHaveBeenCalledTimes(1);
    });

    it("should throw ApiError with 401 status code", async () => {
      mockGetToken.mockReturnValue("expired-token");
      mockFetch.mockResolvedValue(
        createMockResponse(401, { success: false, error: "Unauthorized" }),
      );

      try {
        await apiClient.get("/api/protected");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(401);
      }
    });
  });

  // ==========================================================================
  // Unit Tests - Successful Response Parsing (Requirement 8.3)
  // ==========================================================================

  describe("Successful Response Parsing", () => {
    it("should extract data from ApiResponse wrapper", async () => {
      const expectedData = { id: 1, name: "Test Device" };
      mockGetToken.mockReturnValue("valid-token");
      mockFetch.mockResolvedValue(
        createMockResponse(200, { success: true, data: expectedData }),
      );

      const result = await apiClient.get<typeof expectedData>("/api/devices/1");

      expect(result).toEqual(expectedData);
    });

    it("should handle empty data in successful response", async () => {
      mockGetToken.mockReturnValue("valid-token");
      mockFetch.mockResolvedValue(createMockResponse(200, { success: true }));

      const result = await apiClient.delete("/api/devices/1");

      expect(result).toBeUndefined();
    });
  });

  // ==========================================================================
  // Unit Tests - Error Response Handling (Requirement 8.4)
  // ==========================================================================

  describe("Error Response Handling", () => {
    it("should throw ApiError with error message from response", async () => {
      const errorMessage = "Device not found";
      mockGetToken.mockReturnValue("valid-token");
      mockFetch.mockResolvedValue(
        createMockResponse(404, { success: false, error: errorMessage }),
      );

      try {
        await apiClient.get("/api/devices/999");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toBe(errorMessage);
        expect((error as ApiError).statusCode).toBe(404);
      }
    });

    it("should use message field if error field is not present", async () => {
      const message = "Validation failed";
      mockGetToken.mockReturnValue("valid-token");
      mockFetch.mockResolvedValue(
        createMockResponse(400, { success: false, message }),
      );

      try {
        await apiClient.post("/api/devices", {});
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toBe(message);
      }
    });

    it("should provide default message when no error or message field", async () => {
      mockGetToken.mockReturnValue("valid-token");
      mockFetch.mockResolvedValue(createMockResponse(500, { success: false }));

      try {
        await apiClient.get("/api/test");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toBe("An unknown error occurred");
      }
    });
  });

  // ==========================================================================
  // Unit Tests - Network Error Handling (Requirement 8.5)
  // ==========================================================================

  describe("Network Error Handling", () => {
    it("should throw NetworkError when fetch fails", async () => {
      mockGetToken.mockReturnValue("valid-token");
      mockFetch.mockRejectedValue(createNetworkError());

      try {
        await apiClient.get("/api/test");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError);
        expect((error as NetworkError).endpoint).toBe("/api/test");
      }
    });

    it("should include endpoint in NetworkError", async () => {
      mockGetToken.mockReturnValue("valid-token");
      mockFetch.mockRejectedValue(createNetworkError());

      try {
        await apiClient.post("/api/devices", { name: "Test" });
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(NetworkError);
        expect((error as NetworkError).endpoint).toBe("/api/devices");
      }
    });
  });

  // ==========================================================================
  // Unit Tests - Content-Type Header (Requirement 8.6)
  // ==========================================================================

  describe("Content-Type Header for POST/PUT/PATCH", () => {
    it("should set Content-Type to application/json for POST requests", async () => {
      mockGetToken.mockReturnValue("valid-token");
      mockFetch.mockResolvedValue(
        createMockResponse(200, { success: true, data: { id: 1 } }),
      );

      await apiClient.post("/api/devices", { name: "Test" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("should set Content-Type to application/json for PUT requests", async () => {
      mockGetToken.mockReturnValue("valid-token");
      mockFetch.mockResolvedValue(
        createMockResponse(200, { success: true, data: { id: 1 } }),
      );

      await apiClient.put("/api/devices/1", { name: "Updated" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("should set Content-Type to application/json for PATCH requests", async () => {
      mockGetToken.mockReturnValue("valid-token");
      mockFetch.mockResolvedValue(
        createMockResponse(200, { success: true, data: { id: 1 } }),
      );

      await apiClient.patch("/api/devices/1", { status: "available" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("should not set Content-Type for GET requests", async () => {
      mockGetToken.mockReturnValue("valid-token");
      mockFetch.mockResolvedValue(
        createMockResponse(200, { success: true, data: [] }),
      );

      await apiClient.get("/api/devices");

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1]?.headers as Record<string, string>;
      expect(headers["Content-Type"]).toBeUndefined();
    });

    it("should not set Content-Type for DELETE requests", async () => {
      mockGetToken.mockReturnValue("valid-token");
      mockFetch.mockResolvedValue(createMockResponse(200, { success: true }));

      await apiClient.delete("/api/devices/1");

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1]?.headers as Record<string, string>;
      expect(headers["Content-Type"]).toBeUndefined();
    });
  });

  // ==========================================================================
  // Property Tests
  // ==========================================================================

  /**
   * Property 20: API Client Token Attachment
   * For any request made with a stored token, the API client should attach
   * the Authorization header with Bearer prefix.
   *
   * **Validates: Requirements 8.1**
   */
  describe("Property 20: API Client Token Attachment", () => {
    it("should attach Bearer token for all valid tokens", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.stringMatching(/^[a-zA-Z0-9._-]{10,100}$/),
          async (token) => {
            vi.clearAllMocks();
            mockGetToken.mockReturnValue(token);
            mockFetch.mockResolvedValue(
              createMockResponse(200, { success: true, data: {} }),
            );

            await apiClient.get("/api/test");

            expect(mockFetch).toHaveBeenCalledWith(
              expect.any(String),
              expect.objectContaining({
                headers: expect.objectContaining({
                  Authorization: `Bearer ${token}`,
                }),
              }),
            );
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 21: API Client Response Parsing
   * For any successful API response, the API client should extract and return
   * the data field from the ApiResponse wrapper.
   *
   * **Validates: Requirements 8.3**
   */
  describe("Property 21: API Client Response Parsing", () => {
    it("should extract data from any successful response", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            value: fc.oneof(fc.integer(), fc.string(), fc.boolean()),
          }),
          async (expectedData) => {
            vi.clearAllMocks();
            mockGetToken.mockReturnValue("valid-token");
            mockFetch.mockResolvedValue(
              createMockResponse(200, { success: true, data: expectedData }),
            );

            const result =
              await apiClient.get<typeof expectedData>("/api/test");

            expect(result).toEqual(expectedData);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 22: API Client Error Handling
   * For any error API response, the API client should throw an ApiError
   * with the error message from the response.
   *
   * **Validates: Requirements 8.4**
   */
  describe("Property 22: API Client Error Handling", () => {
    it("should throw ApiError with message for all error responses", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(400, 403, 404, 422, 500, 502, 503),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (statusCode, errorMessage) => {
            vi.clearAllMocks();
            mockGetToken.mockReturnValue("valid-token");
            mockFetch.mockResolvedValue(
              createMockResponse(statusCode, {
                success: false,
                error: errorMessage,
              }),
            );

            try {
              await apiClient.get("/api/test");
              expect.fail("Should have thrown");
            } catch (error) {
              expect(error).toBeInstanceOf(ApiError);
              expect((error as ApiError).message).toBe(errorMessage);
              expect((error as ApiError).statusCode).toBe(statusCode);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 23: API Client Content-Type
   * For any POST, PUT, or PATCH request, the API client should set
   * Content-Type header to application/json.
   *
   * **Validates: Requirements 8.6**
   */
  describe("Property 23: API Client Content-Type", () => {
    it("should set Content-Type for all POST/PUT/PATCH requests", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom("POST", "PUT", "PATCH"),
          fc.record({
            field1: fc.string(),
            field2: fc.integer(),
          }),
          async (method, body) => {
            vi.clearAllMocks();
            mockGetToken.mockReturnValue("valid-token");
            mockFetch.mockResolvedValue(
              createMockResponse(200, { success: true, data: { id: 1 } }),
            );

            if (method === "POST") {
              await apiClient.post("/api/test", body);
            } else if (method === "PUT") {
              await apiClient.put("/api/test", body);
            } else {
              await apiClient.patch("/api/test", body);
            }

            expect(mockFetch).toHaveBeenCalledWith(
              expect.any(String),
              expect.objectContaining({
                headers: expect.objectContaining({
                  "Content-Type": "application/json",
                }),
              }),
            );
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
