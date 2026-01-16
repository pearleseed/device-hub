# Device Hub - Test Cases Documentation

## Overview

Tài liệu này mô tả chi tiết các test cases cho Device Hub API, được tổ chức theo cấu trúc chuẩn.

## Test Framework

- **Framework:** Vitest
- **Property Testing:** fast-check
- **Base URL:** `http://localhost:3000/api`

---

# Authentication Tests (Requirements 1.1-1.10)

## TC-AUTH-001: Login với credentials hợp lệ

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
  "password": "password123"
}
```

**Success Response (200):**
- `success: true`
- `user` object với thông tin user
- Cookie `auth_token` được set

**Error Response:** N/A

**Usecase:** Xác thực user và nhận JWT token (Req 1.1)

**Validation Rules:**
- Email và password phải khớp với database

---

## TC-AUTH-002: Login với credentials không hợp lệ

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
  "password": "wrongpassword"
}
```

**Success Response:** N/A

**Error Response (401):**
- `success: false`
- `error` message

**Usecase:** Từ chối đăng nhập với mật khẩu sai (Req 1.2)

**Validation Rules:**
- Password không khớp → 401

---

## TC-AUTH-003: Login với user không tồn tại

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/auth/login` |
| **Auth** | None |
| **Query Params** | None |
| **Header** | `Content-Type: application/json` |

**Body:**
```json
{
  "email": "nonexistent@example.com",
  "password": "anypassword"
}
```

**Success Response:** N/A

**Error Response (401):**
- `success: false`
- `error` message

**Usecase:** Từ chối đăng nhập với email không tồn tại (Req 1.2)

**Validation Rules:**
- Email không tồn tại → 401

---

## TC-AUTH-004: Login thiếu email

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/auth/login` |
| **Auth** | None |
| **Query Params** | None |
| **Header** | `Content-Type: application/json` |

**Body:**
```json
{
  "password": "anypassword"
}
```

**Success Response:** N/A

**Error Response (400):**
- `success: false`

**Usecase:** Validate required field email

**Validation Rules:**
- Email là required field

---

## TC-AUTH-005: Login thiếu password

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/auth/login` |
| **Auth** | None |
| **Query Params** | None |
| **Header** | `Content-Type: application/json` |

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response:** N/A

**Error Response (400):**
- `success: false`

**Usecase:** Validate required field password

**Validation Rules:**
- Password là required field

---

## TC-AUTH-006: Signup với data hợp lệ

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
  "email": "newuser@example.com",
  "password": "password123",
  "department_id": 1
}
```

**Success Response (201):**
- `success: true`
- `user` object
- Cookie `auth_token` được set

**Error Response:** N/A

**Usecase:** Tạo tài khoản mới (Req 1.4)

**Validation Rules:**
- Tất cả fields required
- Email unique
- Password >= 6 ký tự

---

## TC-AUTH-007: Signup với email trùng lặp

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/auth/signup` |
| **Auth** | None |
| **Query Params** | None |
| **Header** | `Content-Type: application/json` |

**Body:**
```json
{
  "name": "Another User",
  "email": "existing@example.com",
  "password": "password123",
  "department_id": 1
}
```

**Success Response:** N/A

**Error Response (400):**
- `success: false`
- `error` chứa "email"

**Usecase:** Từ chối đăng ký với email đã tồn tại (Req 1.5)

**Validation Rules:**
- Email phải unique trong database

---

## TC-AUTH-008: Signup với password < 6 ký tự

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/auth/signup` |
| **Auth** | None |
| **Query Params** | None |
| **Header** | `Content-Type: application/json` |

**Body:**
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "12345",
  "department_id": 1
}
```

**Success Response:** N/A

**Error Response (400):**
- `success: false`
- `error` chứa "6"

**Usecase:** Validate password length (Req 1.6)

**Validation Rules:**
- Password >= 6 ký tự

---

## TC-AUTH-009: Get current user với token hợp lệ

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/auth/me` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
- `success: true`
- `user` object với thông tin user

**Error Response:** N/A

**Usecase:** Lấy thông tin user hiện tại (Req 1.7)

**Validation Rules:**
- Token hợp lệ

---

## TC-AUTH-010: Get current user với token không hợp lệ

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/auth/me` |
| **Auth** | Invalid Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer invalid-token` |

**Body:** None

**Success Response:** N/A

**Error Response (401):**
- `success: false`

**Usecase:** Từ chối truy cập với token không hợp lệ (Req 1.8)

**Validation Rules:**
- Token phải valid JWT

---

