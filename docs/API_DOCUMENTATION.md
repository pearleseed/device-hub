# Device Hub - API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Response Format

All responses follow this structure:

```json
{
  "success": true|false,
  "data": {...} | [...],
  "message": "Optional message",
  "error": "Error message if success is false"
}
```

---

## Authentication Endpoints

### POST /api/auth/login

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": false
}
```

**Response (200):**
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

**Error Responses:**
- `400` - Email and password are required
- `401` - Invalid email or password
- `403` - Account has been locked

---

### POST /api/auth/signup

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123",
  "department_id": 1
}
```

**Response (201):**
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

**Error Responses:**
- `400` - Name/Email/Password/Department is required
- `400` - Invalid email format
- `400` - Password must be at least 6 characters
- `400` - An account with this email already exists
- `400` - Invalid department

---

### GET /api/auth/me

Get current authenticated user information.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
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

**Error Responses:**
- `401` - Unauthorized
- `404` - User not found

---

### POST /api/auth/change-password

Change the current user's password.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400` - Current password and new password are required
- `400` - New password must be at least 6 characters
- `401` - Unauthorized / Current password is incorrect
- `404` - User not found

---

## User Endpoints

### GET /api/users

List all users.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
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

---

### GET /api/users/:id

Get user by ID.

**Headers:** `Authorization: Bearer <token>`

**Access:** Users can only view their own profile, admins can view any.

**Response (200):**
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

**Error Responses:**
- `400` - Invalid user ID
- `401` - Unauthorized
- `403` - Forbidden
- `404` - User not found

---

### PUT /api/users/:id

Update user profile.

**Headers:** `Authorization: Bearer <token>`

**Access:** Users can only update their own profile, admins can update any.

**Request Body:**
```json
{
  "name": "John Updated",
  "department_id": 2,
  "avatar_url": "https://new-avatar.com/image.jpg",
  "role": "admin"
}
```

**Note:** Role changes:
- Superusers can assign any role
- Admins can only assign 'user' role
- Regular users cannot change roles

**Response (200):**
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

**Error Responses:**
- `400` - Invalid user ID / No fields to update
- `401` - Unauthorized
- `403` - Forbidden / Admins cannot assign admin or superuser roles

---

### DELETE /api/users/:id

Delete a user.

**Headers:** `Authorization: Bearer <token>`

**Access:** Superuser only

**Response (200):**
```json
{
  "success": true,
  "message": "User deleted"
}
```

**Error Responses:**
- `400` - Invalid user ID / Cannot delete your own account / Cannot delete user with active borrow requests
- `401` - Unauthorized
- `403` - Forbidden - Superuser access required

---

### PATCH /api/users/:id/password

Reset user password.

**Headers:** `Authorization: Bearer <token>`

**Access:** Superuser only

