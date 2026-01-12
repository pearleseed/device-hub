/**
 * Test Data Factories for Device Hub
 *
 * Provides factory functions for generating test data with sensible defaults
 * that can be overridden as needed.
 */

import type {
  SignupRequest,
  CreateDeviceRequest,
  CreateBorrowRequest,
  CreateReturnRequest,
  CreateRenewalRequest,
  DeviceCategory,
  DeviceCondition,
} from "../../src/types/api";

// ============================================================================
// Counter for unique values
// ============================================================================

let counter = 0;

function getUniqueId(): number {
  return ++counter;
}

/**
 * Generate a unique suffix using timestamp and random string
 */
function getUniqueSuffix(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * Reset the counter (useful for test isolation)
 */
export function resetFactoryCounter(): void {
  counter = 0;
}

// ============================================================================
// User Factory
// ============================================================================

/**
 * Create a user signup request with default values
 */
export function createUser(overrides?: Partial<SignupRequest>): SignupRequest {
  const id = getUniqueId();
  const uniqueSuffix = getUniqueSuffix();
  return {
    name: `Test User ${id}`,
    email: `testuser-${uniqueSuffix}@example.com`,
    password: "password123",
    department_id: 1,
    ...overrides,
  };
}

// ============================================================================
// Device Factory
// ============================================================================

const DEVICE_CATEGORIES: DeviceCategory[] = [
  "laptop",
  "mobile",
  "tablet",
  "monitor",
  "accessories",
  "storage",
  "ram",
];

/**
 * Create a device request with default values
 */
export function createDevice(
  overrides?: Partial<CreateDeviceRequest>,
): CreateDeviceRequest {
  const id = getUniqueId();
  const uniqueSuffix = getUniqueSuffix();
  const category = DEVICE_CATEGORIES[id % DEVICE_CATEGORIES.length];

  return {
    name: `Test Device ${id}`,
    asset_tag: `ASSET-${uniqueSuffix.toUpperCase()}`,
    category,
    brand: "TestBrand",
    model: `Model-${id}`,
    department_id: 1,
    purchase_price: 1000 + id * 100,
    purchase_date: new Date().toISOString().split("T")[0],
    specs_json: JSON.stringify({
      processor: "Test Processor",
      memory: "16GB",
      storage: "512GB SSD",
    }),
    image_url: `https://example.com/device-${id}.jpg`,
    ...overrides,
  };
}

// ============================================================================
// Borrow Request Factory
// ============================================================================

/**
 * Create a borrow request with default values
 */
export function createBorrowRequest(
  overrides?: Partial<CreateBorrowRequest>,
): CreateBorrowRequest {
  const id = getUniqueId();
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 7); // Default 7-day loan

  return {
    device_id: 1,
    start_date: startDate.toISOString().split("T")[0],
    end_date: endDate.toISOString().split("T")[0],
    reason: `Test borrow request ${id} - Need device for testing purposes`,
    ...overrides,
  };
}

// ============================================================================
// Return Request Factory
// ============================================================================

const DEVICE_CONDITIONS: DeviceCondition[] = [
  "excellent",
  "good",
  "fair",
  "damaged",
];

/**
 * Create a return request with default values
 */
export function createReturnRequest(
  overrides?: Partial<CreateReturnRequest>,
): CreateReturnRequest {
  const id = getUniqueId();

  return {
    borrow_request_id: 1,
    condition: "good",
    notes: `Return notes for request ${id}`,
    ...overrides,
  };
}

// ============================================================================
// Renewal Request Factory
// ============================================================================

/**
 * Create a renewal request with default values
 */
export function createRenewalRequest(
  overrides?: Partial<CreateRenewalRequest>,
): CreateRenewalRequest {
  const id = getUniqueId();
  const requestedEndDate = new Date();
  requestedEndDate.setDate(requestedEndDate.getDate() + 14); // Extend by 14 days

  return {
    borrow_request_id: 1,
    requested_end_date: requestedEndDate.toISOString().split("T")[0],
    reason: `Renewal request ${id} - Need more time to complete testing`,
    ...overrides,
  };
}

// ============================================================================
// Batch Factories
// ============================================================================

/**
 * Create multiple users
 */
export function createUsers(
  count: number,
  overrides?: Partial<SignupRequest>,
): SignupRequest[] {
  return Array.from({ length: count }, () => createUser(overrides));
}

/**
 * Create multiple devices
 */
export function createDevices(
  count: number,
  overrides?: Partial<CreateDeviceRequest>,
): CreateDeviceRequest[] {
  return Array.from({ length: count }, () => createDevice(overrides));
}

/**
 * Create multiple borrow requests
 */
export function createBorrowRequests(
  count: number,
  overrides?: Partial<CreateBorrowRequest>,
): CreateBorrowRequest[] {
  return Array.from({ length: count }, () => createBorrowRequest(overrides));
}
