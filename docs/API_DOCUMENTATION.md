# Device Hub - API Documentation

## Base URL
```
http://localhost:3000/api
```

## Response Format
```json
{
  "success": true|false,
  "data": {...} | [...],
  "message": "Optional message",
  "error": "Error message if success is false"
}
```

---

# Authentication Endpoints

## POST /api/auth/login

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/auth/login` |
| **Auth** | None |
| **Query Params** | None |
| **Header** | `Content-Type: application/json` |

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": false
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "user",
    "department_id": 1,
    "department_name": "Engineering",
    "avatar_url": "https://...",
    "is_active": true
  },
  "mustChangePassword": false
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Email and password are required |
| 401 | Invalid email or password |
| 403 | Account has been locked |

**Usecase:** Authenticate user and receive JWT token for subsequent API calls.

**Validation Rules:**
- Email: Required, valid email format
- Password: Required

---

## POST /api/auth/signup

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/auth/signup` |
| **Auth** | None |
| **Query Params** | None |
| **Header** | `Content-Type: application/json` |

**Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "department_id": 1
}
```

**Success Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 2,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "user",
    "department_id": 1,
    "department_name": "Engineering"
  }
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Name/Email/Password/Department is required |
| 400 | Invalid email format |
| 400 | Password must be at least 6 characters |
| 400 | An account with this email already exists |
| 400 | Invalid department |

**Usecase:** Register a new user account in the system.

**Validation Rules:**
- Name: Required
- Email: Required, valid email format, unique
- Password: Required, minimum 6 characters
- Department ID: Required, must exist in database

---

## GET /api/auth/me

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/auth/me` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "role": "user",
    "department_id": 1,
    "department_name": "Engineering",
    "avatar_url": "https://...",
    "is_active": true
  },
  "mustChangePassword": false
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 401 | Unauthorized |
| 404 | User not found |

**Usecase:** Get current authenticated user information.

**Validation Rules:**
- Valid JWT token required

---

## POST /api/auth/change-password

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/auth/change-password` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Current password and new password are required |
| 400 | New password must be at least 6 characters |
| 401 | Unauthorized / Current password is incorrect |
| 404 | User not found |

**Usecase:** Change the current user's password.

**Validation Rules:**
- Current Password: Required, must match existing password
- New Password: Required, minimum 6 characters

---

## POST /api/auth/logout

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/auth/logout` |
| **Auth** | None |
| **Query Params** | None |
| **Header** | None |

**Body:** None

**Success Response (200):**
```json
{
  "success": true
}
```

**Error Response:** None

**Usecase:** Logout the current user and clear authentication cookie.

**Validation Rules:** None

**Side Effects:** Clears the `auth_token` cookie

---

# Health Check Endpoints

## GET /api/health

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/health` |
| **Auth** | None |
| **Query Params** | None |
| **Header** | None |

**Body:** None

**Success Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "database": {
    "healthy": true,
    "pool": {
      "active": 2,
      "idle": 8,
      "total": 10
    }
  }
}
```

**Error Response (503):**
```json
{
  "status": "degraded",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "database": {
    "healthy": false,
    "error": "Connection timeout"
  }
}
```

**Usecase:** Get server health status including database pool information.

**Validation Rules:** None

---

# User Endpoints

## GET /api/users

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/users` |
| **Auth** | Bearer Token (Admin only) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "department_id": 1,
      "department_name": "Engineering",
      "avatar_url": "https://...",
      "avatar_thumbnail_url": "https://...",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "last_login_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 401 | Unauthorized |
| 403 | Forbidden |

**Usecase:** List all users in the system.

**Validation Rules:**
- Valid JWT token required
- User must have admin role

---

## POST /api/users

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/users` |
| **Auth** | Bearer Token (Admin only) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "department_id": 1,
  "role": "user"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "department_id": 1,
    "department_name": "Engineering",
    "is_active": true
  },
  "message": "User created successfully"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Name is required / Invalid email / Password must be at least 6 characters / Invalid department |
| 400 | Email already exists |
| 401 | Unauthorized |
| 403 | Forbidden / Admins can only create user accounts |

**Usecase:** Create a new user (admin only). Created users will have `must_change_password` set to `true`.

**Validation Rules:**
- Name: Required
- Email: Required, valid format, unique
- Password: Required, minimum 6 characters
- Department ID: Required, must exist
- Role: Optional (default: "user"), Admins can only create 'user' role, Superusers can create any role

---

