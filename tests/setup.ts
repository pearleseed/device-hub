/**
 * Global test setup for Vitest
 * Sets up test environment variables and global utilities
 */

// Ignore self-signed certificates for all tests
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Ensure Bun global is available if running in Bun environment
if (typeof (globalThis as any).Bun === "undefined") {
  (globalThis as any).Bun = {
    password: {
      hash: async (password: string) => `$argon2id$v=19$m=65536,t=2,p=1$mockedhash$${password}`,
      verify: async (password: string, hash: string) => hash.endsWith(password),
    },
    file: (path: string) => ({
        exists: async () => true,
        text: async () => "",
    }),
    sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  };
}

import { beforeAll, afterAll, afterEach } from "vitest";
import { testApiClient } from "./utils/api-client";
import { TEST_CONFIG } from "./test-config";

// Set test environment variables
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Global setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = "test";
  process.env.API_BASE_URL = TEST_CONFIG.API_BASE_URL;
});

// Cleanup after each test
afterEach(() => {
  // Reset any global state if needed
  testApiClient.clearAuth();
});

// Global teardown
afterAll(() => {
  // Cleanup resources
});
