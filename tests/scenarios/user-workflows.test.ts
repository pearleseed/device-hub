/**
 * Real-World User Workflow Tests for Device Hub
 *
 * End-to-end scenario tests that simulate actual user journeys
 * through the device management system.
 *
 * These tests validate complete workflows rather than individual endpoints,
 * ensuring the system works correctly for real-world use cases.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { TestApiClient } from "../utils/api-client";
import { createDevice, createUser, createBorrowRequest } from "../utils/factories";
import { daysFromNow, daysAgo, today } from "../utils/helpers";
import type {
  DeviceWithDepartment,
  BorrowRequestWithDetails,
  UserPublic,
  RenewalRequestWithDetails,
  ReturnRequestWithDetails,
} from "../../src/types/api";

// ============================================================================
// Test Setup
// ============================================================================

const api = new TestApiClient();

let adminToken: string;
let superuserToken: string;
let userToken: string;
let regularUserId: number;
let adminUserId: number;
const createdDeviceIds: number[] = [];
const createdBorrowRequestIds: number[] = [];
const createdUserIds: number[] = [];

beforeAll(async () => {
  const [adminResult, superuserResult, userResult] = await Promise.all([
    api.loginAsAdmin(),
    api.loginAsSuperuser(),
    api.loginAsUser(),
  ]);
  adminToken = adminResult.token;
  superuserToken = superuserResult.token;
  userToken = userResult.token;
  regularUserId = userResult.user.id;
  adminUserId = adminResult.user.id;
});

afterAll(async () => {
  // Cleanup created borrow requests
  for (const requestId of createdBorrowRequestIds) {
    try {
      await api.patch(
        `/api/borrow/${requestId}/status`,
        { status: "rejected" },
        adminToken,
      );
    } catch {
      // Ignore cleanup errors
    }
  }

  // Cleanup created devices
  for (const deviceId of createdDeviceIds) {
    try {
      await api.delete(`/api/devices/${deviceId}`, adminToken);
    } catch {
      // Ignore cleanup errors
    }
  }

  // Cleanup created users
  for (const userId of createdUserIds) {
    try {
      await api.delete(`/api/users/${userId}`, superuserToken);
    } catch {
      // Ignore cleanup errors
    }
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

let deviceCounter = Date.now();

async function createTestDevice(overrides?: Partial<Parameters<typeof createDevice>[0]>): Promise<DeviceWithDepartment> {
  deviceCounter++;
  const uniqueAssetTag = `WF-${deviceCounter}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const deviceData = createDevice({
    asset_tag: uniqueAssetTag,
    name: `Workflow Test Device ${deviceCounter}`,
    ...overrides,
  });

  const response = await api.post<DeviceWithDepartment>(
    "/api/devices",
    deviceData,
    adminToken,
  );

  if (!response.data.success || !response.data.data?.id) {
    throw new Error(`Failed to create test device: ${response.data.error || "Unknown error"}`);
  }

  createdDeviceIds.push(response.data.data.id);
  return response.data.data;
}

async function createTestUser(): Promise<{ user: UserPublic; token: string }> {
  const userData = createUser();
  
  const signupResponse = await api.post<{ token: string; user: UserPublic }>(
    "/api/auth/signup",
    userData,
  );

  if (!signupResponse.data.success) {
    throw new Error(`Failed to create test user: ${(signupResponse.data as any).error}`);
  }

  const loginResponse = await api.login(userData.email, userData.password);
  createdUserIds.push(loginResponse.user.id);
  
  return loginResponse;
}

// ============================================================================
// Scenario 1: New Employee Onboarding
// ============================================================================

describe("Scenario: New Employee Onboarding", () => {
  it("should allow a new employee to sign up, browse devices, and request a laptop", async () => {
    // Step 1: New employee signs up
    const newEmployee = await createTestUser();
    expect(newEmployee.user.id).toBeDefined();
    expect(newEmployee.token).toBeDefined();

    // Step 2: Employee browses available laptops
    const devicesResponse = await api.get<DeviceWithDepartment[]>(
      "/api/devices",
      newEmployee.token,
      { category: "laptop", status: "available" },
    );
    expect(devicesResponse.status).toBe(200);
    expect(devicesResponse.data.success).toBe(true);

    // Step 3: If no laptops available, admin creates one
    let targetDevice: DeviceWithDepartment;
    if (!devicesResponse.data.data || devicesResponse.data.data.length === 0) {
      targetDevice = await createTestDevice({ category: "laptop" });
    } else {
      // Create a new device to avoid conflicts with other tests
      targetDevice = await createTestDevice({ category: "laptop" });
    }

    // Step 4: Employee views device details
    const deviceDetailResponse = await api.get<DeviceWithDepartment>(
      `/api/devices/${targetDevice.id}`,
      newEmployee.token,
    );
    expect(deviceDetailResponse.status).toBe(200);
    expect(deviceDetailResponse.data.data?.id).toBe(targetDevice.id);

    // Step 5: Employee submits borrow request
    const borrowData = createBorrowRequest({
      device_id: targetDevice.id,
      start_date: daysFromNow(1),
      end_date: daysFromNow(30),
      reason: "New employee onboarding - need laptop for daily work",
    });

    const borrowResponse = await api.post<BorrowRequestWithDetails>(
      "/api/borrow",
      borrowData,
      newEmployee.token,
    );
    expect(borrowResponse.status).toBe(201);
    expect(borrowResponse.data.data?.status).toBe("pending");
    
    if (borrowResponse.data.data?.id) {
      createdBorrowRequestIds.push(borrowResponse.data.data.id);
    }

    // Step 6: Admin approves the request
    const approveResponse = await api.patch<BorrowRequestWithDetails>(
      `/api/borrow/${borrowResponse.data.data?.id}/status`,
      { status: "approved" },
      adminToken,
    );
    expect(approveResponse.status).toBe(200);
    expect(approveResponse.data.data?.status).toBe("approved");

    // Step 7: Admin activates the loan (device handed over)
    const activateResponse = await api.patch<BorrowRequestWithDetails>(
      `/api/borrow/${borrowResponse.data.data?.id}/status`,
      { status: "active" },
      adminToken,
    );
    expect(activateResponse.status).toBe(200);
    expect(activateResponse.data.data?.status).toBe("active");

    // Step 8: Verify device status changed to borrowed
    const updatedDeviceResponse = await api.get<DeviceWithDepartment>(
      `/api/devices/${targetDevice.id}`,
    );
    expect(updatedDeviceResponse.data.data?.status).toBe("borrowed");
  });
});

// ============================================================================
// Scenario 2: Device Loan Extension Request
// ============================================================================

describe("Scenario: Device Loan Extension Request", () => {
  it("should allow user to request and receive loan extension", async () => {
    // Step 1: Create a device and active loan
    const device = await createTestDevice({ category: "tablet" });
    
    const borrowData = createBorrowRequest({
      device_id: device.id,
      start_date: daysFromNow(1),
      end_date: daysFromNow(7),
      reason: "Short-term project work",
    });

    const borrowResponse = await api.post<BorrowRequestWithDetails>(
      "/api/borrow",
      borrowData,
      userToken,
    );
    expect(borrowResponse.status).toBe(201);
    createdBorrowRequestIds.push(borrowResponse.data.data!.id);

    // Approve and activate
    await api.patch(
      `/api/borrow/${borrowResponse.data.data?.id}/status`,
      { status: "approved" },
      adminToken,
    );
    await api.patch(
      `/api/borrow/${borrowResponse.data.data?.id}/status`,
      { status: "active" },
      adminToken,
    );

    // Step 2: User realizes they need more time and requests renewal
    const renewalResponse = await api.post<RenewalRequestWithDetails>(
      "/api/renewals",
      {
        borrow_request_id: borrowResponse.data.data?.id,
        requested_end_date: daysFromNow(21), // Extend by 2 more weeks
        reason: "Project deadline extended, need device for additional testing",
      },
      userToken,
    );
    expect(renewalResponse.status).toBe(201);
    expect(renewalResponse.data.data?.status).toBe("pending");

    // Step 3: Admin reviews and approves the renewal
    const approveRenewalResponse = await api.patch<RenewalRequestWithDetails>(
      `/api/renewals/${renewalResponse.data.data?.id}/status`,
      { status: "approved" },
      adminToken,
    );
    expect(approveRenewalResponse.status).toBe(200);
    expect(approveRenewalResponse.data.data?.status).toBe("approved");

    // Step 4: Verify borrow request end date was updated
    const updatedBorrowResponse = await api.get<BorrowRequestWithDetails>(
      `/api/borrow/${borrowResponse.data.data?.id}`,
      userToken,
    );
    const newEndDate = new Date(updatedBorrowResponse.data.data?.end_date as unknown as string);
    const originalEndDate = new Date(borrowResponse.data.data?.end_date as unknown as string);
    expect(newEndDate.getTime()).toBeGreaterThan(originalEndDate.getTime());
  });
});

// ============================================================================
// Scenario 3: Device Return with Damage Report
// ============================================================================

describe("Scenario: Device Return with Damage Report", () => {
  it("should handle damaged device return and set device to maintenance", async () => {
    // Step 1: Create device and complete loan cycle
    const device = await createTestDevice({ category: "mobile" });
    
    const borrowData = createBorrowRequest({
      device_id: device.id,
      start_date: daysFromNow(1),
      end_date: daysFromNow(7),
      reason: "Field testing mobile app",
    });

    const borrowResponse = await api.post<BorrowRequestWithDetails>(
      "/api/borrow",
      borrowData,
      userToken,
    );
    createdBorrowRequestIds.push(borrowResponse.data.data!.id);

    // Approve and activate
    await api.patch(
      `/api/borrow/${borrowResponse.data.data?.id}/status`,
      { status: "approved" },
      adminToken,
    );
    await api.patch(
      `/api/borrow/${borrowResponse.data.data?.id}/status`,
      { status: "active" },
      adminToken,
    );

    // Step 2: User returns device with damage report
    const returnResponse = await api.post<ReturnRequestWithDetails>(
      "/api/returns",
      {
        borrow_request_id: borrowResponse.data.data?.id,
        condition: "damaged",
        notes: "Screen cracked during field testing. Device fell from table.",
      },
      userToken,
    );
    expect(returnResponse.status).toBe(201);
    expect(returnResponse.data.data?.device_condition).toBe("damaged");

    // Step 3: Verify device is now in maintenance
    const deviceResponse = await api.get<DeviceWithDepartment>(
      `/api/devices/${device.id}`,
    );
    expect(deviceResponse.data.data?.status).toBe("maintenance");

    // Step 4: Verify borrow request is marked as returned
    const borrowStatusResponse = await api.get<BorrowRequestWithDetails>(
      `/api/borrow/${borrowResponse.data.data?.id}`,
      userToken,
    );
    expect(borrowStatusResponse.data.data?.status).toBe("returned");
  });
});

// ============================================================================
// Scenario 4: Admin Inventory Management
// ============================================================================

describe("Scenario: Admin Inventory Management", () => {
  it("should allow admin to add, update, and manage device inventory", async () => {
    // Step 1: Admin adds new device to inventory
    const newDevice = await createTestDevice({
      name: "Dell Latitude 5540",
      category: "laptop",
      brand: "Dell",
      model: "Latitude 5540",
      purchase_price: 1299.99,
    });
    expect(newDevice.id).toBeDefined();
    expect(newDevice.status).toBe("available");

    // Step 2: Admin updates device specifications
    const updateResponse = await api.put<DeviceWithDepartment>(
      `/api/devices/${newDevice.id}`,
      {
        specs_json: JSON.stringify({
          processor: "Intel Core i7-1365U",
          memory: "32GB DDR5",
          storage: "512GB NVMe SSD",
          display: "15.6 inch FHD",
        }),
      },
      adminToken,
    );
    expect(updateResponse.status).toBe(200);

    // Step 3: Admin views all devices in inventory
    const inventoryResponse = await api.get<DeviceWithDepartment[]>(
      "/api/devices",
      adminToken,
    );
    expect(inventoryResponse.status).toBe(200);
    expect(inventoryResponse.data.data?.some(d => d.id === newDevice.id)).toBe(true);

    // Step 4: Admin filters by category
    const laptopsResponse = await api.get<DeviceWithDepartment[]>(
      "/api/devices",
      adminToken,
      { category: "laptop" },
    );
    expect(laptopsResponse.status).toBe(200);
    expect(laptopsResponse.data.data?.every(d => d.category === "laptop")).toBe(true);

    // Step 5: Admin searches for specific device
    const searchResponse = await api.get<DeviceWithDepartment[]>(
      "/api/devices",
      adminToken,
      { search: "Dell Latitude" },
    );
    expect(searchResponse.status).toBe(200);
  });
});

// ============================================================================
// Scenario 5: Request Rejection and Re-submission
// ============================================================================

describe("Scenario: Request Rejection and Re-submission", () => {
  it("should handle rejected request and allow user to submit new request", async () => {
    // Step 1: User submits borrow request
    const device = await createTestDevice({ category: "monitor" });
    
    const firstBorrowData = createBorrowRequest({
      device_id: device.id,
      start_date: daysFromNow(1),
      end_date: daysFromNow(90), // Very long duration
      reason: "Need monitor for extended period",
    });

    const firstBorrowResponse = await api.post<BorrowRequestWithDetails>(
      "/api/borrow",
      firstBorrowData,
      userToken,
    );
    expect(firstBorrowResponse.status).toBe(201);
    createdBorrowRequestIds.push(firstBorrowResponse.data.data!.id);

    // Step 2: Admin rejects the request (too long duration)
    const rejectResponse = await api.patch<BorrowRequestWithDetails>(
      `/api/borrow/${firstBorrowResponse.data.data?.id}/status`,
      { status: "rejected" },
      adminToken,
    );
    expect(rejectResponse.status).toBe(200);
    expect(rejectResponse.data.data?.status).toBe("rejected");

    // Step 3: Verify device is still available
    const deviceResponse = await api.get<DeviceWithDepartment>(
      `/api/devices/${device.id}`,
    );
    expect(deviceResponse.data.data?.status).toBe("available");

    // Step 4: Create a new device for the second request to avoid any conflicts
    const device2 = await createTestDevice({ category: "monitor" });
    const secondBorrowData = createBorrowRequest({
      device_id: device2.id,
      start_date: daysFromNow(1),
      end_date: daysFromNow(14),
      reason: "Need monitor for two-week project sprint",
    });

    const secondBorrowResponse = await api.post<BorrowRequestWithDetails>(
      "/api/borrow",
      secondBorrowData,
      userToken,
    );
    expect(secondBorrowResponse.status).toBe(201);
    createdBorrowRequestIds.push(secondBorrowResponse.data.data!.id);

    // Step 5: Admin approves the new request
    const approveResponse = await api.patch<BorrowRequestWithDetails>(
      `/api/borrow/${secondBorrowResponse.data.data?.id}/status`,
      { status: "approved" },
      adminToken,
    );
    expect(approveResponse.status).toBe(200);
    expect(approveResponse.data.data?.status).toBe("approved");
  });
});

// ============================================================================
// Scenario 6: Multiple Users Competing for Same Device
// ============================================================================

describe("Scenario: Multiple Users Competing for Same Device", () => {
  it("should handle booking conflicts when multiple users request same device", async () => {
    // Step 1: Create a popular device
    const device = await createTestDevice({
      name: "MacBook Pro M3 Max",
      category: "laptop",
      brand: "Apple",
    });

    // Step 2: First user submits request
    const firstUserRequest = createBorrowRequest({
      device_id: device.id,
      start_date: daysFromNow(1),
      end_date: daysFromNow(7),
      reason: "Development work",
    });

    const firstResponse = await api.post<BorrowRequestWithDetails>(
      "/api/borrow",
      firstUserRequest,
      userToken,
    );
    expect(firstResponse.status).toBe(201);
    createdBorrowRequestIds.push(firstResponse.data.data!.id);

    // Step 3: Second user tries to request same device for overlapping dates
    const secondUser = await createTestUser();
    const secondUserRequest = createBorrowRequest({
      device_id: device.id,
      start_date: daysFromNow(3), // Overlaps with first request
      end_date: daysFromNow(10),
      reason: "Testing work",
    });

    const secondResponse = await api.post<BorrowRequestWithDetails>(
      "/api/borrow",
      secondUserRequest,
      secondUser.token,
    );
    // Should fail due to booking conflict
    expect(secondResponse.status).toBe(400);
    expect(secondResponse.data.error).toContain("already booked");

    // Step 4: Second user requests for non-overlapping dates
    const nonOverlappingRequest = createBorrowRequest({
      device_id: device.id,
      start_date: daysFromNow(10), // After first request ends
      end_date: daysFromNow(17),
      reason: "Testing work - adjusted dates",
    });

    const thirdResponse = await api.post<BorrowRequestWithDetails>(
      "/api/borrow",
      nonOverlappingRequest,
      secondUser.token,
    );
    expect(thirdResponse.status).toBe(201);
    createdBorrowRequestIds.push(thirdResponse.data.data!.id);
  });
});

// ============================================================================
// Scenario 7: User Profile and Password Management
// ============================================================================

describe("Scenario: User Profile and Password Management", () => {
  it("should allow user to view and update their profile", async () => {
    // Step 1: Create a new user
    const newUser = await createTestUser();

    // Step 2: User views their profile
    const meResponse = await api.get<{ user: UserPublic }>(
      "/api/auth/me",
      newUser.token,
    );
    expect(meResponse.status).toBe(200);

    // Step 3: User updates their profile name
    const updateResponse = await api.put<UserPublic>(
      `/api/users/${newUser.user.id}`,
      { name: "Updated Name" },
      newUser.token,
    );
    expect(updateResponse.status).toBe(200);

    // Step 4: Verify profile was updated
    const verifyResponse = await api.get<UserPublic>(
      `/api/users/${newUser.user.id}`,
      newUser.token,
    );
    expect(verifyResponse.status).toBe(200);
  });
});

// ============================================================================
// Scenario 8: Superuser User Management
// ============================================================================

describe("Scenario: Superuser User Management", () => {
  it("should allow superuser to manage user accounts", async () => {
    // Step 1: Superuser views all users
    const usersResponse = await api.get<UserPublic[]>(
      "/api/users",
      superuserToken,
    );
    expect(usersResponse.status).toBe(200);
    expect(Array.isArray(usersResponse.data.data)).toBe(true);

    // Step 2: Create a test user to manage
    const testUser = await createTestUser();

    // Step 3: Superuser views specific user
    const userDetailResponse = await api.get<UserPublic>(
      `/api/users/${testUser.user.id}`,
      superuserToken,
    );
    expect(userDetailResponse.status).toBe(200);
    expect(userDetailResponse.data.data?.id).toBe(testUser.user.id);

    // Step 4: Superuser deactivates user account
    const deactivateResponse = await api.patch<UserPublic>(
      `/api/users/${testUser.user.id}/status`,
      { is_active: false },
      superuserToken,
    );
    expect(deactivateResponse.status).toBe(200);
    // MySQL returns 0/1 for boolean, so check for falsy value
    expect(deactivateResponse.data.data?.is_active).toBeFalsy();

    // Step 5: Deactivated user cannot login (returns 401 or 403)
    const loginAttempt = await api.post(
      "/api/auth/login",
      {
        email: testUser.user.email,
        password: "password123",
      },
    );
    expect([401, 403]).toContain(loginAttempt.status);

    // Step 6: Superuser reactivates user account
    const reactivateResponse = await api.patch<UserPublic>(
      `/api/users/${testUser.user.id}/status`,
      { is_active: true },
      superuserToken,
    );
    expect(reactivateResponse.status).toBe(200);
    expect(reactivateResponse.data.data?.is_active).toBeTruthy();

    // Step 7: Superuser resets user password
    const resetPasswordResponse = await api.patch(
      `/api/users/${testUser.user.id}/password`,
      { password: "resetPassword789" },
      superuserToken,
    );
    expect(resetPasswordResponse.status).toBe(200);
  });
});

// ============================================================================
// Scenario 9: Complete Device Lifecycle
// ============================================================================

describe("Scenario: Complete Device Lifecycle", () => {
  it("should track device through entire lifecycle from purchase to multiple loans", async () => {
    // Step 1: Admin adds new device to inventory
    const device = await createTestDevice({
      name: "ThinkPad X1 Carbon Gen 11",
      category: "laptop",
      brand: "Lenovo",
      model: "X1 Carbon Gen 11",
      purchase_price: 1849.00,
    });
    expect(device.status).toBe("available");

    // Step 2: First user borrows the device
    const firstBorrow = createBorrowRequest({
      device_id: device.id,
      start_date: daysFromNow(1),
      end_date: daysFromNow(14),
      reason: "Development sprint 1",
    });

    const firstBorrowResponse = await api.post<BorrowRequestWithDetails>(
      "/api/borrow",
      firstBorrow,
      userToken,
    );
    createdBorrowRequestIds.push(firstBorrowResponse.data.data!.id);

    // Approve and activate
    await api.patch(
      `/api/borrow/${firstBorrowResponse.data.data?.id}/status`,
      { status: "approved" },
      adminToken,
    );
    await api.patch(
      `/api/borrow/${firstBorrowResponse.data.data?.id}/status`,
      { status: "active" },
      adminToken,
    );

    // Step 3: First user returns device in good condition
    await api.post(
      "/api/returns",
      {
        borrow_request_id: firstBorrowResponse.data.data?.id,
        condition: "good",
        notes: "Device working perfectly",
      },
      userToken,
    );

    // Verify device is available again
    let deviceStatus = await api.get<DeviceWithDepartment>(`/api/devices/${device.id}`);
    expect(deviceStatus.data.data?.status).toBe("available");

    // Step 4: Second user borrows the same device
    const secondUser = await createTestUser();
    const secondBorrow = createBorrowRequest({
      device_id: device.id,
      start_date: daysFromNow(1),
      end_date: daysFromNow(7),
      reason: "QA testing",
    });

    const secondBorrowResponse = await api.post<BorrowRequestWithDetails>(
      "/api/borrow",
      secondBorrow,
      secondUser.token,
    );
    createdBorrowRequestIds.push(secondBorrowResponse.data.data!.id);

    // Approve and activate
    await api.patch(
      `/api/borrow/${secondBorrowResponse.data.data?.id}/status`,
      { status: "approved" },
      adminToken,
    );
    await api.patch(
      `/api/borrow/${secondBorrowResponse.data.data?.id}/status`,
      { status: "active" },
      adminToken,
    );

    // Step 5: Second user returns with minor wear
    await api.post(
      "/api/returns",
      {
        borrow_request_id: secondBorrowResponse.data.data?.id,
        condition: "fair",
        notes: "Minor scratches on lid, fully functional",
      },
      secondUser.token,
    );

    // Verify device is still available (fair condition doesn't trigger maintenance)
    deviceStatus = await api.get<DeviceWithDepartment>(`/api/devices/${device.id}`);
    expect(deviceStatus.data.data?.status).toBe("available");
  });
});

// ============================================================================
// Scenario 10: Renewal Request Rejection
// ============================================================================

describe("Scenario: Renewal Request Rejection", () => {
  it("should handle rejected renewal and allow user to return device on time", async () => {
    // Step 1: Create device and active loan
    const device = await createTestDevice({ category: "accessories" });
    
    const borrowData = createBorrowRequest({
      device_id: device.id,
      start_date: daysFromNow(1),
      end_date: daysFromNow(7),
      reason: "Testing accessories",
    });

    const borrowResponse = await api.post<BorrowRequestWithDetails>(
      "/api/borrow",
      borrowData,
      userToken,
    );
    createdBorrowRequestIds.push(borrowResponse.data.data!.id);

    // Approve and activate
    await api.patch(
      `/api/borrow/${borrowResponse.data.data?.id}/status`,
      { status: "approved" },
      adminToken,
    );
    await api.patch(
      `/api/borrow/${borrowResponse.data.data?.id}/status`,
      { status: "active" },
      adminToken,
    );

    // Step 2: User requests renewal
    const renewalResponse = await api.post<RenewalRequestWithDetails>(
      "/api/renewals",
      {
        borrow_request_id: borrowResponse.data.data?.id,
        requested_end_date: daysFromNow(30),
        reason: "Would like to keep device longer",
      },
      userToken,
    );
    expect(renewalResponse.status).toBe(201);

    // Step 3: Admin rejects renewal (device needed by another team)
    const rejectResponse = await api.patch<RenewalRequestWithDetails>(
      `/api/renewals/${renewalResponse.data.data?.id}/status`,
      { status: "rejected" },
      adminToken,
    );
    expect(rejectResponse.status).toBe(200);
    expect(rejectResponse.data.data?.status).toBe("rejected");

    // Step 4: Verify original end date unchanged
    const borrowStatus = await api.get<BorrowRequestWithDetails>(
      `/api/borrow/${borrowResponse.data.data?.id}`,
      userToken,
    );
    expect(borrowStatus.data.data?.end_date).toBe(borrowResponse.data.data?.end_date);

    // Step 5: User returns device on original due date
    const returnResponse = await api.post<ReturnRequestWithDetails>(
      "/api/returns",
      {
        borrow_request_id: borrowResponse.data.data?.id,
        condition: "excellent",
        notes: "Returning as scheduled",
      },
      userToken,
    );
    expect(returnResponse.status).toBe(201);
  });
});

// ============================================================================
// Scenario 11: Department-Based Device Filtering
// ============================================================================

describe("Scenario: Department-Based Device Filtering", () => {
  it("should allow users to browse devices by department", async () => {
    // Step 1: Get list of departments
    const departmentsResponse = await api.get<{ id: number; name: string }[]>(
      "/api/departments",
      userToken,
    );
    expect(departmentsResponse.status).toBe(200);
    expect(Array.isArray(departmentsResponse.data.data)).toBe(true);

    // Step 2: Create devices in different departments
    const device1 = await createTestDevice({
      name: "Engineering Laptop",
      department_id: 1,
    });
    const device2 = await createTestDevice({
      name: "Design Workstation",
      department_id: 2,
    });

    // Step 3: Browse all devices
    const allDevicesResponse = await api.get<DeviceWithDepartment[]>(
      "/api/devices",
      userToken,
    );
    expect(allDevicesResponse.status).toBe(200);

    // Step 4: Verify devices have department information
    const createdDevices = allDevicesResponse.data.data?.filter(
      d => d.id === device1.id || d.id === device2.id
    );
    expect(createdDevices?.length).toBe(2);
    createdDevices?.forEach(device => {
      expect(device.department_name).toBeDefined();
    });
  });
});

// ============================================================================
// Scenario 12: Admin Request Queue Management
// ============================================================================

describe("Scenario: Admin Request Queue Management", () => {
  it("should allow admin to efficiently process multiple pending requests", async () => {
    // Step 1: Create multiple devices
    const devices = await Promise.all([
      createTestDevice({ name: "Request Queue Device 1" }),
      createTestDevice({ name: "Request Queue Device 2" }),
      createTestDevice({ name: "Request Queue Device 3" }),
    ]);

    // Step 2: Multiple users submit requests
    const user1 = await createTestUser();
    const user2 = await createTestUser();

    const requests = await Promise.all([
      api.post<BorrowRequestWithDetails>(
        "/api/borrow",
        createBorrowRequest({
          device_id: devices[0].id,
          start_date: daysFromNow(1),
          end_date: daysFromNow(7),
          reason: "User 1 request",
        }),
        user1.token,
      ),
      api.post<BorrowRequestWithDetails>(
        "/api/borrow",
        createBorrowRequest({
          device_id: devices[1].id,
          start_date: daysFromNow(1),
          end_date: daysFromNow(7),
          reason: "User 2 request",
        }),
        user2.token,
      ),
      api.post<BorrowRequestWithDetails>(
        "/api/borrow",
        createBorrowRequest({
          device_id: devices[2].id,
          start_date: daysFromNow(1),
          end_date: daysFromNow(7),
          reason: "User 1 second request",
        }),
        user1.token,
      ),
    ]);

    requests.forEach(r => {
      if (r.data.data?.id) createdBorrowRequestIds.push(r.data.data.id);
    });

    // Step 3: Admin views all pending requests
    const pendingResponse = await api.get<BorrowRequestWithDetails[]>(
      "/api/borrow",
      adminToken,
      { status: "pending" },
    );
    expect(pendingResponse.status).toBe(200);

    // Step 4: Admin batch processes requests
    const requestIds = requests.map(r => r.data.data?.id).filter(Boolean);
    
    // Approve first two, reject third
    await api.patch(
      `/api/borrow/${requestIds[0]}/status`,
      { status: "approved" },
      adminToken,
    );
    await api.patch(
      `/api/borrow/${requestIds[1]}/status`,
      { status: "approved" },
      adminToken,
    );
    await api.patch(
      `/api/borrow/${requestIds[2]}/status`,
      { status: "rejected" },
      adminToken,
    );

    // Step 5: Verify request statuses
    const updatedRequests = await Promise.all(
      requestIds.map(id => api.get<BorrowRequestWithDetails>(`/api/borrow/${id}`, adminToken))
    );

    expect(updatedRequests[0].data.data?.status).toBe("approved");
    expect(updatedRequests[1].data.data?.status).toBe("approved");
    expect(updatedRequests[2].data.data?.status).toBe("rejected");
  });
});