## GET /api/users/:id

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/users/:id` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "department_id": 1,
    "department_name": "Engineering",
    "avatar_url": "https://...",
    "is_active": true
  }
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid user ID |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | User not found |

**Usecase:** Get user by ID. Users can only view their own profile, admins can view any.

**Validation Rules:**
- ID: Required, valid integer
- Users can only access their own profile unless admin

---

## PUT /api/users/:id

| Item | Detail |
|------|--------|
| **Endpoint** | `PUT /api/users/:id` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "name": "John Updated",
  "department_id": 2,
  "avatar_url": "https://new-avatar.com/image.jpg",
  "role": "admin"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Updated",
    "email": "john@example.com",
    "role": "admin",
    "department_id": 2
  },
  "message": "User updated"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid user ID / No fields to update |
| 401 | Unauthorized |
| 403 | Forbidden / Admins cannot assign admin or superuser roles |

**Usecase:** Update user profile. Users can only update their own profile, admins can update any.

**Validation Rules:**
- ID: Required, valid integer
- Role changes: Superusers can assign any role, Admins can only assign 'user' role, Regular users cannot change roles

---

## DELETE /api/users/:id

| Item | Detail |
|------|--------|
| **Endpoint** | `DELETE /api/users/:id` |
| **Auth** | Bearer Token (Superuser only) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "User deleted"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid user ID / Cannot delete your own account / Cannot delete user with active borrow requests |
| 401 | Unauthorized |
| 403 | Forbidden - Superuser access required |

**Usecase:** Delete a user from the system.

**Validation Rules:**
- ID: Required, valid integer
- Cannot delete own account
- Cannot delete user with active borrow requests
- Superuser role required

---

## PATCH /api/users/:id/password

| Item | Detail |
|------|--------|
| **Endpoint** | `PATCH /api/users/:id/password` |
| **Auth** | Bearer Token (Superuser only) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "password": "newpassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid user ID / Password must be at least 6 characters |
| 401 | Unauthorized |
| 403 | Forbidden - Superuser access required |

**Usecase:** Reset user password (admin function).

**Validation Rules:**
- ID: Required, valid integer
- Password: Required, minimum 6 characters
- Superuser role required

---

## PATCH /api/users/:id/status

| Item | Detail |
|------|--------|
| **Endpoint** | `PATCH /api/users/:id/status` |
| **Auth** | Bearer Token (Superuser only) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "is_active": false
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "is_active": false
  },
  "message": "User account locked"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid user ID / is_active must be a boolean / Cannot change your own account status |
| 401 | Unauthorized |
| 403 | Forbidden - Superuser access required |

**Usecase:** Toggle user active status (lock/unlock account).

**Validation Rules:**
- ID: Required, valid integer
- is_active: Required, boolean
- Cannot change own account status
- Superuser role required

---

# User Import/Export Endpoints

## POST /api/users/import

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/users/import` |
| **Auth** | Bearer Token (Admin only) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: multipart/form-data` or `application/json` |

**Body (multipart/form-data):**
- `file`: CSV file

**Body (JSON):**
```json
{
  "csvContent": "name,email,department_id,role\nJohn,john@example.com,1,user"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "created": 5,
    "failed": 1,
    "errors": ["Row 3: Invalid email format"],
    "createdUsers": [
      { "id": 10, "email": "john@example.com" }
    ]
  },
  "message": "Successfully imported 5 users, 1 failed"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | No CSV file provided / File must be a CSV / File size must be less than 5MB |
| 401 | Unauthorized |
| 403 | Forbidden |

**Usecase:** Import users from CSV file.

**Validation Rules:**
- File: Required, CSV format, max 5MB
- Admin role required

---

## GET /api/users/export

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/users/export` |
| **Auth** | Bearer Token (Admin only) |
| **Query Params** | `ids` (optional): Comma-separated user IDs to export |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response:** CSV file download

**Error Response:**
| Code | Message |
|------|---------|
| 401 | Unauthorized |
| 403 | Forbidden |

**Usecase:** Export users with temporary passwords.

**Validation Rules:**
- Admin role required
- IDs (if provided): Valid comma-separated integers

---

## GET /api/users/export/admin

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/users/export/admin` |
| **Auth** | Bearer Token (Superuser only) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response:** CSV file download

**Error Response:**
| Code | Message |
|------|---------|
| 401 | Unauthorized |
| 403 | Forbidden |

**Usecase:** Export all users with decrypted passwords.

**Validation Rules:**
- Superuser role required

---

## GET /api/users/import/template

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/users/import/template` |
| **Auth** | Bearer Token (Admin only) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response:** CSV file download (template)

**Error Response:**
| Code | Message |
|------|---------|
| 401 | Unauthorized |
| 403 | Forbidden |

**Usecase:** Download CSV template for user import.

**Validation Rules:**
- Admin role required

---

## POST /api/users/export/clear-passwords

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/users/export/clear-passwords` |
| **Auth** | Bearer Token (Superuser only) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "Temporary passwords cleared"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 401 | Unauthorized |
| 403 | Forbidden |

**Usecase:** Clear temporary passwords from memory.

**Validation Rules:**
- Superuser role required

---

# Device Endpoints

## GET /api/devices/pending-ids

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/devices/pending-ids` |
| **Auth** | None |
| **Query Params** | None |
| **Header** | None |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": [1, 2, 3]
}
```

**Error Response:** None

**Usecase:** Get IDs of devices that have pending or approved borrow requests.

**Validation Rules:** None

---