## TC-AUTH-011: Đổi password với current password đúng

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
- `success: true`
- `message: "Password changed successfully"`

**Error Response:** N/A

**Usecase:** Đổi password thành công (Req 1.9)

**Validation Rules:**
- Current password phải đúng
- New password >= 6 ký tự

---

## TC-AUTH-012: Đổi password với current password sai

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/auth/change-password` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "currentPassword": "wrongpassword",
  "newPassword": "newpassword123"
}
```

**Success Response:** N/A

**Error Response (401):**
- `success: false`
- `error` defined

**Usecase:** Từ chối đổi password với current password sai (Req 1.10)

**Validation Rules:**
- Current password phải khớp

---

# Device Tests (Requirements 2.1-2.13)

## TC-DEV-001: List tất cả devices

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/devices` |
| **Auth** | Bearer Token (Admin) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
- `success: true`
- `data`: Array of devices với department information

**Error Response:** N/A

**Usecase:** Lấy danh sách tất cả devices (Req 2.1)

**Validation Rules:**
- Mỗi device có: id, name, asset_tag, category, department_id

---

## TC-DEV-002: Filter devices theo category

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/devices` |
| **Auth** | Bearer Token |
| **Query Params** | `category=laptop` |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
- `success: true`
- `data`: Array of devices với category = "laptop"

**Error Response:** N/A

**Usecase:** Filter devices theo category (Req 2.2)

**Validation Rules:**
- Tất cả devices trả về phải có category khớp

---

## TC-DEV-003: Filter devices theo status

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/devices` |
| **Auth** | Bearer Token |
| **Query Params** | `status=available` |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
- `success: true`
- `data`: Array of devices với status = "available"

**Error Response:** N/A

**Usecase:** Filter devices theo status (Req 2.3)

**Validation Rules:**
- Tất cả devices trả về phải có status khớp

---

## TC-DEV-004: Search devices

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/devices` |
| **Auth** | Bearer Token |
| **Query Params** | `search=MacBook` |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
- `success: true`
- `data`: Array of devices matching search term

**Error Response:** N/A

**Usecase:** Search devices theo name, asset_tag, brand, model (Req 2.4)

**Validation Rules:**
- Search term match trong name, asset_tag, brand, hoặc model

---

## TC-DEV-005: Filter devices theo price range

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/devices` |
| **Auth** | Bearer Token |
| **Query Params** | `min_price=500&max_price=2000` |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
- `success: true`
- `data`: Array of devices trong price range

**Error Response:** N/A

**Usecase:** Filter devices theo price range (Req 2.5)

**Validation Rules:**
- purchase_price >= min_price AND < max_price

---

## TC-DEV-006: Get device by ID

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/devices/:id` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
- `success: true`
- `data`: Device object với specs_json

**Error Response:** N/A

**Usecase:** Lấy chi tiết device theo ID (Req 2.6)

**Validation Rules:**
- ID phải tồn tại

---

## TC-DEV-007: Get device với ID không tồn tại

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/devices/:id` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response:** N/A

**Error Response (404):**
- `success: false`
- `error` defined

**Usecase:** Trả về 404 cho device không tồn tại (Req 2.7)

**Validation Rules:**
- ID không tồn tại → 404

---

## TC-DEV-008: Admin tạo device

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/devices` |
| **Auth** | Bearer Token (Admin) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "name": "MacBook Pro 16",
  "asset_tag": "LAP-001",
  "category": "laptop",
  "brand": "Apple",
  "model": "MacBook Pro 16-inch",
  "department_id": 1,
  "purchase_price": 2499.00,
  "purchase_date": "2024-01-15"
}
```

**Success Response (201):**
- `success: true`
- `data`: Created device object

**Error Response:** N/A

**Usecase:** Admin tạo device mới (Req 2.8)

**Validation Rules:**
- User phải có role admin
- Tất cả required fields phải có

---

## TC-DEV-009: Non-admin tạo device

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/devices` |
| **Auth** | Bearer Token (User) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "name": "Test Device",
  "asset_tag": "TEST-001",
  "category": "laptop",
  "brand": "TestBrand",
  "model": "TestModel",
  "department_id": 1,
  "purchase_price": 1000,
  "purchase_date": "2024-01-01"
}
```

**Success Response:** N/A

**Error Response (403):**
- `success: false`
- `error` defined

**Usecase:** Từ chối non-admin tạo device (Req 2.9)

**Validation Rules:**
- Chỉ admin mới được tạo device

---

## TC-DEV-010: Tạo device với asset_tag trùng

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/devices` |
| **Auth** | Bearer Token (Admin) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "name": "Another Device",
  "asset_tag": "EXISTING-TAG",
  "category": "laptop",
  "brand": "Brand",
  "model": "Model",
  "department_id": 1,
  "purchase_price": 1000,
  "purchase_date": "2024-01-01"
}
```

**Success Response:** N/A

**Error Response (400):**
- `success: false`
- `error` chứa "Asset tag"

**Usecase:** Từ chối tạo device với asset_tag đã tồn tại (Req 2.10)

**Validation Rules:**
- Asset tag phải unique

---

## TC-DEV-011: Admin update device

| Item | Detail |
|------|--------|
| **Endpoint** | `PUT /api/devices/:id` |
| **Auth** | Bearer Token (Admin) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "name": "Updated Device Name"
}
```