**Request Body:**
```json
{
  "password": "newpassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Error Responses:**
- `400` - Invalid user ID / Password must be at least 6 characters
- `401` - Unauthorized
- `403` - Forbidden - Superuser access required

---

### PATCH /api/users/:id/status

Toggle user active status (lock/unlock account).

**Headers:** `Authorization: Bearer <token>`

**Access:** Superuser only

**Request Body:**
```json
{
  "is_active": false
}
```

**Response (200):**
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

**Error Responses:**
- `400` - Invalid user ID / is_active must be a boolean / Cannot change your own account status
- `401` - Unauthorized
- `403` - Forbidden - Superuser access required

---

## User Import/Export Endpoints

### POST /api/users/import

Import users from CSV file.

**Headers:** `Authorization: Bearer <token>`

**Access:** Admin only

**Request:** `multipart/form-data` with file field named `file`

Or JSON body:
```json
{
  "csvContent": "name,email,department_id,role\nJohn,john@example.com,1,user"
}
```

**Response (200):**
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

**Error Responses:**
- `400` - No CSV file provided / File must be a CSV / File size must be less than 5MB
- `401` - Unauthorized
- `403` - Forbidden

---

### GET /api/users/export

Export users with temporary passwords.

**Headers:** `Authorization: Bearer <token>`

**Access:** Admin only

**Query Parameters:**
- `ids` (optional): Comma-separated user IDs to export

**Response:** CSV file download

---

### GET /api/users/export/admin

Export all users with decrypted passwords.

**Headers:** `Authorization: Bearer <token>`

**Access:** Superuser only

**Response:** CSV file download

---

### GET /api/users/import/template

Download CSV template for user import.

**Headers:** `Authorization: Bearer <token>`

**Access:** Admin only

**Response:** CSV file download

---

### POST /api/users/export/clear-passwords

Clear temporary passwords from memory.

**Headers:** `Authorization: Bearer <token>`

**Access:** Superuser only

**Response (200):**
```json
{
  "success": true,
  "message": "Temporary passwords cleared"
}
```

---

## Device Endpoints

### GET /api/devices/pending-ids

Get IDs of devices that have pending or approved borrow requests.

**Response (200):**
```json
{
  "success": true,
  "data": [1, 2, 3]
}
```

---

### GET /api/devices

List all devices with optional filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category (laptop, mobile, tablet, monitor, accessories, storage, ram) |
| status | string | Filter by status (available, borrowed, maintenance) |
| department_id | number | Filter by department |
| search | string | Search in name, asset_tag, brand, model |
| min_price | number | Minimum price filter |
| max_price | number | Maximum price filter |
| price_field | string | Price field to filter (purchase_price or selling_price) |

**Response (200):**
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

---

### GET /api/devices/:id

Get device by ID.

**Response (200):**
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

**Error Responses:**
- `400` - Invalid device ID
- `404` - Device not found

---

### POST /api/devices

Create a new device.

**Headers:** `Authorization: Bearer <token>`

**Access:** Admin only

**Request Body:**
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

**Required Fields:** name, asset_tag, category, brand, model, department_id, purchase_price, purchase_date

**Response (201):**
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

**Error Responses:**
- `400` - Missing required fields / Asset tag already exists
- `401` - Unauthorized

---

### PUT /api/devices/:id

Update a device.

**Headers:** `Authorization: Bearer <token>`

**Access:** Admin only

**Request Body:**
```json
{
  "name": "MacBook Pro 16 Updated",
  "status": "maintenance",
  "purchase_price": 2599.00
}
```

**Response (200):**
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

**Error Responses:**
- `400` - Invalid device ID / No fields to update / Asset tag already exists
- `401` - Unauthorized

---

### DELETE /api/devices/:id

Delete a device.

**Headers:** `Authorization: Bearer <token>`

**Access:** Admin only

**Response (200):**
```json
{
  "success": true,
  "message": "Device deleted"
}
```

**Error Responses:**
- `400` - Invalid device ID / Cannot delete device with active borrow requests
- `401` - Unauthorized

---

### GET /api/devices/category/:category

Get devices by category.

**Valid Categories:** laptop, mobile, tablet, monitor, accessories, storage, ram

**Response (200):**
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

**Error Responses:**
- `400` - Invalid category

---

### GET /api/devices/status/:status

Get devices by status.

**Valid Statuses:** available, borrowed, maintenance

**Response (200):**
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

**Error Responses:**
- `400` - Invalid status

---

## Borrow Request Endpoints

### GET /api/borrow

List borrow requests.

**Headers:** `Authorization: Bearer <token>`

**Access:** Users see only their own requests, admins see all.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (pending, approved, active, returned, rejected) |
| device_id | number | Filter by device ID |

**Response (200):**
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

---

### GET /api/borrow/:id

Get borrow request by ID.

**Headers:** `Authorization: Bearer <token>`

**Access:** Users can only see their own requests, admins can see all.

**Response (200):**
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

**Error Responses:**
- `400` - Invalid request ID
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Request not found

---

### GET /api/borrow/user/:userId

Get borrow requests for a specific user.

**Headers:** `Authorization: Bearer <token>`

**Access:** Users can only see their own requests, admins can see any user's requests.

**Response (200):**
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

**Error Responses:**
- `400` - Invalid user ID
- `401` - Unauthorized
- `403` - Forbidden

---

### GET /api/borrow/status/:status

Get borrow requests by status.

**Headers:** `Authorization: Bearer <token>`

**Access:** Users see only their own requests, admins see all.

**Valid Statuses:** pending, approved, active, returned, rejected

**Response (200):**
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

**Error Responses:**
- `400` - Invalid status
- `401` - Unauthorized

---

### POST /api/borrow

Create a new borrow request.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "device_id": 1,
  "start_date": "2024-02-01",
  "end_date": "2024-02-15",
  "reason": "Need laptop for client presentation"
}
```