## GET /api/devices

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/devices` |
| **Auth** | None |
| **Query Params** | `category`, `status`, `department_id`, `search`, `min_price`, `max_price`, `price_field` |
| **Header** | None |

**Query Parameters Detail:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category (laptop, mobile, tablet, monitor, accessories, storage, ram) |
| status | string | Filter by status (available, borrowed, maintenance) |
| department_id | number | Filter by department |
| search | string | Search in name, asset_tag, brand, model |
| min_price | number | Minimum price filter |
| max_price | number | Maximum price filter |
| price_field | string | Price field to filter (purchase_price or selling_price) |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "MacBook Pro 16",
      "asset_tag": "LAP-001",
      "category": "laptop",
      "brand": "Apple",
      "model": "MacBook Pro 16-inch",
      "status": "available",
      "department_id": 1,
      "department_name": "Engineering",
      "purchase_price": 2499.00,
      "selling_price": 1999.00,
      "purchase_date": "2024-01-01",
      "specs_json": "{\"cpu\":\"M3 Pro\",\"ram\":\"32GB\"}",
      "image_url": "https://...",
      "image_thumbnail_url": "https://...",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Response:** None

**Usecase:** List all devices with optional filters.

**Validation Rules:**
- Category (if provided): Must be one of: laptop, mobile, tablet, monitor, accessories, storage, ram
- Status (if provided): Must be one of: available, borrowed, maintenance

---

## GET /api/devices/:id

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/devices/:id` |
| **Auth** | None |
| **Query Params** | None |
| **Header** | None |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "MacBook Pro 16",
    "asset_tag": "LAP-001",
    "category": "laptop",
    "brand": "Apple",
    "model": "MacBook Pro 16-inch",
    "status": "available",
    "department_id": 1,
    "department_name": "Engineering",
    "purchase_price": 2499.00,
    "purchase_date": "2024-01-01",
    "specs_json": "{\"cpu\":\"M3 Pro\",\"ram\":\"32GB\"}"
  }
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid device ID |
| 404 | Device not found |

**Usecase:** Get device by ID.

**Validation Rules:**
- ID: Required, valid integer

---

## POST /api/devices

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/devices` |
| **Auth** | Bearer Token (Admin only) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "name": "MacBook Pro 16",
  "asset_tag": "LAP-002",
  "category": "laptop",
  "brand": "Apple",
  "model": "MacBook Pro 16-inch",
  "department_id": 1,
  "purchase_price": 2499.00,
  "purchase_date": "2024-01-15",
  "specs_json": "{\"cpu\":\"M3 Pro\",\"ram\":\"32GB\"}",
  "image_url": "https://example.com/image.jpg"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "MacBook Pro 16",
    "asset_tag": "LAP-002",
    "status": "available"
  },
  "message": "Device created"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Missing required fields / Asset tag already exists |
| 401 | Unauthorized |

**Usecase:** Create a new device.

**Validation Rules:**
- Name: Required
- Asset Tag: Required, unique
- Category: Required, must be one of: laptop, mobile, tablet, monitor, accessories, storage, ram
- Brand: Required
- Model: Required
- Department ID: Required, must exist
- Purchase Price: Required
- Purchase Date: Required

---

## PUT /api/devices/:id

| Item | Detail |
|------|--------|
| **Endpoint** | `PUT /api/devices/:id` |
| **Auth** | Bearer Token (Admin only) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "name": "MacBook Pro 16 Updated",
  "status": "maintenance",
  "purchase_price": 2599.00
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "MacBook Pro 16 Updated",
    "status": "maintenance"
  },
  "message": "Device updated"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid device ID / No fields to update / Asset tag already exists |
| 401 | Unauthorized |

**Usecase:** Update a device.

**Validation Rules:**
- ID: Required, valid integer
- Asset Tag (if provided): Must be unique
- Admin role required

---

## DELETE /api/devices/:id

| Item | Detail |
|------|--------|
| **Endpoint** | `DELETE /api/devices/:id` |
| **Auth** | Bearer Token (Admin only) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "Device deleted"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid device ID / Cannot delete device with active borrow requests |
| 401 | Unauthorized |

**Usecase:** Delete a device.

**Validation Rules:**
- ID: Required, valid integer
- Cannot delete device with active borrow requests
- Admin role required

---

## GET /api/devices/category/:category

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/devices/category/:category` |
| **Auth** | None |
| **Query Params** | None |
| **Header** | None |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "MacBook Pro 16",
      "category": "laptop"
    }
  ]
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid category |

**Usecase:** Get devices by category.

**Validation Rules:**
- Category: Required, must be one of: laptop, mobile, tablet, monitor, accessories, storage, ram

---

## GET /api/devices/status/:status

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/devices/status/:status` |
| **Auth** | None |
| **Query Params** | None |
| **Header** | None |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "MacBook Pro 16",
      "status": "available"
    }
  ]
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid status |

**Usecase:** Get devices by status.

**Validation Rules:**
- Status: Required, must be one of: available, borrowed, maintenance

---

# Borrow Request Endpoints

## GET /api/borrow

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/borrow` |
| **Auth** | Bearer Token |
| **Query Params** | `status`, `device_id` |
| **Header** | `Authorization: Bearer <token>` |