**Success Response (200):**
- `success: true`
- `data`: Updated device object

**Error Response:** N/A

**Usecase:** Admin update device (Req 2.11)

**Validation Rules:**
- User phải có role admin

---

## TC-DEV-012: Admin delete device không có active requests

| Item | Detail |
|------|--------|
| **Endpoint** | `DELETE /api/devices/:id` |
| **Auth** | Bearer Token (Admin) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
- `success: true`

**Error Response:** N/A

**Usecase:** Admin xóa device không có active borrow requests (Req 2.12)

**Validation Rules:**
- Device không có active borrow requests

---

# User Tests (Requirements 3.1-3.12)

## TC-USER-001: Admin list tất cả users

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/users` |
| **Auth** | Bearer Token (Admin) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
- `success: true`
- `data`: Array of users với department information

**Error Response:** N/A

**Usecase:** Admin lấy danh sách tất cả users (Req 3.1)

**Validation Rules:**
- User phải có role admin

---

## TC-USER-002: Non-admin list users

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/users` |
| **Auth** | Bearer Token (User) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response:** N/A

**Error Response (403):**
- `success: false`
- `error` defined

**Usecase:** Từ chối non-admin list users (Req 3.2)

**Validation Rules:**
- Chỉ admin mới được list users

---

## TC-USER-003: User xem profile của mình

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/users/:id` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
- `success: true`
- `data`: User object

**Error Response:** N/A

**Usecase:** User xem profile của chính mình (Req 3.3)

**Validation Rules:**
- ID phải là ID của user hiện tại

---

## TC-USER-004: Admin xem profile của user khác

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/users/:id` |
| **Auth** | Bearer Token (Admin) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
- `success: true`
- `data`: User object

**Error Response:** N/A

**Usecase:** Admin xem profile của bất kỳ user nào (Req 3.4)

**Validation Rules:**
- User phải có role admin

---

## TC-USER-005: Non-admin xem profile user khác

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/users/:id` |
| **Auth** | Bearer Token (User) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response:** N/A

**Error Response (403):**
- `success: false`
- `error` defined

**Usecase:** Từ chối non-admin xem profile user khác (Req 3.5)

**Validation Rules:**
- User chỉ được xem profile của mình

---

## TC-USER-006: User update profile của mình

| Item | Detail |
|------|--------|
| **Endpoint** | `PUT /api/users/:id` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "name": "Updated Name"
}
```

**Success Response (200):**
- `success: true`
- `data`: Updated user object

**Error Response:** N/A

**Usecase:** User update profile của chính mình (Req 3.6)

**Validation Rules:**
- ID phải là ID của user hiện tại

---

## TC-USER-007: Superuser reset password

| Item | Detail |
|------|--------|
| **Endpoint** | `PATCH /api/users/:id/password` |
| **Auth** | Bearer Token (Superuser) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "password": "newpassword123"
}
```

**Success Response (200):**
- `success: true`
- `message` chứa "reset"

**Error Response:** N/A

**Usecase:** Superuser reset password cho user (Req 3.7)

**Validation Rules:**
- User phải có role superuser
- Password >= 6 ký tự

---

## TC-USER-008: Non-superuser reset password

| Item | Detail |
|------|--------|
| **Endpoint** | `PATCH /api/users/:id/password` |
| **Auth** | Bearer Token (Admin) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "password": "newpassword123"
}
```

**Success Response:** N/A

**Error Response (403):**
- `success: false`
- `error` chứa "Superuser"

**Usecase:** Từ chối non-superuser reset password (Req 3.8)

**Validation Rules:**
- Chỉ superuser mới được reset password

---

## TC-USER-009: Superuser toggle user status

