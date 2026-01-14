/**
 * Test configuration for Device Hub
 */

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

export const TEST_CONFIG = {
  API_BASE_URL: process.env.TEST_API_URL || "https://localhost:3011",
  TEST_TIMEOUT: 30000,
};

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

export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["approved", "rejected"],
  approved: ["active", "rejected"],
  active: ["returned"],
  returned: [],
  rejected: [],
};

export const DEVICE_CATEGORIES = [
  "laptop",
  "mobile",
  "tablet",
  "monitor",
  "accessories",
  "storage",
  "ram",
] as const;

export const DEPARTMENT_NAMES = [
  "QA",
  "DEV",
  "CG",
  "ADMIN",
  "STG",
] as const;

export const DEVICE_CONDITIONS = [
  "excellent",
  "good",
  "fair",
  "damaged",
] as const;