**Query Parameters Detail:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (pending, approved, active, returned, rejected) |
| device_id | number | Filter by device ID |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "device_id": 1,
      "device_name": "MacBook Pro 16",
      "device_asset_tag": "LAP-001",
      "user_id": 2,
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "start_date": "2024-01-15",
      "end_date": "2024-01-30",
      "reason": "Project development",
      "status": "active",
      "approved_by": 1,
      "approver_name": "Admin User",
      "created_at": "2024-01-14T10:00:00.000Z",
      "updated_at": "2024-01-15T09:00:00.000Z"
    }
  ]
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 401 | Unauthorized |

**Usecase:** List borrow requests. Users see only their own requests, admins see all.

**Validation Rules:**
- Valid JWT token required
- Status (if provided): Must be one of: pending, approved, active, returned, rejected

---

## GET /api/borrow/:id

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/borrow/:id` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "device_id": 1,
    "device_name": "MacBook Pro 16",
    "user_id": 2,
    "user_name": "John Doe",
    "start_date": "2024-01-15",
    "end_date": "2024-01-30",
    "reason": "Project development",
    "status": "active"
  }
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid request ID |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Request not found |

**Usecase:** Get borrow request by ID. Users can only see their own requests, admins can see all.

**Validation Rules:**
- ID: Required, valid integer
- Users can only access their own requests unless admin

---

## GET /api/borrow/user/:userId

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/borrow/user/:userId` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "device_id": 1,
      "device_name": "MacBook Pro 16",
      "user_id": 2,
      "status": "active"
    }
  ]
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid user ID |
| 401 | Unauthorized |
| 403 | Forbidden |

**Usecase:** Get borrow requests for a specific user. Users can only see their own requests, admins can see any user's requests.

**Validation Rules:**
- User ID: Required, valid integer
- Users can only access their own requests unless admin

---

## GET /api/borrow/status/:status

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/borrow/status/:status` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "device_name": "MacBook Pro 16",
      "status": "pending"
    }
  ]
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid status |
| 401 | Unauthorized |

**Usecase:** Get borrow requests by status. Users see only their own requests, admins see all.

**Validation Rules:**
- Status: Required, must be one of: pending, approved, active, returned, rejected

---

## POST /api/borrow

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/borrow` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "device_id": 1,
  "start_date": "2024-02-01",
  "end_date": "2024-02-15",
  "reason": "Need laptop for client presentation"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "device_id": 1,
    "device_name": "MacBook Pro 16",
    "user_id": 2,
    "start_date": "2024-02-01",
    "end_date": "2024-02-15",
    "reason": "Need laptop for client presentation",
    "status": "pending"
  },
  "message": "Borrow request created"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Device ID/Start date/End date/Reason is required |
| 400 | Start date cannot be in the past |
| 400 | End date must be after start date |
| 400 | Device is under maintenance |
| 400 | Device is already booked for this period |
| 401 | Unauthorized |
| 404 | Device not found |

**Usecase:** Create a new borrow request.

**Validation Rules:**
- Device ID: Required, must exist
- Start Date: Required, cannot be in the past
- End Date: Required, must be after start date
- Reason: Required
- Device must be available (not under maintenance)
- Device must not be booked for the requested period

---

## PATCH /api/borrow/:id/status

| Item | Detail |
|------|--------|
| **Endpoint** | `PATCH /api/borrow/:id/status` |
| **Auth** | Bearer Token (Admin only for approve/reject/activate) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "status": "approved"
}
```

**Valid Status Transitions:**
| From | To |
|------|-----|
| pending | approved, rejected |
| approved | active, rejected |
| active | returned |
| returned | (none) |
| rejected | (none) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "approved",
    "approved_by": 1
  },
  "message": "Status updated"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid request ID / Invalid status / Cannot transition from X to Y |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Request not found |

**Usecase:** Update borrow request status.

**Validation Rules:**
- ID: Required, valid integer
- Status: Required, must follow valid transition rules
- Admin role required for approve/reject/activate

---

# Return Request Endpoints

## GET /api/returns

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/returns` |
| **Auth** | Bearer Token |
| **Query Params** | `condition` |
| **Header** | `Authorization: Bearer <token>` |

**Query Parameters Detail:**
| Parameter | Type | Description |
|-----------|------|-------------|
| condition | string | Filter by device condition (excellent, good, fair, damaged) |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "borrow_request_id": 5,
      "device_id": 1,
      "device_name": "MacBook Pro 16",
      "device_asset_tag": "LAP-001",
      "user_id": 2,
      "user_name": "John Doe",
      "return_date": "2024-02-14",
      "device_condition": "good",
      "notes": "Minor scratch on lid",
      "created_at": "2024-02-14T15:00:00.000Z"
    }
  ]
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 401 | Unauthorized |

**Usecase:** List return requests. Users see only their own returns, admins see all.