| Item | Detail |
|------|--------|
| **Endpoint** | `PATCH /api/users/:id/status` |
| **Auth** | Bearer Token (Superuser) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "is_active": false
}
```

**Success Response (200):**
- `success: true`
- `data.is_active`: false

**Error Response:** N/A

**Usecase:** Superuser lock/unlock user account (Req 3.9)

**Validation Rules:**
- User phải có role superuser

---

## TC-USER-010: Superuser toggle own status

| Item | Detail |
|------|--------|
| **Endpoint** | `PATCH /api/users/:id/status` |
| **Auth** | Bearer Token (Superuser) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "is_active": false
}
```

**Success Response:** N/A

**Error Response (400):**
- `success: false`
- `error` chứa "own"

**Usecase:** Từ chối superuser toggle status của chính mình (Req 3.10)

**Validation Rules:**
- Không được thay đổi status của chính mình

---

## TC-USER-011: Superuser delete user

| Item | Detail |
|------|--------|
| **Endpoint** | `DELETE /api/users/:id` |
| **Auth** | Bearer Token (Superuser) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
- `success: true`
- `message` chứa "deleted"

**Error Response:** N/A

**Usecase:** Superuser xóa user không có active requests (Req 3.11)

**Validation Rules:**
- User phải có role superuser
- User không có active borrow requests

---

# Borrow Request Tests (Requirements 4.1-4.11)

## TC-BORROW-001: Admin list tất cả borrow requests

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/borrow` |
| **Auth** | Bearer Token (Admin) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
- `success: true`
- `data`: Array of all borrow requests

**Error Response:** N/A

**Usecase:** Admin xem tất cả borrow requests (Req 4.1)

**Validation Rules:**
- User phải có role admin

---

## TC-BORROW-002: User list borrow requests của mình

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/borrow` |
| **Auth** | Bearer Token (User) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
- `success: true`
- `data`: Array of user's own borrow requests

**Error Response:** N/A

**Usecase:** User chỉ xem borrow requests của mình (Req 4.2)

**Validation Rules:**
- Tất cả requests trả về phải có user_id = current user

---

## TC-BORROW-003: Tạo borrow request cho device available

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
  "reason": "Need laptop for project"
}
```

**Success Response (201):**
- `success: true`
- `data.status`: "pending"

**Error Response:** N/A

**Usecase:** Tạo borrow request cho device available (Req 4.3)

**Validation Rules:**
- Device phải available
- Dates hợp lệ

---

## TC-BORROW-004: Tạo borrow request cho device unavailable

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
  "reason": "Need device"
}
```

**Success Response:** N/A

**Error Response (400):**
- `success: false`
- `error` defined

**Usecase:** Từ chối tạo request cho device đang được mượn (Req 4.4)

**Validation Rules:**
- Device không được đang inuse

---

## TC-BORROW-005: Tạo borrow request với invalid date range

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
  "start_date": "2024-02-15",
  "end_date": "2024-02-01",
  "reason": "Test"
}
```

**Success Response:** N/A

**Error Response (400):**
- `success: false`
- `error` chứa "date"

**Usecase:** Từ chối tạo request với end_date trước start_date (Req 4.5)

**Validation Rules:**
- end_date phải sau start_date

---

## TC-BORROW-006: Tạo borrow request với conflicting booking

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
  "start_date": "2024-02-03",
  "end_date": "2024-02-10",
  "reason": "Overlapping request"
}
```

**Success Response:** N/A

**Error Response (400):**
- `success: false`
- `error` chứa "booked"

**Usecase:** Từ chối tạo request trùng thời gian với booking khác (Req 4.6)

**Validation Rules:**
- Không được overlap với existing bookings

---

## TC-BORROW-007: Admin approve pending request

| Item | Detail |
|------|--------|
| **Endpoint** | `PATCH /api/borrow/:id/status` |
| **Auth** | Bearer Token (Admin) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "status": "approved"
}
```

**Success Response (200):**
- `success: true`
- `data.status`: "approved"

**Error Response:** N/A

**Usecase:** Admin approve pending request (Req 4.7)

**Validation Rules:**
- User phải có role admin
- Request phải đang pending

---

## TC-BORROW-008: Admin activate approved request

| Item | Detail |
|------|--------|
| **Endpoint** | `PATCH /api/borrow/:id/status` |
| **Auth** | Bearer Token (Admin) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "status": "active"
}
```

**Success Response (200):**
- `success: true`
- `data.status`: "active"
- Device status → "inuse"

**Error Response:** N/A

**Usecase:** Admin activate approved request (Req 4.8)

