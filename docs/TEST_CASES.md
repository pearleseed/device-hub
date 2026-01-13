# Test Cases Documentation

This document contains all test cases for the Device Hub application, organized by test suite and category.

---

## Table of Contents

1. [API Tests](#api-tests)
   - [Authentication Tests](#authentication-tests)
   - [Borrow Request Tests](#borrow-request-tests)
   - [Department Tests](#department-tests)
   - [Device Tests](#device-tests)
   - [Edge Case Tests](#edge-case-tests)
   - [Error Handling Tests](#error-handling-tests)
   - [Notification Tests](#notification-tests)
   - [Renewal Tests](#renewal-tests)
   - [Return Tests](#return-tests)
   - [User Tests](#user-tests)
2. [Integration Tests](#integration-tests)
   - [API Client Tests](#api-client-tests)
   - [React Query Hooks Tests](#react-query-hooks-tests)
3. [Property Tests](#property-tests)
   - [Authorization Property Tests](#authorization-property-tests)
   - [Validation Property Tests](#validation-property-tests)
4. [Scenario Tests](#scenario-tests)
   - [Concurrent Operations Tests](#concurrent-operations-tests)
   - [User Workflow Tests](#user-workflow-tests)

---

## API Tests

### Authentication Tests

**File:** `tests/api/auth.test.ts`
**Requirements:** 1.1-1.10

#### Login Tests (Requirements 1.1, 1.2, 1.3)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| AUTH-001 | should return token and user data for valid credentials | Login with valid email and password | Status 200, returns token and user data | Req 1.1 |
| AUTH-002 | should return 401 for invalid credentials | Login with wrong password | Status 401, success: false | Req 1.2 |
| AUTH-003 | should return 401 for non-existent user | Login with non-existent email | Status 401, success: false | Req 1.2 |
| AUTH-004 | should return 400 for missing email | Login without email field | Status 400, success: false | - |
| AUTH-005 | should return 400 for missing password | Login without password field | Status 400, success: false | - |

#### Signup Tests (Requirements 1.4, 1.5, 1.6)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| AUTH-006 | should create user and return token for valid signup data | Signup with valid data | Status 201, returns token and user | Req 1.4 |
| AUTH-007 | should return 400 for duplicate email | Signup with existing email | Status 400, error contains "email" | Req 1.5 |
| AUTH-008 | should return 400 for password less than 6 characters | Signup with short password | Status 400, error contains "6" | Req 1.6 |
| AUTH-009 | should return 400 for missing name | Signup without name | Status 400, success: false | - |
| AUTH-010 | should return 400 for missing email | Signup without email | Status 400, success: false | - |
| AUTH-011 | should return 400 for invalid department | Signup with non-existent department | Status 400, success: false | - |

#### Token Validation Tests (Requirements 1.7, 1.8)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| AUTH-012 | should return user data for valid token | GET /api/auth/me with valid token | Status 200, returns user data | Req 1.7 |
| AUTH-013 | should return 401 for invalid token | GET /api/auth/me with invalid token | Status 401, success: false | Req 1.8 |
| AUTH-014 | should return 401 for missing token | GET /api/auth/me without token | Status 401, success: false | Req 1.8 |
| AUTH-015 | should return 401 for malformed JWT token | GET /api/auth/me with malformed JWT | Status 401, success: false | Req 1.8 |

#### Password Change Tests (Requirements 1.9, 1.10)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| AUTH-016 | should allow password change with correct current password | Change password with valid current password | Status 200, new password works | Req 1.9 |
| AUTH-017 | should return 401 for incorrect current password | Change password with wrong current password | Status 401, error defined | Req 1.10 |
| AUTH-018 | should return 401 for missing token | Change password without authentication | Status 401, success: false | - |
| AUTH-019 | should return 400 for new password less than 6 characters | Change to short password | Status 400, success: false | - |
| AUTH-020 | should return 400 for missing current password | Change password without current password | Status 400, success: false | - |

#### Property Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| AUTH-P01 | Property 1: Authentication Token Validity | For any valid user, login token should work with /api/auth/me | Token from login works for /me endpoint | Req 1.1, 1.7 |

---

### Borrow Request Tests

**File:** `tests/api/borrow.test.ts`
**Requirements:** 4.1-4.11

#### Listing Tests (Requirements 4.1, 4.2)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| BOR-001 | should return all borrow requests for admin | Admin lists all borrow requests | Status 200, returns array with all requests | Req 4.1 |
| BOR-002 | should return only own requests for non-admin | User lists borrow requests | Status 200, returns only user's requests | Req 4.2 |
| BOR-003 | should return 401 for unauthenticated request | List without token | Status 401, success: false | - |
| BOR-004 | should filter by status parameter | Filter by pending status | Status 200, all results have pending status | - |
| BOR-005 | should filter by device_id parameter | Filter by device ID | Status 200, all results match device ID | - |

#### Creation Tests (Requirements 4.3, 4.4, 4.5, 4.6)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| BOR-006 | should create request for available device | Create borrow request for available device | Status 201, status is "pending" | Req 4.3 |
| BOR-007 | should return 400 for unavailable device | Create request for borrowed device | Status 400, success: false | Req 4.4 |
| BOR-008 | should return 400 for invalid date range (end before start) | Create with end date before start | Status 400, error contains "date" | Req 4.5 |
| BOR-009 | should return 400 for conflicting booking | Create overlapping request | Status 400, error contains "booked" | Req 4.6 |
| BOR-010 | should return 401 for unauthenticated request | Create without token | Status 401, success: false | - |
| BOR-011 | should return 404 for non-existent device | Create for non-existent device | Status 404, success: false | - |
| BOR-012 | should return 400 for missing required fields | Create without required fields | Status 400, success: false | - |

#### Status Transition Tests (Requirements 4.7, 4.8, 4.9, 4.10)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| BOR-013 | should allow admin to approve pending request | Admin approves pending request | Status 200, status is "approved" | Req 4.7 |
| BOR-014 | should allow admin to activate approved request | Admin activates approved request | Status 200, status is "active", device is "borrowed" | Req 4.8 |
| BOR-015 | should allow returning active request | Return active request | Status 200, status is "returned", device is "available" | Req 4.9 |
| BOR-016 | should return 400 for invalid status transition | Activate pending request directly | Status 400, error contains "transition" | Req 4.10 |
| BOR-017 | should return 400 for transitioning from returned status | Change status from returned | Status 400, success: false | - |
| BOR-018 | should return 400 for transitioning from rejected status | Change status from rejected | Status 400, success: false | - |
| BOR-019 | should return 403 for non-admin approving request | User tries to approve | Status 403, success: false | - |
| BOR-020 | should return 401 for unauthenticated status update | Update status without token | Status 401, success: false | - |
| BOR-021 | should return 404 for non-existent request | Update non-existent request | Status 404, success: false | - |
| BOR-022 | should return 400 for invalid request ID format | Update with invalid ID | Status 400, success: false | - |
| BOR-023 | should return 400 for invalid status value | Update with invalid status | Status 400, success: false | - |

#### User-Specific Request Tests (Requirement 4.11)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| BOR-024 | should return requests for specified user | Get user's requests | Status 200, all requests belong to user | Req 4.11 |
| BOR-025 | should allow admin to view any user requests | Admin views user's requests | Status 200, success: true | - |
| BOR-026 | should return 403 for non-admin viewing other user requests | User views other's requests | Status 403, success: false | - |
| BOR-027 | should return 401 for unauthenticated request | Get user requests without token | Status 401, success: false | - |
| BOR-028 | should return 400 for invalid user ID format | Get with invalid user ID | Status 400, success: false | - |

#### Real-World Scenarios

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| BOR-029 | should return 400 for start_date in the past | Create with past start date | Status 400, success: false | - |
| BOR-030 | should return 400 for borrowing maintenance device | Borrow device in maintenance | Status 400, success: false | - |
| BOR-031 | should allow booking if start_date is same as today | Create with today's date | Status 201, success: true | - |
| BOR-032 | should correctly handle 'sandwich' booking overlaps | Test overlapping bookings | Overlapping request fails with 400 | - |

#### Property Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| BOR-P01 | Property 10: Borrow Request Visibility | Admin sees all, user sees own | Correct visibility per role | Req 4.1, 4.2 |
| BOR-P02 | Property 12: Date Range Validation | Invalid date ranges fail | Status 400 for end < start | Req 4.5, 12.3, 12.4 |
| BOR-P03 | Property 13: Status Transition Validation | Valid transitions succeed, invalid fail | Correct status codes | Req 4.10, 12.7, 12.8 |

---

### Department Tests

**File:** `tests/api/departments.test.ts`
**Requirements:** 7.1-7.8

#### Names Listing Tests (Requirement 7.1)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| DEP-001 | should return valid department names | Get department names | Status 200, contains QA, DEV, CG, ADMIN, STG | Req 7.1 |
| DEP-002 | should return names without authentication | Get names without token | Status 200, success: true | - |

#### Listing Tests (Requirement 7.2)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| DEP-003 | should return all departments with user and device counts | List all departments | Status 200, includes user_count and device_count | Req 7.2 |
| DEP-004 | should return departments without authentication | List without token | Status 200, success: true | - |

#### Retrieval Tests (Requirement 7.3)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| DEP-005 | should return department with counts for valid ID | Get department by ID | Status 200, includes counts | Req 7.3 |
| DEP-006 | should return 404 for non-existent department ID | Get non-existent department | Status 404, success: false | - |
| DEP-007 | should return 400 for invalid department ID format | Get with invalid ID | Status 400, success: false | - |

#### CRUD Tests (Requirements 7.4, 7.5, 7.6, 7.7, 7.8)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| DEP-008 | should allow admin to create department with valid name and unique code | Admin creates department | Status 201, success: true | Req 7.4 |
| DEP-009 | should return 400 for invalid department name | Create with invalid name | Status 400, error contains "Invalid department name" | Req 7.5 |
| DEP-010 | should return 400 for duplicate department code | Create with duplicate code | Status 400, error contains "already exists" | Req 7.6 |
| DEP-011 | should return 401 for non-admin creating department | User creates department | Status 401, success: false | - |
| DEP-012 | should return 401 for unauthenticated request | Create without token | Status 401, success: false | - |
| DEP-013 | should return 400 for missing name | Create without name | Status 400, error contains "Name" | - |
| DEP-014 | should return 400 for missing code | Create without code | Status 400, error contains "Code" | - |
| DEP-015 | should allow admin to delete empty department | Admin deletes empty department | Status 200, department deleted | Req 7.7 |
| DEP-016 | should return 400 for deleting department with users or devices | Delete non-empty department | Status 400, error contains "users or devices" | Req 7.8 |
| DEP-017 | should return 401 for non-admin deleting department | User deletes department | Status 401, success: false | - |
| DEP-018 | should return 400 for invalid department ID format on delete | Delete with invalid ID | Status 400, success: false | - |
| DEP-019 | should return 404 for deleting non-existent department | Delete non-existent | Status 200 or 404 | - |

#### Property Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| DEP-P01 | Property 18: Department Listing with Counts | All departments include counts | user_count and device_count present | Req 7.2 |
| DEP-P02 | Property 19: Department Name Validation | Invalid names rejected, valid accepted | Correct status codes | Req 7.5 |

---

### Device Tests

**File:** `tests/api/devices.test.ts`
**Requirements:** 2.1-2.13

#### Listing Tests (Requirements 2.1, 2.2, 2.3, 2.4, 2.5)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| DEV-001 | should return all devices with department information | List all devices | Status 200, devices have department info | Req 2.1 |
| DEV-002 | should filter devices by category | Filter by laptop category | Status 200, all results are laptops | Req 2.2 |
| DEV-003 | should filter devices by status | Filter by available status | Status 200, all results are available | Req 2.3 |
| DEV-004 | should filter devices by search parameter | Search by name | Status 200, results match search term | Req 2.4 |
| DEV-005 | should filter devices by price range | Filter by min/max price | Status 200, all results within range | Req 2.5 |
| DEV-006 | should filter devices by minimum price only | Filter by min price | Status 200, all results >= min price | - |
| DEV-007 | should filter devices by maximum price only | Filter by max price | Status 200, all results < max price | - |
| DEV-008 | should combine multiple filters | Filter by category and status | Status 200, results match all filters | - |

#### Retrieval Tests (Requirements 2.6, 2.7)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| DEV-009 | should return device with parsed specs for valid ID | Get device by ID | Status 200, includes specs | Req 2.6 |
| DEV-010 | should return 404 for non-existent device ID | Get non-existent device | Status 404, success: false | Req 2.7 |
| DEV-011 | should return 400 for invalid device ID format | Get with invalid ID | Status 400, success: false | - |

#### CRUD Tests (Requirements 2.8, 2.9, 2.10, 2.11, 2.12, 2.13)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| DEV-012 | should allow admin to create a device | Admin creates device | Status 201, device created | Req 2.8 |
| DEV-013 | should return 401 for non-admin creating device | User creates device | Status 401, success: false | Req 2.9 |
| DEV-014 | should return 401 for unauthenticated user creating device | Create without token | Status 401, success: false | - |
| DEV-015 | should return 400 for duplicate asset_tag | Create with duplicate tag | Status 400, error contains "Asset tag" | Req 2.10 |
| DEV-016 | should return 400 for missing required fields | Create without required fields | Status 400, success: false | - |
| DEV-017 | should allow admin to update a device | Admin updates device | Status 200, device updated | Req 2.11 |
| DEV-018 | should return 401 for non-admin updating device | User updates device | Status 401, success: false | - |
| DEV-019 | should return 400 for duplicate asset_tag on update | Update to duplicate tag | Status 400, error contains "Asset tag" | - |
| DEV-020 | should allow admin to delete device without active requests | Admin deletes device | Status 200, device deleted | Req 2.12 |
| DEV-021 | should return 401 for non-admin deleting device | User deletes device | Status 401, success: false | - |
| DEV-022 | should return 400 for invalid device ID format on delete | Delete with invalid ID | Status 400, success: false | - |

#### Property Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| DEV-P01 | Property 4: Device Filtering Consistency | Filtered results match criteria | All results match filter | Req 2.2, 2.3, 2.4, 2.5 |
| DEV-P02 | Property 5: Device Retrieval by ID | Existing IDs return device, non-existent return 404 | Correct responses | Req 2.6, 2.7 |

---

### Edge Case Tests

**File:** `tests/api/edge-cases.test.ts`

#### Special Characters and Unicode Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| EDGE-001 | should handle user name with unicode characters | Signup with unicode name | Status 201, success: true | - |
| EDGE-002 | should handle user name with emojis | Signup with emoji in name | Status 201, success: true | - |
| EDGE-003 | should handle user name with only whitespace | Signup with whitespace name | Status 400, success: false | - |
| EDGE-004 | should handle device name with special characters | Create device with special chars | Status 201, success: true | - |
| EDGE-005 | should handle device name with unicode | Create device with unicode | Status 201, success: true | - |
| EDGE-006 | should handle search with SQL injection attempt | Search with SQL injection | Status 200, no crash | - |
| EDGE-007 | should handle search with regex special characters | Search with regex chars | Status 200, success: true | - |

#### Boundary Value Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| EDGE-008 | should handle zero purchase price | Create device with price 0 | Status 200 or 201 | - |
| EDGE-009 | should handle very large purchase price | Create with max price | Status 201, success: true | - |
| EDGE-010 | should handle decimal purchase price | Create with decimal price | Status 201, success: true | - |
| EDGE-011 | should reject negative purchase price | Create with negative price | Status 400, success: false | - |
| EDGE-012 | should handle very long device name | Create with 500 char name | Status 200, 201, 400, or 500 | - |
| EDGE-013 | should handle minimum length password (6 chars) | Signup with 6 char password | Status 201, success: true | - |
| EDGE-014 | should reject password with 5 characters | Signup with 5 char password | Status 400, success: false | - |
| EDGE-015 | should handle same start and end date for borrow | Borrow with same day | Status 200, 201, or 400 | - |
| EDGE-016 | should handle far future dates | Borrow with 2030 dates | Status 200, 201, or 400 | - |

#### Empty and Null Value Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| EDGE-017 | should reject empty device name | Create with empty name | Status 400, success: false | - |
| EDGE-018 | should reject empty email | Login with empty email | Status 400, success: false | - |
| EDGE-019 | should reject empty password | Login with empty password | Status 400, success: false | - |
| EDGE-020 | should reject empty borrow reason | Borrow with empty reason | Status 400, success: false | - |
| EDGE-021 | should handle null device_id in borrow request | Borrow with null device_id | Status 400, success: false | - |
| EDGE-022 | should handle empty body on login | Login with {} | Status 400, success: false | - |
| EDGE-023 | should handle empty body on device creation | Create device with {} | Status 400, success: false | - |

#### Authorization Edge Cases

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| EDGE-024 | should reject expired-looking token format | Use expired-looking token | Status 401, success: false | - |
| EDGE-025 | should reject token with Bearer prefix missing | Token without Bearer | Status 401 | - |
| EDGE-026 | should reject token with wrong Bearer casing | Token with lowercase bearer | Status 200 or 401 | - |
| EDGE-027 | should prevent user from accessing admin endpoints | User accesses /api/users | Status 403, success: false | - |
| EDGE-028 | should prevent admin from deleting users (superuser only) | Admin deletes user | Status 403, success: false | - |
| EDGE-029 | should allow superuser to access admin endpoints | Superuser accesses /api/users | Status 200, success: true | - |
| EDGE-030 | should prevent superuser from deleting own account | Superuser self-delete | Status 400, error contains "own account" | - |
| EDGE-031 | should prevent superuser from locking own account | Superuser self-lock | Status 400, error contains "own account" | - |

#### Resource State Edge Cases

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| EDGE-032 | should not allow borrowing a device that is in maintenance | Borrow maintenance device | Status 400, success: false | - |
| EDGE-033 | should not allow borrowing an already borrowed device | Borrow borrowed device | Status 400, success: false | - |
| EDGE-034 | should return 404 for non-existent device | Get device 999999 | Status 404, success: false | - |
| EDGE-035 | should return 404 for non-existent user | Get user 999999 | Status 404, success: false | - |
| EDGE-036 | should return 404 for non-existent borrow request | Get borrow 999999 | Status 404, success: false | - |
| EDGE-037 | should return 400 for borrowing non-existent device | Borrow device 999999 | Status 404, success: false | - |

#### Duplicate and Conflict Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| EDGE-038 | should reject signup with existing email | Duplicate email signup | Status 400, error contains "email" | - |
| EDGE-039 | should reject signup with existing email (case insensitive) | Duplicate email different case | Status 400, error contains "email" | - |
| EDGE-040 | should reject device with existing asset tag | Duplicate asset tag | Status 400, error contains "Asset tag" | - |
| EDGE-041 | should reject duplicate pending renewal for same borrow request | Duplicate renewal | Status 400, error contains "pending" | - |

#### Filter and Query Edge Cases

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| EDGE-042 | should handle invalid category filter gracefully | Filter by invalid category | Status 200, empty array | - |
| EDGE-043 | should handle invalid status filter gracefully | Filter by invalid status | Status 200, empty array | - |
| EDGE-044 | should handle non-numeric price filter | Filter with non-numeric price | Status 200 or 400 | - |
| EDGE-045 | should handle multiple conflicting filters | Filter with min > max price | Status 200, empty array | - |

#### HTTP Method Edge Cases

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| EDGE-046 | should return 404 for unsupported HTTP method on devices | PATCH /api/devices | Status 404 or 405 | - |
| EDGE-047 | should handle OPTIONS request for CORS | OPTIONS /api/devices | Status 200 or 204 | - |

---

### Error Handling Tests

**File:** `tests/api/error-handling.test.ts`
**Requirements:** 10.1, 10.2, 10.3, 10.4

#### Malformed JSON Tests (Requirement 10.1)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| ERR-001 | should return error for malformed JSON on POST /api/auth/login | Send invalid JSON to login | Status 400 or 500, success: false | Req 10.1 |
| ERR-002 | should return error for malformed JSON on POST /api/devices | Send invalid JSON to devices | Status 400 or 500, success: false | Req 10.1 |
| ERR-003 | should return error for malformed JSON on POST /api/borrow | Send invalid JSON to borrow | Status 400 or 500, success: false | Req 10.1 |

#### Missing Required Fields Tests (Requirement 10.2)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| ERR-004 | should return 400 when email is missing (login) | Login without email | Status 400, success: false | Req 10.2 |
| ERR-005 | should return 400 when password is missing (login) | Login without password | Status 400, success: false | Req 10.2 |
| ERR-006 | should return 400 when name is missing (signup) | Signup without name | Status 400, success: false | Req 10.2 |
| ERR-007 | should return 400 when email is missing (signup) | Signup without email | Status 400, success: false | Req 10.2 |
| ERR-008 | should return 400 when password is missing (signup) | Signup without password | Status 400, success: false | Req 10.2 |
| ERR-009 | should return 400 when name is missing (device) | Create device without name | Status 400, error contains "Name" | Req 10.2 |
| ERR-010 | should return 400 when asset_tag is missing (device) | Create device without asset_tag | Status 400, error contains "Asset tag" | Req 10.2 |
| ERR-011 | should return 400 when category is missing (device) | Create device without category | Status 400, error contains "Category" | Req 10.2 |
| ERR-012 | should return 400 when brand is missing (device) | Create device without brand | Status 400, error contains "Brand" | Req 10.2 |
| ERR-013 | should return 400 when device_id is missing (borrow) | Borrow without device_id | Status 400, error contains "Device ID" | Req 10.2 |
| ERR-014 | should return 400 when start_date is missing (borrow) | Borrow without start_date | Status 400, error contains "Start date" | Req 10.2 |
| ERR-015 | should return 400 when end_date is missing (borrow) | Borrow without end_date | Status 400, error contains "End date" | Req 10.2 |
| ERR-016 | should return 400 when reason is missing (borrow) | Borrow without reason | Status 400, error contains "Reason" | Req 10.2 |

#### Invalid ID Format Tests (Requirement 10.3)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| ERR-017 | should return 400 for non-numeric device ID "abc" | GET /api/devices/abc | Status 400, error contains "Invalid" | Req 10.3 |
| ERR-018 | should return 400 for empty device ID | GET /api/devices/ | Status 400 or 404 | Req 10.3 |
| ERR-019 | should return 400 for decimal device ID "1.5" | GET /api/devices/1.5 | Status 200, 400, or 404 | Req 10.3 |
| ERR-020 | should return 400 for non-numeric user ID "abc" | GET /api/users/abc | Status 400, error contains "Invalid" | Req 10.3 |
| ERR-021 | should return 400 for special characters in user ID | GET /api/users/!@# | Status 400, success: false | Req 10.3 |
| ERR-022 | should return 400 for non-numeric borrow request ID | GET /api/borrow/invalid | Status 400, error contains "Invalid" | Req 10.3 |
| ERR-023 | should return 400 for non-numeric user ID in borrow requests | GET /api/borrow/user/abc | Status 400, error contains "Invalid" | Req 10.3 |

#### Out-of-Range Values Tests (Requirement 10.4)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| ERR-024 | should return 400 for negative purchase price | Create device with -100 price | Status 400, error contains "price" | Req 10.4 |
| ERR-025 | should return 400 for password with 5 characters | Signup with 5 char password | Status 400, error contains "6" | Req 10.4 |
| ERR-026 | should return 400 for empty password | Signup with empty password | Status 400, success: false | Req 10.4 |
| ERR-027 | should return 400 when end_date is before start_date | Borrow with invalid dates | Status 400, error contains "date" | Req 10.4 |
| ERR-028 | should return 400 for non-existent department_id | Signup with invalid department | Status 400, success: false | Req 10.4 |

#### Property Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| ERR-P01 | Property 24: Missing Required Fields Validation | Omitting required fields returns 400 | Status 400 for missing fields | Req 10.2 |
| ERR-P02 | Property 25: Invalid ID Format Validation | Non-numeric IDs return 400 | Status 400 for invalid IDs | Req 10.3 |

---

### Notification Tests

**File:** `tests/api/notifications.test.ts`

#### Get All Notifications Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| NOT-001 | should return notifications for authenticated user | Get notifications with token | Status 200, returns array and unreadCount | - |
| NOT-002 | should return 401 for unauthenticated request | Get notifications without token | Status 401, success: false | - |
| NOT-003 | should support unread filter | Filter by unread=true | Status 200, all results have is_read: false | - |
| NOT-004 | should support pagination with limit and offset | Paginate with limit=5 | Status 200, max 5 results | - |

#### Unread Count Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| NOT-005 | should return unread count for authenticated user | Get unread count | Status 200, unreadCount is number | - |
| NOT-006 | should return 401 for unauthenticated request | Get count without token | Status 401, success: false | - |

#### Create Notification Tests (Admin Only)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| NOT-007 | should create notification when admin | Admin creates notification | Status 201, notification created | - |
| NOT-008 | should return 403 when non-admin tries to create | User creates notification | Status 403, success: false | - |
| NOT-009 | should return 400 for missing required fields | Create without required fields | Status 400, success: false | - |
| NOT-010 | should return 401 for unauthenticated request | Create without token | Status 401, success: false | - |

#### Mark as Read Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| NOT-011 | should mark notification as read for owner | Mark own notification read | Status 200, success: true | - |
| NOT-012 | should return 404 for non-existent notification | Mark non-existent as read | Status 404, success: false | - |
| NOT-013 | should return 404 when trying to mark another user's notification | Mark other's notification | Status 404, success: false | - |
| NOT-014 | should return 400 for invalid notification ID | Mark invalid ID as read | Status 400, success: false | - |

#### Mark All as Read Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| NOT-015 | should mark all notifications as read | Mark all read | Status 200, unreadCount becomes 0 | - |
| NOT-016 | should return 401 for unauthenticated request | Mark all without token | Status 401, success: false | - |

#### Delete Notification Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| NOT-017 | should delete notification for owner | Delete own notification | Status 200, success: true | - |
| NOT-018 | should return 404 for non-existent notification | Delete non-existent | Status 404, success: false | - |
| NOT-019 | should return 404 when trying to delete another user's notification | Delete other's notification | Status 404, success: false | - |

#### Clear All Notifications Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| NOT-020 | should clear all notifications for user | Clear all notifications | Status 200, list becomes empty | - |
| NOT-021 | should return 401 for unauthenticated request | Clear without token | Status 401, success: false | - |

#### Integration Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| NOT-022 | should create notification when borrow request is created | Create borrow request | Admin receives new_request notification | - |

---

### Renewal Tests

**File:** `tests/api/renewals.test.ts`
**Requirements:** 6.1-6.9

#### Listing Tests (Requirements 6.1, 6.2)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| REN-001 | should return all renewal requests for admin | Admin lists renewals | Status 200, returns all renewals | Req 6.1 |
| REN-002 | should return only own renewals for non-admin | User lists renewals | Status 200, returns only user's renewals | Req 6.2 |
| REN-003 | should return 401 for unauthenticated request | List without token | Status 401, success: false | - |
| REN-004 | should filter by status parameter | Filter by pending | Status 200, all results are pending | - |

#### Creation Tests (Requirements 6.3, 6.4, 6.5, 6.6, 6.7)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| REN-005 | should create renewal for active loan | Create renewal for active borrow | Status 201, status is "pending" | Req 6.3 |
| REN-006 | should return 400 for non-active loan | Create renewal for pending borrow | Status 400, error contains "active" | Req 6.4 |
| REN-007 | should return 403 for another user's loan | Create renewal for other's borrow | Status 403, success: false | Req 6.5 |
| REN-008 | should return 400 for invalid date (not after current end) | Create with date before current end | Status 400, error contains "after" | Req 6.6 |
| REN-009 | should return 400 for duplicate pending renewal | Create second pending renewal | Status 400, error contains "pending" | Req 6.7 |
| REN-010 | should return 401 for unauthenticated request | Create without token | Status 401, success: false | - |
| REN-011 | should return 404 for non-existent borrow request | Create for non-existent borrow | Status 404, success: false | - |
| REN-012 | should return 400 for missing required fields | Create without required fields | Status 400, success: false | - |

#### Status Update Tests (Requirements 6.8, 6.9)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| REN-013 | should update borrow end date when admin approves renewal | Admin approves renewal | Status 200, borrow end date updated | Req 6.8 |
| REN-014 | should not change borrow end date when admin rejects renewal | Admin rejects renewal | Status 200, borrow end date unchanged | Req 6.9 |
| REN-015 | should return 403 for non-admin updating status | User approves renewal | Status 403, success: false | - |
| REN-016 | should return 401 for unauthenticated status update | Update without token | Status 401, success: false | - |
| REN-017 | should return 404 for non-existent renewal request | Update non-existent | Status 404, success: false | - |
| REN-018 | should return 400 for invalid renewal ID format | Update with invalid ID | Status 400, success: false | - |
| REN-019 | should return 400 for invalid status value | Update with invalid status | Status 400, success: false | - |
| REN-020 | should return 400 for updating non-pending renewal | Update already processed | Status 400, error contains "pending" | - |

#### Property Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| REN-P01 | Property 16: Renewal Request Visibility | Admin sees all, user sees own | Correct visibility per role | Req 6.1, 6.2 |
| REN-P02 | Property 17: Renewal Date Validation | Invalid dates fail, valid succeed | Correct status codes | Req 6.6 |

---

### Return Tests

**File:** `tests/api/returns.test.ts`
**Requirements:** 5.1-5.7

#### Listing Tests (Requirements 5.1, 5.2)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| RET-001 | should return all return requests for admin | Admin lists returns | Status 200, returns all return requests | Req 5.1 |
| RET-002 | should return only own returns for non-admin | User lists returns | Status 200, returns only user's returns | Req 5.2 |
| RET-003 | should return 401 for unauthenticated request | List without token | Status 401, success: false | - |
| RET-004 | should filter by condition parameter | Filter by good condition | Status 200, all results have good condition | - |

#### Creation Tests (Requirements 5.3, 5.4, 5.5, 5.6, 5.7)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| RET-005 | should create return for active borrow request | Return active borrow | Status 201, borrow status is "returned" | Req 5.3 |
| RET-006 | should return 400 for non-active borrow request | Return pending borrow | Status 400, error contains "active" | Req 5.4 |
| RET-007 | should set device to maintenance for damaged condition | Return with damaged condition | Status 201, device status is "maintenance" | Req 5.5 |
| RET-008 | should set device to available for non-damaged condition | Return with excellent condition | Status 201, device status is "available" | Req 5.6 |
| RET-009 | should return 400 for duplicate return request | Return already returned | Status 400, success: false | Req 5.7 |
| RET-010 | should return 401 for unauthenticated request | Return without token | Status 401, success: false | - |
| RET-011 | should return 404 for non-existent borrow request | Return non-existent borrow | Status 404, success: false | - |
| RET-012 | should return 400 for missing required fields | Return without condition | Status 400, success: false | - |
| RET-013 | should return 400 for invalid condition value | Return with invalid condition | Status 400, success: false | - |
| RET-014 | should return 403 for returning another user's borrow request | Return other's borrow | Status 403, success: false | - |
| RET-015 | should allow admin to return any user's borrow request | Admin returns user's borrow | Status 201, success: true | - |

#### Real-World Scenarios

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| RET-016 | should enforce notes when condition is damaged | Return damaged without notes | Status 400, success: false | - |
| RET-017 | should set device to available when condition is fair | Return with fair condition | Status 201, device is "available" | - |

#### Property Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| RET-P01 | Property 14: Return Request Visibility | Admin sees all, user sees own | Correct visibility per role | Req 5.1, 5.2 |
| RET-P02 | Property 15: Non-Damaged Return Device Status | Non-damaged returns set device available | Device status is "available" | Req 5.6 |

---

### User Tests

**File:** `tests/api/users.test.ts`
**Requirements:** 3.1-3.12

#### Listing Tests (Requirements 3.1, 3.2)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| USR-001 | should return all users with department information for admin | Admin lists users | Status 200, users have department info | Req 3.1 |
| USR-002 | should return 403 for non-admin user | User lists users | Status 403, success: false | Req 3.2 |
| USR-003 | should return 401 for unauthenticated request | List without token | Status 401, success: false | - |

#### Retrieval Tests (Requirements 3.3, 3.4, 3.5)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| USR-004 | should allow user to view their own profile | User views own profile | Status 200, returns user data | Req 3.3 |
| USR-005 | should allow admin to view any user | Admin views user | Status 200, returns user data | Req 3.4 |
| USR-006 | should return 403 for non-admin viewing other user | User views other's profile | Status 403, success: false | Req 3.5 |
| USR-007 | should return 404 for non-existent user ID | Get non-existent user | Status 404, success: false | - |
| USR-008 | should return 400 for invalid user ID format | Get with invalid ID | Status 400, success: false | - |
| USR-009 | should return 401 for unauthenticated request | Get user without token | Status 401, success: false | - |

#### Management Tests (Requirements 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| USR-010 | should allow user to update their own profile | User updates own profile | Status 200, profile updated | Req 3.6 |
| USR-011 | should return 403 for non-admin updating other user | User updates other's profile | Status 403, success: false | - |
| USR-012 | should return 400 for no fields to update | Update with empty body | Status 400, error contains "No fields" | - |
| USR-013 | should allow superuser to reset password | Superuser resets password | Status 200, new password works | Req 3.7 |
| USR-014 | should return 403 for non-superuser resetting password | Admin resets password | Status 403, error contains "Superuser" | Req 3.8 |
| USR-015 | should return 403 for regular user resetting password | User resets password | Status 403, success: false | - |
| USR-016 | should return 400 for password less than 6 characters | Reset to short password | Status 400, error contains "6" | - |
| USR-017 | should allow superuser to toggle user status | Superuser locks/unlocks user | Status 200, is_active toggled | Req 3.9 |
| USR-018 | should return 400 for superuser toggling own status | Superuser self-lock | Status 400, error contains "own" | Req 3.10 |
| USR-019 | should return 403 for non-superuser toggling status | Admin toggles status | Status 403, error contains "Superuser" | - |
| USR-020 | should return 400 for invalid is_active value | Toggle with invalid value | Status 400, success: false | - |
| USR-021 | should allow superuser to delete user without active requests | Superuser deletes user | Status 200, user deleted | Req 3.11 |
| USR-022 | should return 403 for non-superuser deleting user | Admin deletes user | Status 403, error contains "Superuser" | - |
| USR-023 | should return 400 for superuser deleting own account | Superuser self-delete | Status 400, error contains "own" | - |
| USR-024 | should return 400 for invalid user ID format on delete | Delete with invalid ID | Status 400, success: false | - |

#### Property Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| USR-P01 | Property 7: Admin User Listing | Admin sees all, non-admin gets 403 | Correct access per role | Req 3.1, 3.2 |
| USR-P02 | Property 8: User Self-Access | Any user can access own profile | Status 200 for own profile | Req 3.3 |

---

## Integration Tests

### API Client Tests

**File:** `tests/integration/api-client.test.ts`
**Requirements:** 8.1, 8.2, 8.3, 8.4, 8.5, 8.6

#### Token Attachment Tests (Requirement 8.1)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| CLI-001 | should attach Authorization header when token is available | Request with token | Authorization header with Bearer prefix | Req 8.1 |
| CLI-002 | should not attach Authorization header when token is null | Request without token | No Authorization header | - |

#### 401 Response Handling Tests (Requirement 8.2)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| CLI-003 | should call onUnauthorized callback when receiving 401 | Receive 401 response | onUnauthorized callback called | Req 8.2 |
| CLI-004 | should throw ApiError with 401 status code | Receive 401 response | ApiError with statusCode 401 | Req 8.2 |

#### Successful Response Parsing Tests (Requirement 8.3)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| CLI-005 | should extract data from ApiResponse wrapper | Successful response | Returns data field content | Req 8.3 |
| CLI-006 | should handle empty data in successful response | Success with no data | Returns undefined | - |

#### Error Response Handling Tests (Requirement 8.4)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| CLI-007 | should throw ApiError with error message from response | Error response | ApiError with message and statusCode | Req 8.4 |
| CLI-008 | should use message field if error field is not present | Response with message | ApiError with message content | - |
| CLI-009 | should provide default message when no error or message field | Response without error/message | ApiError with default message | - |

#### Network Error Handling Tests (Requirement 8.5)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| CLI-010 | should throw NetworkError when fetch fails | Network failure | NetworkError thrown | Req 8.5 |
| CLI-011 | should include endpoint in NetworkError | Network failure | NetworkError with endpoint | Req 8.5 |

#### Content-Type Header Tests (Requirement 8.6)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| CLI-012 | should set Content-Type to application/json for POST requests | POST request | Content-Type: application/json | Req 8.6 |
| CLI-013 | should set Content-Type to application/json for PUT requests | PUT request | Content-Type: application/json | Req 8.6 |
| CLI-014 | should set Content-Type to application/json for PATCH requests | PATCH request | Content-Type: application/json | Req 8.6 |
| CLI-015 | should not set Content-Type for GET requests | GET request | No Content-Type header | - |
| CLI-016 | should not set Content-Type for DELETE requests | DELETE request | No Content-Type header | - |

#### Property Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| CLI-P01 | Property 20: API Client Token Attachment | All valid tokens attached with Bearer | Authorization header correct | Req 8.1 |
| CLI-P02 | Property 21: API Client Response Parsing | Data extracted from successful responses | Returns data field | Req 8.3 |
| CLI-P03 | Property 22: API Client Error Handling | Error responses throw ApiError | ApiError with message and status | Req 8.4 |
| CLI-P04 | Property 23: API Client Content-Type | POST/PUT/PATCH have Content-Type | application/json header set | Req 8.6 |

---

### React Query Hooks Tests

**File:** `tests/integration/hooks.test.ts`
**Requirements:** 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7

#### useDevices Hook Tests (Requirement 9.1)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| HK-001 | should fetch devices from the API and return typed data | Call useDevices | Returns device array | Req 9.1 |
| HK-002 | should fetch devices with filters | Call useDevices with filters | Returns filtered devices | Req 9.1 |
| HK-003 | should handle API errors gracefully | API returns error | isError is true | - |

#### useDevice Hook Tests (Requirement 9.2)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| HK-004 | should fetch a single device by ID | Call useDevice(1) | Returns single device | Req 9.2 |
| HK-005 | should not fetch when ID is 0 or negative | Call useDevice(0) | Query is idle | - |
| HK-006 | should handle device not found error | Device doesn't exist | isError is true | - |

#### useUsers Hook Tests (Requirement 9.3)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| HK-007 | should fetch all users from the API | Call useUsers | Returns user array | Req 9.3 |
| HK-008 | should handle unauthorized error for non-admin users | Non-admin calls | isError is true | - |

#### useBorrowRequests Hook Tests (Requirement 9.4)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| HK-009 | should fetch borrow requests from the API | Call useBorrowRequests | Returns borrow request array | Req 9.4 |
| HK-010 | should handle API errors gracefully | API returns error | isError is true | - |

#### Mutation Cache Invalidation Tests (Requirement 9.5)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| HK-011 | should invalidate device queries after creating a device | Create device | Device queries invalidated | Req 9.5 |
| HK-012 | should invalidate device queries after updating a device | Update device | Device queries invalidated | Req 9.5 |
| HK-013 | should invalidate device queries after deleting a device | Delete device | Device queries invalidated | Req 9.5 |
| HK-014 | should invalidate borrow and device queries after creating a borrow request | Create borrow | Both queries invalidated | Req 9.5 |
| HK-015 | should invalidate queries after updating borrow status | Update status | Queries invalidated | Req 9.5 |

#### Mutation Error Toast Tests (Requirement 9.6)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| HK-016 | should show error toast when device creation fails | Create fails | Toast with error shown | Req 9.6 |
| HK-017 | should show error toast when device update fails | Update fails | Toast with error shown | Req 9.6 |
| HK-018 | should show error toast when device deletion fails | Delete fails | Toast with error shown | Req 9.6 |
| HK-019 | should show error toast when borrow request creation fails | Create fails | Toast with error shown | Req 9.6 |
| HK-020 | should show error toast when borrow status update fails | Update fails | Toast with error shown | Req 9.6 |

#### useRefreshData Tests (Requirement 9.7)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| HK-021 | should invalidate device queries when refreshDevices is called | Call refreshDevices | Device queries invalidated | Req 9.7 |
| HK-022 | should invalidate user queries when refreshUsers is called | Call refreshUsers | User queries invalidated | Req 9.7 |
| HK-023 | should invalidate borrow request queries when refreshBorrowRequests is called | Call refreshBorrowRequests | Borrow queries invalidated | Req 9.7 |
| HK-024 | should invalidate return queries when refreshReturns is called | Call refreshReturns | Return queries invalidated | Req 9.7 |
| HK-025 | should invalidate renewal queries when refreshRenewals is called | Call refreshRenewals | Renewal queries invalidated | Req 9.7 |
| HK-026 | should invalidate department queries when refreshDepartments is called | Call refreshDepartments | Department queries invalidated | Req 9.7 |
| HK-027 | should invalidate all queries when refreshAll is called | Call refreshAll | All queries invalidated | Req 9.7 |

#### Query Keys Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| HK-028 | should generate correct query keys for devices | Check device keys | Correct key structure | - |
| HK-029 | should generate correct query keys for users | Check user keys | Correct key structure | - |
| HK-030 | should generate correct query keys for borrow requests | Check borrow keys | Correct key structure | - |
| HK-031 | should generate correct query keys for returns | Check return keys | Correct key structure | - |
| HK-032 | should generate correct query keys for renewals | Check renewal keys | Correct key structure | - |
| HK-033 | should generate correct query keys for departments | Check department keys | Correct key structure | - |

---

## Property Tests

### Authorization Property Tests

**File:** `tests/properties/authorization.test.ts`
**Requirements:** 11.1, 11.2, 11.3, 11.4, 11.5

#### Protected Endpoints Tests (Requirement 11.1)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| AUT-001 | GET /api/users requires token | Access without token | Status 401, success: false | Req 11.1 |
| AUT-002 | GET /api/users/:id requires token | Access without token | Status 401, success: false | Req 11.1 |
| AUT-003 | GET /api/borrow requires token | Access without token | Status 401, success: false | Req 11.1 |
| AUT-004 | GET /api/returns requires token | Access without token | Status 401, success: false | Req 11.1 |
| AUT-005 | GET /api/renewals requires token | Access without token | Status 401, success: false | Req 11.1 |
| AUT-006 | GET /api/auth/me requires token | Access without token | Status 401, success: false | Req 11.1 |
| AUT-007 | POST /api/auth/change-password requires token | Access without token | Status 401, success: false | Req 11.1 |
| AUT-008 | POST /api/borrow requires token | Access without token | Status 401, success: false | Req 11.1 |
| AUT-009 | POST /api/returns requires token | Access without token | Status 401, success: false | Req 11.1 |
| AUT-010 | POST /api/renewals requires token | Access without token | Status 401, success: false | Req 11.1 |
| AUT-011 | POST /api/devices requires token | Access without token | Status 401, success: false | Req 11.1 |
| AUT-012 | PUT /api/devices/:id requires token | Access without token | Status 401, success: false | Req 11.1 |
| AUT-013 | DELETE /api/devices/:id requires token | Access without token | Status 401, success: false | Req 11.1 |
| AUT-014 | DELETE /api/users/:id requires token | Access without token | Status 401, success: false | Req 11.1 |
| AUT-015 | PATCH /api/users/:id/password requires token | Access without token | Status 401, success: false | Req 11.1 |
| AUT-016 | PATCH /api/users/:id/status requires token | Access without token | Status 401, success: false | Req 11.1 |

#### Admin-Only Endpoints Tests (Requirement 11.2)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| AUT-017 | GET /api/users returns 403 for regular user | User accesses | Status 403, success: false | Req 11.2 |
| AUT-018 | POST /api/devices returns 401 for regular user | User creates device | Status 401, success: false | Req 11.2 |
| AUT-019 | PUT /api/devices/:id returns 401 for regular user | User updates device | Status 401, success: false | Req 11.2 |
| AUT-020 | DELETE /api/devices/:id returns 401 for regular user | User deletes device | Status 401, success: false | Req 11.2 |
| AUT-021 | PATCH /api/borrow/:id/status (approve) returns 403 for regular user | User approves | Status 403, success: false | Req 11.2 |
| AUT-022 | PATCH /api/renewals/:id/status returns 403 for regular user | User approves renewal | Status 403, success: false | Req 11.2 |
| AUT-023 | GET /api/users succeeds for admin | Admin accesses | Status 200, success: true | Req 11.2 |

#### Superuser-Only Endpoints Tests (Requirement 11.3)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| AUT-024 | DELETE /api/users/:id returns 403 for admin | Admin deletes user | Status 403, success: false | Req 11.3 |
| AUT-025 | PATCH /api/users/:id/password returns 403 for admin | Admin resets password | Status 403, success: false | Req 11.3 |
| AUT-026 | PATCH /api/users/:id/status returns 403 for admin | Admin toggles status | Status 403, success: false | Req 11.3 |
| AUT-027 | PATCH /api/users/:id/password succeeds for superuser | Superuser resets | Status 200, success: true | Req 11.3 |

#### User Resource Ownership Tests (Requirement 11.4)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| AUT-028 | GET /api/users/:id returns 403 when non-admin accesses another user | User views other | Status 403, success: false | Req 11.4 |
| AUT-029 | GET /api/users/:id succeeds when user accesses own profile | User views own | Status 200, success: true | Req 11.4 |
| AUT-030 | GET /api/borrow/user/:userId returns 403 when non-admin accesses another user requests | User views other's borrows | Status 403, success: false | Req 11.4 |

#### Role Hierarchy Tests (Requirement 11.5)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| AUT-031 | Superuser can access admin-only endpoints | Superuser accesses /api/users | Status 200, success: true | Req 11.5 |
| AUT-032 | Admin can access user-level endpoints | Admin accesses /api/borrow | Status 200, success: true | Req 11.5 |
| AUT-033 | Superuser can access user-level endpoints | Superuser accesses /api/borrow | Status 200, success: true | Req 11.5 |

#### Property Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| AUT-P01 | Property 26: Authorization Enforcement | Invalid tokens get 401, wrong roles get 403 | Correct status codes | Req 11.1, 11.2, 11.3 |

---

### Validation Property Tests

**File:** `tests/properties/validation.test.ts`
**Requirements:** 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8

#### Email/Username Format Validation Tests (Requirements 12.1, 12.2)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| VAL-001 | should accept standard email format | Signup with valid email | Status 200 or 201 | Req 12.1 |
| VAL-002 | should accept simple username for support accounts | Signup with username | Status 200 or 201 | Req 12.1 |
| VAL-003 | should reject empty email | Signup with empty email | Status 400, success: false | Req 12.2 |
| VAL-004 | should reject email/username with only @ symbol | Signup with "@" | Status 400, success: false | Req 12.2 |
| VAL-005 | should accept username with dots, underscores, and hyphens | Signup with special chars | Status 200 or 201 | Req 12.1 |
| VAL-006 | should reject username with invalid characters | Signup with invalid chars | Status 400, success: false | Req 12.2 |
| VAL-007 | should reject username with spaces | Signup with spaces | Status 400, success: false | Req 12.2 |

#### Date Range Validation Tests (Requirements 12.3, 12.4)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| VAL-008 | should accept valid date range where end >= start | Borrow with valid dates | Not rejected for date reason | Req 12.3 |
| VAL-009 | should reject date range where end < start | Borrow with invalid dates | Status 400, success: false | Req 12.4 |
| VAL-010 | should accept same start and end date | Borrow with same day | Not rejected for date reason | Req 12.3 |

#### Device Category Validation Tests (Requirements 12.5, 12.6)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| VAL-011 | should accept "laptop" category | Create laptop device | Status 200 or 201 | Req 12.5 |
| VAL-012 | should accept "mobile" category | Create mobile device | Status 200 or 201 | Req 12.5 |
| VAL-013 | should accept "LAPTOP" (uppercase) category | Create with uppercase | Status 200 or 201 | Req 12.5 |
| VAL-014 | should reject "computer" (invalid) category | Create with invalid category | Status 500 (DB constraint) | Req 12.6 |
| VAL-015 | should reject empty category | Create with empty category | Status 400, success: false | Req 12.6 |

#### Status Transition Validation Tests (Requirements 12.7, 12.8)

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| VAL-016 | should accept valid transition: pending -> approved | Approve pending request | Status 200 or 201 | Req 12.7 |
| VAL-017 | should accept valid transition: pending -> rejected | Reject pending request | Status 200 or 201 | Req 12.7 |
| VAL-018 | should accept valid transition: pending -> active | Activate pending request | Status 200, 201, or 400 | Req 12.7 |
| VAL-019 | should reject invalid transition: pending -> returned | Return pending request | Status 400, success: false | Req 12.8 |
| VAL-020 | should reject invalid transition: returned -> pending | Reopen returned request | Status 400, success: false | Req 12.8 |
| VAL-021 | should reject invalid transition: rejected -> approved | Approve rejected request | Status 400, success: false | Req 12.8 |

#### Property Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| VAL-P01 | Property 27: Email/Username Format Validation | Valid formats accepted, invalid rejected | Correct status codes | Req 12.1, 12.2 |
| VAL-P02 | Property 28: Device Category Validation | Valid categories accepted, invalid rejected | Correct status codes | Req 12.5, 12.6 |

---

## Scenario Tests

### Concurrent Operations Tests

**File:** `tests/scenarios/concurrent-operations.test.ts`

#### Concurrent Booking Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| CON-001 | should handle multiple simultaneous booking attempts for same device | 3 users book same device | At least one succeeds | - |
| CON-002 | should handle rapid sequential booking attempts | 5 rapid requests | First succeeds, rest fail | - |

#### Concurrent Device Operations Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| CON-003 | should handle concurrent device creation with unique asset tags | Create 5 devices simultaneously | All succeed with unique IDs | - |
| CON-004 | should handle concurrent device updates | Sequential updates | All succeed, final state correct | - |

#### Concurrent User Operations Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| CON-005 | should handle concurrent user signups with unique emails | 5 simultaneous signups | All succeed | - |
| CON-006 | should reject concurrent signups with same email | Duplicate email signups | First succeeds, second fails | - |
| CON-007 | should handle concurrent login attempts | 5 simultaneous logins | All succeed | - |

#### Concurrent Status Transitions Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| CON-008 | should handle concurrent approval attempts on same request | 3 admins approve | At least one succeeds | - |
| CON-009 | should prevent conflicting status transitions | Approve and reject simultaneously | One wins, state consistent | - |

#### Concurrent Renewal Operations Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| CON-010 | should prevent duplicate renewal requests submitted sequentially | Two renewal requests | First succeeds, second fails | - |

#### High Load Scenarios Tests

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| CON-011 | should handle multiple users browsing devices simultaneously | 5 users browse | All succeed | - |
| CON-012 | should handle mixed read/write operations | Sequential read/write mix | All succeed | - |
| CON-013 | should maintain data consistency under sequential modifications | Sequential price updates | Final value correct | - |

---

### User Workflow Tests

**File:** `tests/scenarios/user-workflows.test.ts`

#### Scenario 1: New Employee Onboarding

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| WF-001 | should allow a new employee to sign up, browse devices, and request a laptop | Complete onboarding flow | User signs up, browses, requests, admin approves and activates | - |

#### Scenario 2: Device Loan Extension Request

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| WF-002 | should allow user to request and receive loan extension | Complete renewal flow | User requests renewal, admin approves, end date updated | - |

#### Scenario 3: Device Return with Damage Report

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| WF-003 | should handle damaged device return and set device to maintenance | Return damaged device | Device set to maintenance, borrow marked returned | - |

#### Scenario 4: Admin Inventory Management

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| WF-004 | should allow admin to add, update, and manage device inventory | Complete inventory management | Admin creates, updates, lists, filters, searches devices | - |

#### Scenario 5: Request Rejection and Re-submission

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| WF-005 | should handle rejected request and allow user to submit new request | Rejection and resubmission | First rejected, device available, second approved | - |

#### Scenario 6: Multiple Users Competing for Same Device

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| WF-006 | should handle booking conflicts when multiple users request same device | Overlapping requests | First succeeds, overlapping fails, non-overlapping succeeds | - |

#### Scenario 7: User Profile and Password Management

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| WF-007 | should allow user to view and update their profile | Profile management | User views and updates profile | - |

#### Scenario 8: Superuser User Management

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| WF-008 | should allow superuser to manage user accounts | User management flow | Superuser views, deactivates, reactivates, resets password | - |

#### Scenario 9: Complete Device Lifecycle

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| WF-009 | should track device through entire lifecycle from purchase to multiple loans | Full device lifecycle | Device created, borrowed, returned, borrowed again, returned | - |

#### Scenario 10: Renewal Request Rejection

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| WF-010 | should handle rejected renewal and allow user to return device on time | Renewal rejection flow | Renewal rejected, end date unchanged, device returned | - |

#### Scenario 11: Department-Based Device Filtering

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| WF-011 | should allow users to browse devices by department | Department filtering | Devices have department information | - |

#### Scenario 12: Admin Request Queue Management

| Test ID | Test Name | Description | Expected Result | Requirement |
|---------|-----------|-------------|-----------------|-------------|
| WF-012 | should allow admin to efficiently process multiple pending requests | Batch request processing | Admin views pending, approves some, rejects others | - |

---

## Summary

| Category | Test Count |
|----------|------------|
| Authentication Tests | 21 |
| Borrow Request Tests | 36 |
| Department Tests | 21 |
| Device Tests | 24 |
| Edge Case Tests | 47 |
| Error Handling Tests | 30 |
| Notification Tests | 22 |
| Renewal Tests | 22 |
| Return Tests | 19 |
| User Tests | 26 |
| API Client Integration Tests | 20 |
| React Query Hooks Tests | 33 |
| Authorization Property Tests | 34 |
| Validation Property Tests | 23 |
| Concurrent Operations Tests | 13 |
| User Workflow Tests | 12 |
| **Total** | **403** |

---

*Generated from test files in the `tests/` directory.*