**Validation Rules:**
- Valid JWT token required
- Condition (if provided): Must be one of: excellent, good, fair, damaged

---

## GET /api/returns/:id

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/returns/:id` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "borrow_request_id": 5,
    "device_id": 1,
    "device_name": "MacBook Pro 16",
    "user_id": 2,
    "return_date": "2024-02-14",
    "device_condition": "good",
    "notes": "Minor scratch on lid"
  }
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid return request ID |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Return request not found |

**Usecase:** Get return request by ID. Users can only see their own returns, admins can see all.

**Validation Rules:**
- ID: Required, valid integer
- Users can only access their own returns unless admin

---

## POST /api/returns

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/returns` |
| **Auth** | Bearer Token (Borrower or Admin) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "borrow_request_id": 5,
  "condition": "good",
  "notes": "Minor scratch on lid"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "borrow_request_id": 5,
    "device_id": 1,
    "return_date": "2024-02-14",
    "device_condition": "good"
  },
  "message": "Return request created"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Borrow request ID is required / Valid condition is required |
| 400 | Notes are required when device is returned in damaged condition |
| 400 | Can only create return request for active borrowings |
| 400 | Return request already exists |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Borrow request not found |

**Usecase:** Create a return request.

**Validation Rules:**
- Borrow Request ID: Required, must exist
- Condition: Required, must be one of: excellent, good, fair, damaged
- Notes: Required when condition is "damaged"
- Borrow request must be in "active" status
- Return request must not already exist

**Side Effects:**
- Borrow request status changes to "returned"
- Device status changes to "available" (or "maintenance" if damaged)

---

## PATCH /api/returns/:id/condition

| Item | Detail |
|------|--------|
| **Endpoint** | `PATCH /api/returns/:id/condition` |
| **Auth** | Bearer Token (Admin only) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "condition": "fair"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "borrow_request_id": 5,
    "device_id": 1,
    "device_name": "MacBook Pro 16",
    "return_date": "2024-02-14",
    "device_condition": "fair"
  },
  "message": "Return condition updated"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid return request ID / Valid condition is required |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Return request not found |

**Usecase:** Update the device condition of a return request.

**Validation Rules:**
- ID: Required, valid integer
- Condition: Required, must be one of: excellent, good, fair, damaged
- Admin role required

**Side Effects:**
- Device status changes to "maintenance" if condition is "damaged", otherwise "available"

---

# Renewal Request Endpoints

## GET /api/renewals

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/renewals` |
| **Auth** | Bearer Token |
| **Query Params** | `status` |
| **Header** | `Authorization: Bearer <token>` |

**Query Parameters Detail:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (pending, approved, rejected) |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "borrow_request_id": 5,
      "device_id": 1,
      "device_name": "MacBook Pro 16",
      "user_id": 2,
      "user_name": "John Doe",
      "current_end_date": "2024-02-15",
      "requested_end_date": "2024-03-01",
      "reason": "Project extended",
      "status": "pending",
      "reviewed_by": null,
      "reviewed_at": null,
      "created_at": "2024-02-10T10:00:00.000Z"
    }
  ]
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 401 | Unauthorized |

**Usecase:** List renewal requests. Users see only their own renewals, admins see all.

**Validation Rules:**
- Valid JWT token required
- Status (if provided): Must be one of: pending, approved, rejected

---

## GET /api/renewals/:id

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/renewals/:id` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "borrow_request_id": 5,
    "device_name": "MacBook Pro 16",
    "user_id": 2,
    "current_end_date": "2024-02-15",
    "requested_end_date": "2024-03-01",
    "reason": "Project extended",
    "status": "pending"
  }
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid renewal request ID |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Renewal request not found |

**Usecase:** Get renewal request by ID. Users can only see their own renewals, admins can see all.

**Validation Rules:**
- ID: Required, valid integer
- Users can only access their own renewals unless admin

---

## GET /api/renewals/borrow/:borrowId

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/renewals/borrow/:borrowId` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "borrow_request_id": 5,
      "requested_end_date": "2024-03-01",
      "status": "approved"
    }
  ]
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid borrow request ID |
| 401 | Unauthorized |

**Usecase:** Get renewal requests for a specific borrow request.

**Validation Rules:**
- Borrow ID: Required, valid integer

---

## GET /api/renewals/status/:status

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/renewals/status/:status` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "device_name": "MacBook Pro 16",
      "status": "pending"
    }
  ]
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid status |
| 401 | Unauthorized |

**Usecase:** Get renewal requests by status. Users see only their own renewals, admins see all.

**Validation Rules:**
- Status: Required, must be one of: pending, approved, rejected

---