**Response (201):**
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

**Error Responses:**
- `400` - Device ID/Start date/End date/Reason is required
- `400` - Start date cannot be in the past
- `400` - End date must be after start date
- `400` - Device is under maintenance
- `400` - Device is already booked for this period
- `401` - Unauthorized
- `404` - Device not found

---

### PATCH /api/borrow/:id/status

Update borrow request status.

**Headers:** `Authorization: Bearer <token>`

**Access:** Admin only for approve/reject/activate

**Request Body:**
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

**Response (200):**
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

**Error Responses:**
- `400` - Invalid request ID / Invalid status / Cannot transition from X to Y
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Request not found

---

## Return Request Endpoints

### GET /api/returns

List return requests.

**Headers:** `Authorization: Bearer <token>`

**Access:** Users see only their own returns, admins see all.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| condition | string | Filter by device condition (excellent, good, fair, damaged) |

**Response (200):**
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

---

### GET /api/returns/:id

Get return request by ID.

**Headers:** `Authorization: Bearer <token>`

**Access:** Users can only see their own returns, admins can see all.

**Response (200):**
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

**Error Responses:**
- `400` - Invalid return request ID
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Return request not found

---

### POST /api/returns

Create a return request.

**Headers:** `Authorization: Bearer <token>`

**Access:** Borrower or admin

**Request Body:**
```json
{
  "borrow_request_id": 5,
  "condition": "good",
  "notes": "Minor scratch on lid"
}
```

**Valid Conditions:** excellent, good, fair, damaged

**Note:** Notes are required when condition is "damaged".

**Response (201):**
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

**Side Effects:**
- Borrow request status changes to "returned"
- Device status changes to "available" (or "maintenance" if damaged)

**Error Responses:**
- `400` - Borrow request ID is required / Valid condition is required
- `400` - Notes are required when device is returned in damaged condition
- `400` - Can only create return request for active borrowings
- `400` - Return request already exists
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Borrow request not found

---

## Renewal Request Endpoints

### GET /api/renewals

List renewal requests.

**Headers:** `Authorization: Bearer <token>`

**Access:** Users see only their own renewals, admins see all.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (pending, approved, rejected) |

**Response (200):**
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

---

### GET /api/renewals/:id

Get renewal request by ID.

**Headers:** `Authorization: Bearer <token>`

**Access:** Users can only see their own renewals, admins can see all.

**Response (200):**
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

**Error Responses:**
- `400` - Invalid renewal request ID
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Renewal request not found

---

### GET /api/renewals/borrow/:borrowId

Get renewal requests for a specific borrow request.

**Headers:** `Authorization: Bearer <token>`

**Access:** Users can only see their own renewals, admins can see all.

**Response (200):**
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

**Error Responses:**
- `400` - Invalid borrow request ID
- `401` - Unauthorized

---

### GET /api/renewals/status/:status

Get renewal requests by status.

**Headers:** `Authorization: Bearer <token>`

**Access:** Users see only their own renewals, admins see all.

**Valid Statuses:** pending, approved, rejected

**Response (200):**
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

**Error Responses:**
- `400` - Invalid status
- `401` - Unauthorized

---

### POST /api/renewals

