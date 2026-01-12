/**
 * Global test setup for Vitest
 * Sets up test environment variables and global utilities
 */

import { beforeAll, afterAll, afterEach } from "vitest";

// Test environment configuration
const TEST_CONFIG = {
  API_BASE_URL: process.env.TEST_API_URL || "http://localhost:3001",
  TEST_TIMEOUT: 30000,
};

// Test user credentials (matching seed data)
// Password for all seed users is 'password123'
// Note: Both alex.johnson and james.wilson are admins in seed data
export const TEST_USERS = {
  superuser: {
    email: "superuser@company.com",
    password: "password123",
  },
  admin: {
    email: "alex.johnson@company.com",
    password: "password123",
  },
  user: {
    email: "sarah.chen@company.com",
    password: "password123",
  },
};

// Valid status transitions (matching design document)
export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["approved", "rejected"],
  approved: ["active", "rejected"],
  active: ["returned"],
  returned: [],
  rejected: [],
};

// Device categories
export const DEVICE_CATEGORIES = [
  "laptop",
  "mobile",
  "tablet",
  "monitor",
  "accessories",
  "storage",
  "ram",
] as const;

// Department names
export const DEPARTMENT_NAMES = [
  "QA",
  "DEV",
  "CG",
  "ADMIN",
  "STG",
] as const;

// Device conditions
export const DEVICE_CONDITIONS = [
  "excellent",
  "good",
  "fair",
  "damaged",
] as const;

// Export test configuration
export { TEST_CONFIG };

// Global setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = "test";
  process.env.API_BASE_URL = TEST_CONFIG.API_BASE_URL;
});

// Cleanup after each test
afterEach(() => {
  // Reset any global state if needed
});

// Global teardown
afterAll(() => {
  // Cleanup resources
});
