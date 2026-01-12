# Device Hub - Functionality & Tests Documentation

## Overview

Device Hub is an enterprise device management system built with React (frontend) and Bun/TypeScript (backend). It enables organizations to track, book, and manage IT equipment with role-based access control.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Query
- **Backend**: Bun runtime, TypeScript, MySQL
- **Testing**: Vitest, fast-check (property-based testing), MSW

---

## User Interfaces

### Authentication

| Page  | Route    | Description                                                                                       |
| ----- | -------- | ------------------------------------------------------------------------------------------------- |
| Login | `/login` | Email/password authentication with demo credentials, theme toggle, forced password change support |

### User Portal

| Page            | Route         | Description                                                                               |
| --------------- | ------------- | ----------------------------------------------------------------------------------------- |
| Dashboard       | `/dashboard`  | Overview with active loans, pending requests, renewal alerts, recently viewed devices     |
| Device Catalog  | `/catalog`    | Browse devices with filters (category, status, price), search, favorites, grid/list views |
| Device Detail   | `/device/:id` | Device specs, availability calendar, booking form                                         |
| Loan Management | `/loans`      | Active loans, pending requests, renewal requests, return functionality                    |
| Profile         | `/profile`    | User profile management, avatar upload, password change                                   |

### Admin Portal

| Page          | Route                  | Description                                                    |
| ------------- | ---------------------- | -------------------------------------------------------------- |
| Dashboard     | `/admin`               | KPIs, action items (pending/overdue), recent activity timeline |
| Analytics     | `/admin/analytics`     | Charts and reports on device utilization                       |
| Inventory     | `/admin/inventory`     | Device CRUD, bulk operations, import/export                    |
| Device Detail | `/admin/inventory/:id` | Admin device management view                                   |
| Calendar      | `/admin/calendar`      | Device availability timeline view                              |
| Requests      | `/admin/requests`      | Kanban/list views for borrow, return, renewal requests         |
| Users         | `/admin/users`         | User management, import/export, role assignment                |
| Profile       | `/admin/profile`       | Admin profile settings                                         |

---

## Backend API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint           | Description                    |
| ------ | ------------------ | ------------------------------ |
| POST   | `/login`           | User login with email/password |
| POST   | `/signup`          | New user registration          |
| GET    | `/me`              | Get current user from token    |
| POST   | `/change-password` | Change user password           |

### Users (`/api/users`)

| Method | Endpoint        | Description                                |
| ------ | --------------- | ------------------------------------------ |
| GET    | `/`             | List all users (admin only)                |
| GET    | `/:id`          | Get user by ID                             |
| PUT    | `/:id`          | Update user profile                        |
| DELETE | `/:id`          | Delete user (superuser only)               |
| PATCH  | `/:id/password` | Reset user password (superuser only)       |
| PATCH  | `/:id/status`   | Toggle user active status (superuser only) |

### Devices (`/api/devices`)

| Method | Endpoint | Description                                                 |
| ------ | -------- | ----------------------------------------------------------- |
| GET    | `/`      | List devices with filters (category, status, price, search) |
| GET    | `/:id`   | Get device by ID with parsed specs                          |
| POST   | `/`      | Create device (admin only)                                  |
| PUT    | `/:id`   | Update device (admin only)                                  |
| DELETE | `/:id`   | Delete device (admin only)                                  |

### Borrow Requests (`/api/borrow`)

| Method | Endpoint        | Description                             |
| ------ | --------------- | --------------------------------------- |
| GET    | `/`             | List borrow requests (filtered by role) |
| GET    | `/:id`          | Get borrow request by ID                |
| GET    | `/user/:userId` | Get requests for specific user          |
| POST   | `/`             | Create borrow request                   |
| PATCH  | `/:id/status`   | Update request status (admin only)      |

### Returns (`/api/returns`)

| Method | Endpoint | Description           |
| ------ | -------- | --------------------- |
| GET    | `/`      | List return requests  |
| POST   | `/`      | Create return request |

### Renewals (`/api/renewals`)

| Method | Endpoint            | Description                         |
| ------ | ------------------- | ----------------------------------- |
| GET    | `/`                 | List renewal requests               |
| GET    | `/borrow/:borrowId` | Get renewals for borrow request     |
| POST   | `/`                 | Create renewal request              |
| PATCH  | `/:id/status`       | Approve/reject renewal (admin only) |

### Departments (`/api/departments`)