Create a renewal request.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "borrow_request_id": 5,
  "requested_end_date": "2024-03-01",
  "reason": "Project deadline extended"
}
```

**Response (201):**
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

**Error Responses:**
- `400` - Borrow request ID/Requested end date/Reason is required
- `400` - Can only request renewal for active loans
- `400` - Requested end date must be after current end date
- `400` - A pending renewal request already exists for this loan
- `401` - Unauthorized
- `403` - You can only request renewal for your own loans
- `404` - Borrow request not found

---

### PATCH /api/renewals/:id/status

Approve or reject a renewal request.

**Headers:** `Authorization: Bearer <token>`

**Access:** Admin only

**Request Body:**
```json
{
  "status": "approved"
}
```

**Valid Statuses:** approved, rejected

**Response (200):**
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

**Side Effects (on approval):**
- Borrow request end_date is updated to requested_end_date

**Error Responses:**
- `400` - Invalid renewal request ID / Invalid status
- `400` - Can only update status of pending renewal requests
- `400` - Device is booked for the requested renewal period
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Renewal request not found

---

## Department Endpoints

### GET /api/departments

List all departments with user and device counts.

**Response (200):**
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

---

### GET /api/departments/names

Get list of valid department names.

**Response (200):**
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

---

### GET /api/departments/:id

Get department by ID.

**Response (200):**
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

**Error Responses:**
- `400` - Invalid department ID
- `404` - Department not found

---

### POST /api/departments

Create a new department.

**Headers:** `Authorization: Bearer <token>`

**Access:** Admin only

**Request Body:**
```json
{
  "name": "Engineering",
  "code": "ENG"
}
```

**Note:** Name must be one of the valid department names from `/api/departments/names`.

**Response (201):**
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

**Error Responses:**
- `400` - Name/Code is required / Invalid department name / Department code already exists
- `401` - Unauthorized

---

### PUT /api/departments/:id

Update a department.

**Headers:** `Authorization: Bearer <token>`

**Access:** Admin only

**Request Body:**
```json
{
  "name": "Engineering",
  "code": "ENGR"
}
```

**Response (200):**
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

**Error Responses:**
- `400` - Invalid department ID / No fields to update / Invalid department name / Department code already exists
- `401` - Unauthorized

---

### DELETE /api/departments/:id

Delete a department.

**Headers:** `Authorization: Bearer <token>`

**Access:** Admin only

**Response (200):**
```json
{
  "success": true,
  "message": "Department deleted"
}
```

**Error Responses:**
- `400` - Invalid department ID / Cannot delete department with users or devices
- `401` - Unauthorized

---

## Avatar Endpoints

### POST /api/avatars/user/:userId

Upload or update a user's avatar.

**Headers:** `Authorization: Bearer <token>`

**Access:** Users can only update their own avatar, admins can update any.

**Request:** `multipart/form-data` with file field named `avatar`

**Supported Formats:** JPEG, PNG, GIF, WebP

**Max File Size:** Configured per entity type

**Response (200):**
```json
{
  "success": true,
  "data": {
    "avatarUrl": "/avatars/user/1/avatar.webp",
    "thumbnailUrl": "/avatars/user/1/avatar_thumb.webp"
  }
}
```

**Error Responses:**
- `400` - Invalid user ID / No file provided / Invalid file type / File too large
- `401` - Unauthorized
- `403` - Forbidden
- `404` - User not found
- `500` - Failed to process image

---

### POST /api/avatars/device/:deviceId

Upload or update a device's image.

**Headers:** `Authorization: Bearer <token>`

**Access:** Admin only

**Request:** `multipart/form-data` with file field named `avatar`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "avatarUrl": "/avatars/device/1/avatar.webp",
    "thumbnailUrl": "/avatars/device/1/avatar_thumb.webp"
  }
}
```

**Error Responses:**
- `400` - Invalid device ID / No file provided / Invalid file type / File too large
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Device not found
- `500` - Failed to process image

---

### DELETE /api/avatars/user/:userId

Delete a user's avatar.

**Headers:** `Authorization: Bearer <token>`

**Access:** Users can only delete their own avatar, admins can delete any.

**Response (200):**
```json
{
  "success": true,
  "message": "Avatar deleted successfully"
}
```

**Error Responses:**
- `400` - Invalid user ID
- `401` - Unauthorized
- `403` - Forbidden
- `404` - User not found / Avatar not found
- `500` - Failed to delete avatar

---

### DELETE /api/avatars/device/:deviceId

Delete a device's image.

**Headers:** `Authorization: Bearer <token>`

**Access:** Admin only

**Response (200):**
```json
{
  "success": true,
  "message": "Device image deleted successfully"
}
```