**Validation Rules:**
- Request phải đang approved

---

## TC-BORROW-009: Return active request

| Item | Detail |
|------|--------|
| **Endpoint** | `PATCH /api/borrow/:id/status` |
| **Auth** | Bearer Token (Admin) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "status": "returned"
}
```

**Success Response (200):**
- `success: true`
- `data.status`: "returned"
- Device status → "available"

**Error Response:** N/A

**Usecase:** Return active request (Req 4.9)

**Validation Rules:**
- Request phải đang active

---

## TC-BORROW-010: Invalid status transition

| Item | Detail |
|------|--------|
| **Endpoint** | `PATCH /api/borrow/:id/status` |
| **Auth** | Bearer Token (Admin) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "status": "active"
}
```

**Success Response:** N/A

**Error Response (400):**
- `success: false`
- `error` chứa "transition"

**Usecase:** Từ chối invalid status transition (pending → active) (Req 4.10)

**Validation Rules:**
- Phải tuân theo valid status transitions

---

## TC-BORROW-011: Get user's borrow requests

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/borrow/user/:userId` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
- `success: true`
- `data`: Array of user's borrow requests

**Error Response:** N/A

**Usecase:** Lấy borrow requests của user cụ thể (Req 4.11)

**Validation Rules:**
- User chỉ xem được requests của mình (trừ admin)

---

# Return Request Tests (Requirements 5.1-5.7)

## TC-RETURN-001: Admin list tất cả return requests

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/returns` |
| **Auth** | Bearer Token (Admin) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
- `success: true`
- `data`: Array of all return requests

**Error Response:** N/A

**Usecase:** Admin xem tất cả return requests (Req 5.1)

**Validation Rules:**
- User phải có role admin

---

## TC-RETURN-002: User list return requests của mình

| Item | Detail |
|------|--------|
| **Endpoint** | `GET /api/returns` |
| **Auth** | Bearer Token (User) |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>` |

**Body:** None

**Success Response (200):**
- `success: true`
- `data`: Array of user's own return requests

**Error Response:** N/A

**Usecase:** User chỉ xem return requests của mình (Req 5.2)

**Validation Rules:**
- Tất cả requests trả về phải có user_id = current user

---

## TC-RETURN-003: Tạo return request cho active borrow

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/returns` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "borrow_request_id": 5,
  "condition": "good",
  "notes": "Device returned in good condition"
}
```

**Success Response (201):**
- `success: true`
- Borrow request status → "returned"

**Error Response:** N/A

**Usecase:** Tạo return request cho active borrow (Req 5.3)

**Validation Rules:**
- Borrow request phải đang active

---

## TC-RETURN-004: Tạo return request cho non-active borrow

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/returns` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "borrow_request_id": 5,
  "condition": "good"
}
```

**Success Response:** N/A

**Error Response (400):**
- `success: false`
- `error` chứa "active"

**Usecase:** Từ chối return cho non-active borrow (Req 5.4)

**Validation Rules:**
- Borrow request phải đang active

---

## TC-RETURN-005: Return với condition damaged → device maintenance

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/returns` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "borrow_request_id": 5,
  "condition": "damaged",
  "notes": "Screen damage"
}
```

**Success Response (201):**
- `success: true`
- Device status → "maintenance"

**Error Response:** N/A

**Usecase:** Device chuyển sang maintenance khi return damaged (Req 5.5)

**Validation Rules:**
- Notes required khi condition = damaged

---

## TC-RETURN-006: Return với condition non-damaged → device available

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/returns` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "borrow_request_id": 5,
  "condition": "excellent",
  "notes": "Perfect condition"
}
```

**Success Response (201):**
- `success: true`
- Device status → "available"

**Error Response:** N/A

**Usecase:** Device chuyển sang available khi return non-damaged (Req 5.6)

**Validation Rules:**
- Condition phải là excellent, good, hoặc fair

---

## TC-RETURN-007: Duplicate return request

| Item | Detail |
|------|--------|
| **Endpoint** | `POST /api/returns` |
| **Auth** | Bearer Token |
| **Query Params** | None |
| **Header** | `Authorization: Bearer <token>`, `Content-Type: application/json` |

**Body:**
```json
{
  "borrow_request_id": 5,
  "condition": "good"
}
```

**Success Response:** N/A

**Error Response (400):**
- `success: false`
- `error` defined

**Usecase:** Từ chối duplicate return request (Req 5.7)

**Validation Rules:**
- Mỗi borrow request chỉ có 1 return request

---