| Method | Endpoint | Description                              |
| ------ | -------- | ---------------------------------------- |
| GET    | `/`      | List departments with user/device counts |
| GET    | `/names` | Get valid department names               |
| GET    | `/:id`   | Get department by ID                     |
| POST   | `/`      | Create department (admin only)           |
| DELETE | `/:id`   | Delete empty department (admin only)     |

---

## Data Types

### User Roles

- `superuser` - Full system access
- `admin` - Device and request management
- `user` - Standard user access

### Device Categories

`laptop`, `mobile`, `tablet`, `monitor`, `accessories`, `storage`, `ram`

### Device Status

`available`, `borrowed`, `maintenance`

### Request Status

`pending`, `approved`, `active`, `returned`, `rejected`

### Device Condition

`excellent`, `good`, `fair`, `damaged`

### Renewal Status

`pending`, `approved`, `rejected`

---

## Test Suite

### API Tests (`tests/api/`)

#### Authentication Tests (`auth.test.ts`)

- Login with valid/invalid credentials
- Signup with validation (email, password length, duplicate email)
- Token validation and expiration
- Password change functionality
- Property Test: Token validity across all user types

#### Device Tests (`devices.test.ts`)

- Device listing with department info
- Filtering by category, status, search, price range
- Device retrieval by ID (valid/invalid)
- CRUD operations (admin authorization)
- Duplicate asset tag validation
- Property Tests: Filter consistency, ID retrieval

#### User Tests (`users.test.ts`)

- User listing (admin only)
- User retrieval (self/admin access)
- Profile updates
- Password reset (superuser only)
- Status toggle (superuser only)
- User deletion (superuser only)
- Property Tests: Admin listing, self-access

#### Borrow Request Tests (`borrow.test.ts`)

- Request listing (role-based filtering)
- Request creation with validation
- Date range validation
- Booking conflict detection
- Status transitions (pending to approved to active to returned)
- Invalid transition rejection
- Property Tests: Visibility, date validation, status transitions

#### Return Tests (`returns.test.ts`)

- Return listing (role-based)
- Return creation for active loans
- Device status update based on condition
- Duplicate return prevention
- Property Tests: Visibility, non-damaged condition handling

#### Renewal Tests (`renewals.test.ts`)

- Renewal listing (role-based)
- Renewal creation for active loans
- Date validation (must extend current end date)
- Duplicate pending renewal prevention
- Approval/rejection with end date update
- Property Tests: Visibility, date validation

#### Department Tests (`departments.test.ts`)

- Department listing with counts
- Valid department names
- CRUD operations
- Deletion restrictions (non-empty departments)
- Property Tests: Count fields, name validation

#### Error Handling Tests (`error-handling.test.ts`)

- Malformed JSON handling
- Missing required fields
- Invalid ID formats
- Out-of-range values
- Property Tests: Field validation, ID format validation

#### Edge Case Tests (`edge-cases.test.ts`)

- Special characters and Unicode
- Boundary values (prices, dates, string lengths)
- Empty and null values
- Authorization edge cases
- Resource state transitions
- Duplicate and conflict handling
- Filter edge cases

### Integration Tests (`tests/integration/`)

#### API Client Tests (`api-client.test.ts`)

- Token attachment to requests
- 401 response handling
- Response parsing
- Error handling
- Network error handling
- Content-Type headers
- Property Tests: Token attachment, response parsing, error handling

#### React Query Hooks Tests (`hooks.test.ts`)

- useDevices, useDevice, useUsers, useBorrowRequests hooks
- Cache invalidation on mutations
- Error toast display
- useRefreshData functionality

### Property Tests (`tests/properties/`)

#### Authorization Tests (`authorization.test.ts`)

- Protected endpoints require token
- Admin-only endpoints reject regular users
- Superuser-only endpoints reject admins
- User resource ownership
- Role hierarchy

#### Validation Tests (`validation.test.ts`)

- Email format validation
- Date range validation
- Device category validation
- Status transition validation

---

## Key Features

### Frontend

- Lazy-loaded routes for performance
- React Query caching (5-minute stale time)
- Accessibility support (skip links, ARIA labels)
- Dark/light theme support
- Internationalization ready
- Drag-and-drop Kanban boards
- Device comparison modal
- Favorites and recently viewed tracking

### Backend

- JWT authentication
- Role-based access control (RBAC)
- Audit logging
- Image processing with Sharp
- Mattermost integration (slash commands, notifications)
- User import/export functionality

### Security

- Password hashing
- Token validation
- Input validation
- SQL injection prevention
- CORS configuration