**Error Responses:**
- `400` - Invalid device ID
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Device not found
- `500` - Failed to delete avatar

---

## Audit Log Endpoints

### GET /api/audit

Get audit logs with optional filters.

**Headers:** `Authorization: Bearer <token>`

**Access:** Admin only

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | Filter logs from this date (ISO format) |
| endDate | string | Filter logs until this date (ISO format) |
| objectType | string | Filter by object type (device, user, department, borrow_request, return_request, renewal_request) |
| objectId | number | Filter by object ID |
| actorId | number | Filter by actor (user who performed action) ID |
| action | string | Filter by action type |
| limit | number | Maximum number of logs to return (default: 100) |

**Response (200):**
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

**Error Responses:**
- `401` - Unauthorized

---

### GET /api/audit/object/:type/:id

Get audit logs for a specific object.

**Headers:** `Authorization: Bearer <token>`

**Access:** Admin only

**Valid Object Types:** device, user, department, borrow_request, return_request, renewal_request

**Response (200):**
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

**Error Responses:**
- `400` - Invalid object ID / Invalid object type
- `401` - Unauthorized

---

## In-App Notification Endpoints

### GET /api/in-app-notifications

Get notifications for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| unread | string | Set to "true" to get only unread notifications |
| limit | number | Maximum notifications to return (default: 50) |
| offset | number | Pagination offset (default: 0) |

**Response (200):**
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

---

### GET /api/in-app-notifications/unread-count

Get unread notification count.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

---

### POST /api/in-app-notifications

Create a notification (admin only).

**Headers:** `Authorization: Bearer <token>`

**Access:** Admin only

**Request Body:**
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
- `request_approved` - Borrow request approved
- `request_rejected` - Borrow request rejected
- `new_request` - New request submitted (for admins)
- `overdue` - Loan is overdue
- `device_returned` - Device has been returned
- `renewal_approved` - Renewal request approved
- `renewal_rejected` - Renewal request rejected
- `info` - General information

**Response (201):**
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

**Error Responses:**
- `400` - user_id, type, title, and message are required
- `401` - Unauthorized
- `403` - Forbidden

---

### PATCH /api/in-app-notifications/:id/read

Mark a notification as read.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

**Error Responses:**
- `400` - Invalid notification ID
- `401` - Unauthorized
- `404` - Notification not found

---

### PATCH /api/in-app-notifications/read-all

Mark all notifications as read.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

### DELETE /api/in-app-notifications/:id

Delete a notification.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

**Error Responses:**
- `400` - Invalid notification ID
- `401` - Unauthorized
- `404` - Notification not found

---

### DELETE /api/in-app-notifications/clear

Clear all notifications for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "All notifications cleared"
}
```

---

## Mattermost Notification Endpoints

### POST /api/notifications/send

Send a notification for a device action.

**Headers:** `Authorization: Bearer <token>`

**Access:** Admin only

**Request Body:**
```json
{
  "action": "BORROW",
  "userId": 2,
  "mattermostUsername": "john.doe",
  "device": {
    "id": 1,
    "name": "MacBook Pro 16",
    "assetTag": "LAP-001"
  },
  "requestId": 5,
  "startDate": "2024-02-01",
  "endDate": "2024-02-15"
}
```

**Valid Actions:**
- `BORROW` - Requires startDate, endDate
- `RETURN` - Requires returnDate
- `RENEWAL` - Requires previousEndDate, newEndDate

**Response (200):**
```json
{
  "success": true,
  "data": {
    "notificationId": "abc123",
    "channel": "direct_message"
  },
  "message": "Notification sent via direct_message"
}
```

**Error Responses:**
- `400` - Invalid or missing action / Missing required fields
- `401` - Unauthorized
- `403` - Forbidden
- `500` - Failed to send notification

---

### GET /api/notifications/status

Get notification service status.

**Headers:** `Authorization: Bearer <token>`

**Access:** Admin only

**Response (200):**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "connected": true,
    "lastError": null,
    "messagesSent": 150,
    "messagesQueued": 0
  }
}
```

---

### GET /api/notifications/users

Get all user notification states (for debugging).

**Headers:** `Authorization: Bearer <token>`