## POST /api/renewals

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/renewals` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "borrow_request_id": 5,
  "requested_end_date": "2024-03-01",
  "reason": "Project deadline extended"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "borrow_request_id": 5,
    "current_end_date": "2024-02-15",
    "requested_end_date": "2024-03-01",
    "reason": "Project deadline extended",
    "status": "pending"
  },
  "message": "Renewal request created"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Borrow request ID/Requested end date/Reason is required |
| 400 | Can only request renewal for active loans |
| 400 | Requested end date must be after current end date |
| 400 | A pending renewal request already exists for this loan |
| 401 | Unauthorized |
| 403 | You can only request renewal for your own loans |
| 404 | Borrow request not found |

**Usecase:** Create a renewal request.

**Validation Rules:**
- Borrow Request ID: Required, must exist
- Requested End Date: Required, must be after current end date
- Reason: Required
- Borrow request must be in "active" status
- No pending renewal request for this loan
- User can only request renewal for their own loans

---

## PATCH /api/renewals/:id/status

| Item | Detail |
|------|--------|
| **Endpoint** | `PATCH /api/renewals/:id/status` |
| **Auth** | Bearer Token (Admin only) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "status": "approved"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "approved",
    "reviewed_by": 1,
    "reviewed_at": "2024-02-11T09:00:00.000Z"
  },
  "message": "Renewal approved"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid renewal request ID / Invalid status |
| 400 | Can only update status of pending renewal requests |
| 400 | Device is booked for the requested renewal period |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Renewal request not found |

**Usecase:** Approve or reject a renewal request.

**Validation Rules:**
- ID: Required, valid integer
- Status: Required, must be one of: approved, rejected
- Renewal request must be in "pending" status
- Device must not be booked for the requested period (for approval)
- Admin role required

**Side Effects (on approval):**
- Borrow request end_date is updated to requested_end_date

---

# Department Endpoints

## GET /api/departments

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/departments` |
| **Auth** | None |
| **Query Params** | None |
| **Header** | None |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Engineering",
      "code": "ENG",
      "user_count": 15,
      "device_count": 25,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Response:** None

**Usecase:** List all departments with user and device counts.

**Validation Rules:** None

---

## GET /api/departments/names

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/departments/names` |
| **Auth** | None |
| **Query Params** | None |
| **Header** | None |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    "Engineering",
    "Marketing",
    "Sales",
    "Human Resources",
    "Finance",
    "Operations",
    "IT",
    "Legal",
    "Customer Support",
    "Research & Development"
  ]
}
```

**Error Response:** None

**Usecase:** Get list of valid department names.

**Validation Rules:** None

---

## GET /api/departments/:id

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/departments/:id` |
| **Auth** | None |
| **Query Params** | None |
| **Header** | None |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Engineering",
    "code": "ENG",
    "user_count": 15,
    "device_count": 25
  }
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid department ID |
| 404 | Department not found |

**Usecase:** Get department by ID.

**Validation Rules:**
- ID: Required, valid integer

---

## POST /api/departments

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/departments` |
| **Auth** | Bearer Token (Admin only) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "name": "Engineering",
  "code": "ENG"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "Engineering",
    "code": "ENG"
  },
  "message": "Department created"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Name/Code is required / Invalid department name / Department code already exists |
| 401 | Unauthorized |

**Usecase:** Create a new department.

**Validation Rules:**
- Name: Required, must be one of the valid department names from `/api/departments/names`
- Code: Required, unique
- Admin role required

---

## PUT /api/departments/:id

| Item | Detail |
|------|--------|
| **Endpoint** | `PUT /api/departments/:id` |
| **Auth** | Bearer Token (Admin only) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "name": "Engineering",
  "code": "ENGR"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Engineering",
    "code": "ENGR"
  },
  "message": "Department updated"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid department ID / No fields to update / Invalid department name / Department code already exists |
| 401 | Unauthorized |

**Usecase:** Update a department.

**Validation Rules:**
- ID: Required, valid integer
- Name (if provided): Must be one of the valid department names
- Code (if provided): Must be unique
- Admin role required

---

## DELETE /api/departments/:id

| Item | Detail |
|------|--------|
| **Endpoint** | `DELETE /api/departments/:id` |
| **Auth** | Bearer Token (Admin only) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "Department deleted"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid department ID / Cannot delete department with users or devices |
| 401 | Unauthorized |

**Usecase:** Delete a department.

**Validation Rules:**
- ID: Required, valid integer
- Cannot delete department with users or devices
- Admin role required

---

