/**
 * Test Utilities Index
 *
 * Re-exports all test utilities for convenient imports.
 */

// API Client
export { TestApiClient, testApiClient } from "./api-client";
export type { TestResponse, LoginResult } from "./api-client";

// Factories
export {
  createUser,
  createDevice,
  createBorrowRequest,
  createReturnRequest,
  createRenewalRequest,
  createUsers,
  createDevices,
  createBorrowRequests,
  resetFactoryCounter,
} from "./factories";

// Generators
export {
  validEmailArb,
  validUsernameArb,
  validEmailOrUsernameArb,
  invalidEmailArb,
  validDateRangeArb,
  invalidDateRangeArb,
  validCategoryArb,
  invalidCategoryArb,
  validStatusTransitionArb,
  invalidStatusTransitionArb,
  validDepartmentNameArb,
  invalidDepartmentNameArb,
  validPasswordArb,
  invalidPasswordArb,
  validIdArb,
  invalidIdFormatArb,
  validPriceArb,
  invalidPriceArb,
  validConditionArb,
  nonDamagedConditionArb,
  invalidTokenArb,
} from "./generators";

// Helpers
export {
  setupTestContext,
  setupTestContextWithDevice,
  assertSuccess,
  assertError,
  assertUnauthorized,
  assertForbidden,
  assertNotFound,
  assertBadRequest,
  today,
  daysFromNow,
  daysAgo,
  deleteDevice,
  deleteUser,
  wait,
  randomString,
  randomEmail,
  randomAssetTag,
  uniqueAssetTag,
  propertyTestConfig,
  getPropertyTestConfig,
  createTestDevice,
  createTestUser,
  createTestBorrowRequest,
  createActiveBorrowRequest,
  createdDeviceIds,
  createdBorrowRequestIds,
  createdUserIds,
  resetCleanupArrays,
  cleanupResources,
} from "./helpers";
export type { TestContext } from "./helpers";