**Access:** Admin only

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user_2": {
      "mattermostUserId": "abc123",
      "channelId": "xyz789",
      "lastNotification": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

---

### GET /api/notifications/idempotency

Get idempotency records (for debugging).

**Headers:** `Authorization: Bearer <token>`

**Access:** Admin only

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "key": "borrow_5_approved",
      "timestamp": "2024-01-15T10:00:00.000Z",
      "result": "sent"
    }
  ]
}
```

---

### POST /api/notifications/initialize

Manually initialize the notification service.

**Headers:** `Authorization: Bearer <token>`

**Access:** Admin only

**Response (200):**
```json
{
  "success": true,
  "message": "Notification service initialized"
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Forbidden
- `500` - Failed to initialize notification service

---

## Mattermost Slash Command Endpoints

### POST /api/mattermost/command

Handle incoming slash commands from Mattermost.

**Content-Type:** `application/x-www-form-urlencoded` or `application/json`

**Request Body (form data):**
```
channel_id=abc123
channel_name=general
command=/device
text=list
token=verification_token
trigger_id=xyz789
user_id=mm_user_123
user_name=john.doe
```

**Response (200):**
```json
{
  "response_type": "ephemeral",
  "text": "Here are the available devices...",
  "attachments": [...]
}
```

---

### POST /api/mattermost/interactive

Handle interactive message actions (button clicks, selections).

**Request Body:**
```json
{
  "user_id": "mm_user_123",
  "user_name": "john.doe",
  "channel_id": "abc123",
  "trigger_id": "xyz789",
  "context": {
    "action": "select_device",
    "device_id": 1
  }
}
```

**Response (200):**
```json
{
  "update": {
    "message": "Device selected!",
    "props": {
      "attachments": [...]
    }
  }
}
```

---

### POST /api/mattermost/text-input

Handle text input during wizard sessions.

**Request Body:**
```json
{
  "mattermostUserId": "mm_user_123",
  "text": "2024-02-15"
}
```

**Response (200):**
```json
{
  "success": true,
  "handled": true,
  "response": {
    "text": "End date set to 2024-02-15",
    "attachments": [...]
  }
}
```

---

### GET /api/mattermost/sessions

Get session statistics.

**Headers:** `Authorization: Bearer <token>`

**Access:** Admin only

**Response (200):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "activeSessions": 3,
      "totalCreated": 150,
      "expired": 147
    },
    "sessions": [
      {
        "id": "session_abc123",
        "action": "borrow",
        "step": "select_dates",
        "mattermostUserId": "mm_user_123",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "expiresAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "userMappings": {
      "mm_user_123": 2,
      "mm_user_456": 5
    }
  }
}
```

---

## Data Types Reference

### User Roles
| Role | Description |
|------|-------------|
| superuser | Full system access, can manage all users and settings |
| admin | Device and request management, cannot manage superusers |
| user | Standard user access, can borrow devices |

### Device Categories
| Category | Description |
|----------|-------------|
| laptop | Laptops and notebooks |
| mobile | Mobile phones |
| tablet | Tablets and iPads |
| monitor | External monitors |
| accessories | Keyboards, mice, headsets, etc. |
| storage | External drives, USB drives |
| ram | Memory modules |

### Device Status
| Status | Description |
|--------|-------------|
| available | Device is available for borrowing |
| borrowed | Device is currently borrowed |
| maintenance | Device is under maintenance/repair |

### Request Status
| Status | Description |
|--------|-------------|
| pending | Request awaiting approval |
| approved | Request approved, awaiting pickup |
| active | Device is currently borrowed |
| returned | Device has been returned |
| rejected | Request was rejected |

### Device Condition
| Condition | Description |
|-----------|-------------|
| excellent | Like new condition |
| good | Minor wear, fully functional |
| fair | Visible wear, functional |
| damaged | Requires repair |

### Renewal Status
| Status | Description |
|--------|-------------|
| pending | Renewal awaiting approval |
| approved | Renewal approved |
| rejected | Renewal rejected |

### Notification Types
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

## Error Codes

| HTTP Code | Description |
|-----------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input or validation error |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource does not exist |
| 500 | Internal Server Error |