## POST /api/departments/bulk

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/departments/bulk` |
| **Auth** | Bearer Token (Admin only) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
[
  { "name": "Engineering", "code": "ENG" },
  { "name": "Marketing", "code": "MKT" },
  { "name": "Sales", "code": "SLS" }
]
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "created": [
      { "id": 1, "name": "Engineering", "code": "ENG" },
      { "id": 2, "name": "Marketing", "code": "MKT" }
    ],
    "errors": ["Department code already exists: SLS"]
  },
  "message": "Departments processed"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid payload. Expected array of departments |
| 400 | Failed to create departments (when all fail) |
| 401 | Unauthorized |

**Usecase:** Bulk create multiple departments.

**Validation Rules:**
- Body: Required, array of department objects
- Each department: name and code required
- Admin role required

---

# Avatar Endpoints

## POST /api/avatars/user/:userId

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/avatars/user/:userId` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: multipart/form-data` |

**Body (multipart/form-data):**
- `avatar`: Image file (JPEG, PNG, GIF, WebP)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "avatarUrl": "/avatars/user/1/avatar.webp",
    "thumbnailUrl": "/avatars/user/1/avatar_thumb.webp"
  }
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid user ID / No file provided / Invalid file type / File too large |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | User not found |
| 500 | Failed to process image |

**Usecase:** Upload or update a user's avatar. Users can only update their own avatar, admins can update any.

**Validation Rules:**
- User ID: Required, valid integer
- File: Required, JPEG/PNG/GIF/WebP format
- File size: Must be within configured limit
- Users can only update their own avatar unless admin

---

## POST /api/avatars/device/:deviceId

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/avatars/device/:deviceId` |
| **Auth** | Bearer Token (Admin only) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: multipart/form-data` |

**Body (multipart/form-data):**
- `avatar`: Image file (JPEG, PNG, GIF, WebP)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "avatarUrl": "/avatars/device/1/avatar.webp",
    "thumbnailUrl": "/avatars/device/1/avatar_thumb.webp"
  }
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid device ID / No file provided / Invalid file type / File too large |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Device not found |
| 500 | Failed to process image |

**Usecase:** Upload or update a device's image.

**Validation Rules:**
- Device ID: Required, valid integer
- File: Required, JPEG/PNG/GIF/WebP format
- File size: Must be within configured limit
- Admin role required

---

## DELETE /api/avatars/user/:userId

| Item | Detail |
|------|--------|
| **Endpoint** | `DELETE /api/avatars/user/:userId` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "Avatar deleted successfully"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid user ID |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | User not found / Avatar not found |
| 500 | Failed to delete avatar |

**Usecase:** Delete a user's avatar. Users can only delete their own avatar, admins can delete any.

**Validation Rules:**
- User ID: Required, valid integer
- Users can only delete their own avatar unless admin

---

## DELETE /api/avatars/device/:deviceId

| Item | Detail |
|------|--------|
| **Endpoint** | `DELETE /api/avatars/device/:deviceId` |
| **Auth** | Bearer Token (Admin only) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "Device image deleted successfully"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid device ID |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Device not found |
| 500 | Failed to delete avatar |

**Usecase:** Delete a device's image.

**Validation Rules:**
- Device ID: Required, valid integer
- Admin role required

---

# Audit Log Endpoints

## GET /api/audit

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/audit` |
| **Auth** | Bearer Token (Admin only) |
| **Query Params** | `startDate`, `endDate`, `objectType`, `objectId`, `actorId`, `action`, `limit` |
| **Header** | `Authorization: Bearer <token>` |

**Query Parameters Detail:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | Filter logs from this date (ISO format) |
| endDate | string | Filter logs until this date (ISO format) |
| objectType | string | Filter by object type (device, user, department, borrow_request, return_request, renewal_request) |
| objectId | number | Filter by object ID |
| actorId | number | Filter by actor (user who performed action) ID |
| action | string | Filter by action type |
| limit | number | Maximum number of logs to return (default: 100) |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "action": "create",
      "object_type": "device",
      "object_id": 5,
      "actor_id": 1,
      "actor_name": "Admin User",
      "actor_email": "admin@example.com",
      "changes": {
        "after": {
          "name": "MacBook Pro",
          "asset_tag": "LAP-005"
        }
      },
      "metadata": {},
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 401 | Unauthorized |

**Usecase:** Get audit logs with optional filters.

**Validation Rules:**
- Admin role required
- Object Type (if provided): Must be one of: device, user, department, borrow_request, return_request, renewal_request

---

## GET /api/audit/object/:type/:id

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/audit/object/:type/:id` |
| **Auth** | Bearer Token (Admin only) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "action": "create",
      "object_type": "device",
      "object_id": 5,
      "changes": {...},
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "action": "update",
      "object_type": "device",
      "object_id": 5,
      "changes": {
        "before": { "status": "available" },
        "after": { "status": "borrowed" }
      },
      "created_at": "2024-01-16T09:00:00.000Z"
    }
  ]
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid object ID / Invalid object type |
| 401 | Unauthorized |

**Usecase:** Get audit logs for a specific object.

**Validation Rules:**
- Type: Required, must be one of: device, user, department, borrow_request, return_request, renewal_request
- ID: Required, valid integer
- Admin role required

---

# In-App Notification Endpoints

## GET /api/in-app-notifications

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/in-app-notifications` |
| **Auth** | Bearer Token |
| **Query Params** | `unread`, `limit`, `offset` |
| **Header** | `Authorization: Bearer <token>` |

**Query Parameters Detail:**
| Parameter | Type | Description |
|-----------|------|-------------|
| unread | string | Set to "true" to get only unread notifications |
| limit | number | Maximum notifications to return (default: 50) |
| offset | number | Pagination offset (default: 0) |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "type": "request_approved",
      "title": "Request Approved",
      "message": "Your request for MacBook Pro has been approved",
      "link": "/loans?tab=active",
      "is_read": false,
      "related_request_id": 5,
      "related_device_id": 1,
      "device_name": "MacBook Pro",
      "created_at": "2024-01-15T10:00:00.000Z"
    }
  ],
  "unreadCount": 3
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 401 | Unauthorized |

