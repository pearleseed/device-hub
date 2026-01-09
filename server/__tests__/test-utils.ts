// Test utilities for backend tests
import type { JWTPayload, UserRole } from "../types";
import type { PoolStatus } from "../db/connection";

// ============================================================================
// Mock Data
// ============================================================================

// Mock user data for testing
export const mockUsers = {
  admin: {
    id: 1,
    name: "Admin User",
    email: "admin@example.com",
    password_hash: "mock-hash",
    department_id: 1,
    role: "admin" as UserRole,
    avatar_url: "https://example.com/admin.jpg",
    created_at: new Date(),
  },
  user: {
    id: 2,
    name: "Regular User",
    email: "user@example.com",
    password_hash: "mock-hash",
    department_id: 1,
    role: "user" as UserRole,
    avatar_url: "https://example.com/user.jpg",
    created_at: new Date(),
  },
};

export const mockDepartments = [
  { id: 1, name: "Engineering", code: "ENG", created_at: new Date() },
  { id: 2, name: "Marketing", code: "MKT", created_at: new Date() },
];

export const mockDevices = [
  {
    id: 1,
    name: 'MacBook Pro 16"',
    asset_tag: "LAP-001",
    category: "laptop" as const,
    brand: "Apple",
    model: 'MacBook Pro 16" M3 Max',
    status: "available" as const,
    department_id: 1,
    purchase_price: 3499.99,
    purchase_date: new Date("2024-01-15"),
    specs_json: '{"processor":"M3 Max","ram":"36GB"}',
    image_url: "https://example.com/macbook.jpg",
    created_at: new Date(),
  },
  {
    id: 2,
    name: "iPhone 15 Pro",
    asset_tag: "MOB-001",
    category: "mobile" as const,
    brand: "Apple",
    model: "iPhone 15 Pro",
    status: "borrowed" as const,
    department_id: 1,
    purchase_price: 1199.99,
    purchase_date: new Date("2024-01-20"),
    specs_json: '{"storage":"256GB"}',
    image_url: "https://example.com/iphone.jpg",
    created_at: new Date(),
  },
];

// Alias for backward compatibility
export const mockEquipment = mockDevices;

export const mockBorrowRequests = [
  {
    id: 1,
    device_id: 2,
    user_id: 2,
    approved_by: 1,
    start_date: new Date("2024-02-01"),
    end_date: new Date("2024-02-15"),
    reason: "Project development",
    status: "active" as const,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 2,
    device_id: 1,
    user_id: 2,
    approved_by: null,
    start_date: new Date("2024-03-01"),
    end_date: new Date("2024-03-15"),
    reason: "Testing",
    status: "pending" as const,
    created_at: new Date(),
    updated_at: new Date(),
  },
];

// Alias for backward compatibility
export const mockBorrowingRequests = mockBorrowRequests;

export const mockPoolStatus: PoolStatus = {
  active: 2,
  idle: 18,
  total: 20,
  healthy: true,
};

// ============================================================================
// Request Helpers
// ============================================================================

// Helper to create a mock Request object
export function createMockRequest(
  method: string,
  url: string,
  options: {
    body?: object;
    headers?: Record<string, string>;
  } = {},
): Request {
  const { body, headers = {} } = options;

  return new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Helper to create authenticated request
export function createAuthenticatedRequest(
  method: string,
  url: string,
  token: string,
  options: { body?: object } = {},
): Request {
  return createMockRequest(method, url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Helper to parse JSON response
export async function parseResponse<T>(
  response: Response,
): Promise<{ status: number; data: T }> {
  const data = await response.json();
  return { status: response.status, data };
}

// ============================================================================
// JWT Helpers
// ============================================================================

// Mock JWT payload
export function createMockJWTPayload(
  userId: number,
  role: UserRole,
): JWTPayload {
  return {
    userId,
    email: `user${userId}@example.com`,
    role,
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  };
}

// Helper to create expired JWT payload
export function createExpiredJWTPayload(
  userId: number,
  role: UserRole,
): JWTPayload {
  return {
    userId,
    email: `user${userId}@example.com`,
    role,
    exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
  };
}

// ============================================================================
// Database Mock Helpers
// ============================================================================

import { expect, mock } from "bun:test";

/**
 * Create a mock database instance with all necessary methods
 * This includes the new connection pool features
 */
export function createMockDb() {
  const mockDb = mock(() => []);
  const mockTx = Object.assign(
    mock(() => []),
    {
      unsafe: mock(() => []),
    },
  );

  // Add additional methods to the mock
  const dbWithMethods = Object.assign(mockDb, {
    unsafe: mock(() => []),
    begin: mock(async (fn: (tx: typeof mockTx) => Promise<unknown>) =>
      fn(mockTx),
    ),
    reserve: mock(async () => ({
      ...mockTx,
      release: mock(() => {}),
    })),
    close: mock(async () => {}),
  });

  return { mockDb: dbWithMethods, mockTx };
}

/**
 * Create mock connection module exports
 * Use this to mock the entire connection module in tests
 */
export function createMockConnectionModule(
  mockDb: ReturnType<typeof createMockDb>["mockDb"],
) {
  return {
    db: mockDb,
    checkConnection: mock(async () => true),
    getPoolStatus: mock(async () => mockPoolStatus),
    closeConnection: mock(async () => {}),
    logDbConfig: mock(() => {}),
    initializeDatabase: mock(async () => {}),
    seedDatabase: mock(async () => {}),
    withRetry: mock(async <T>(operation: () => Promise<T>) => operation()),
    queryOne: mock(async () => null),
    queryMany: mock(async () => []),
    withReservedConnection: mock(
      async <T>(operation: (conn: unknown) => Promise<T>) => {
        const reserved = await mockDb.reserve();
        try {
          return await operation(reserved);
        } finally {
          reserved.release();
        }
      },
    ),
    withTransaction: mock(async <T>(operation: (tx: unknown) => Promise<T>) => {
      return mockDb.begin(operation);
    }),
    DatabaseError: class DatabaseError extends Error {
      constructor(
        message: string,
        public readonly code?: string,
        public readonly query?: string,
        public readonly originalError?: Error,
      ) {
        super(message);
        this.name = "DatabaseError";
      }
    },
  };
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Helper to assert a successful API response
 */
export function assertSuccessResponse<T>(
  result: {
    status: number;
    data: { success: boolean; data?: T; message?: string };
  },
  expectedStatus = 200,
) {
  expect(result.status).toBe(expectedStatus);
  expect(result.data.success).toBe(true);
}

/**
 * Helper to assert an error API response
 */
export function assertErrorResponse(
  result: { status: number; data: { success: boolean; error?: string } },
  expectedStatus: number,
  expectedError?: string,
) {
  expect(result.status).toBe(expectedStatus);
  expect(result.data.success).toBe(false);
  if (expectedError) {
    expect(result.data.error).toBe(expectedError);
  }
}