**Usecase:** Get notifications for the authenticated user.

**Validation Rules:**
- Valid JWT token required

---

## GET /api/in-app-notifications/unread-count

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/in-app-notifications/unread-count` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 401 | Unauthorized |

**Usecase:** Get unread notification count.

**Validation Rules:**
- Valid JWT token required

---

## POST /api/in-app-notifications

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/in-app-notifications` |
| **Auth** | Bearer Token (Admin only) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "user_id": 2,
  "type": "info",
  "title": "System Maintenance",
  "message": "System will be down for maintenance tonight",
  "link": "/dashboard",
  "related_request_id": null,
  "related_device_id": null
}
```

**Valid Notification Types:**
| Type | Description |
|------|-------------|
| request_approved | Borrow request was approved |
| request_rejected | Borrow request was rejected |
| new_request | New request submitted (admin notification) |
| overdue | Loan is past due date |
| device_returned | Device has been returned |
| renewal_approved | Renewal request was approved |
| renewal_rejected | Renewal request was rejected |
| info | General information notification |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "user_id": 2,
    "type": "info",
    "title": "System Maintenance",
    "message": "System will be down for maintenance tonight",
    "is_read": false,
    "created_at": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | user_id, type, title, and message are required |
| 401 | Unauthorized |
| 403 | Forbidden |

**Usecase:** Create a notification (admin only).

**Validation Rules:**
- User ID: Required
- Type: Required, must be valid notification type
- Title: Required
- Message: Required
- Admin role required

---

## PATCH /api/in-app-notifications/:id/read

| Item | Detail |
|------|--------|
| **Endpoint** | `PATCH /api/in-app-notifications/:id/read` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid notification ID |
| 401 | Unauthorized |
| 404 | Notification not found |

**Usecase:** Mark a notification as read.

**Validation Rules:**
- ID: Required, valid integer

---

## PATCH /api/in-app-notifications/read-all

| Item | Detail |
|------|--------|
| **Endpoint** | `PATCH /api/in-app-notifications/read-all` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 401 | Unauthorized |

**Usecase:** Mark all notifications as read.

**Validation Rules:**
- Valid JWT token required

---

## DELETE /api/in-app-notifications/:id

| Item | Detail |
|------|--------|
| **Endpoint** | `DELETE /api/in-app-notifications/:id` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 400 | Invalid notification ID |
| 401 | Unauthorized |
| 404 | Notification not found |

**Usecase:** Delete a notification.

**Validation Rules:**
- ID: Required, valid integer

---

## DELETE /api/in-app-notifications/clear

| Item | Detail |
|------|--------|
| **Endpoint** | `DELETE /api/in-app-notifications/clear` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "message": "All notifications cleared"
}
```

**Error Response:**
| Code | Message |
|------|---------|
| 401 | Unauthorized |

**Usecase:** Clear all notifications for the authenticated user.

**Validation Rules:**
- Valid JWT token required

---

# Data Types Reference

## User Roles
| Role | Description |
|------|-------------|
| superuser | Full system access, can manage all users and settings |
| admin | Device and request management, cannot manage superusers |
| user | Standard user access, can borrow devices |

## Device Categories
| Category | Description |
|----------|-------------|
| laptop | Laptops and notebooks |
| mobile | Mobile phones |
| tablet | Tablets and iPads |
| monitor | External monitors |
| accessories | Keyboards, mice, headsets, etc. |
| storage | External drives, USB drives |
| ram | Memory modules |

## Device Status
| Status | Description |
|--------|-------------|
| available | Device is available for borrowing |
| borrowed | Device is currently borrowed |
| maintenance | Device is under maintenance/repair |

## Request Status
| Status | Description |
|--------|-------------|
| pending | Request awaiting approval |
| approved | Request approved, awaiting pickup |
| active | Device is currently borrowed |
| returned | Device has been returned |
| rejected | Request was rejected |

## Device Condition
| Condition | Description |
|-----------|-------------|
| excellent | Like new condition |
| good | Minor wear, fully functional |
| fair | Visible wear, functional |
| damaged | Requires repair |

## Renewal Status
| Status | Description |
|--------|-------------|
| pending | Renewal awaiting approval |
| approved | Renewal approved |
| rejected | Renewal rejected |

## Notification Types
| Type | Description |
|------|-------------|
| request_approved | Borrow request was approved |
| request_rejected | Borrow request was rejected |
| new_request | New request submitted (admin notification) |
| overdue | Loan is past due date |
| device_returned | Device has been returned |
| renewal_approved | Renewal request was approved |
| renewal_rejected | Renewal request was rejected |
| info | General information notification |

---

# Error Codes

| HTTP Code | Description |
|-----------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input or validation error |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource does not exist |
| 500 | Internal Server Error |
