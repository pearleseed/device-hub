import { http, HttpResponse } from "msw";

const API_BASE = "http://localhost:3001/api";

// Mock data
export const mockUser = {
  id: 1,
  name: "Test User",
  email: "test@example.com",
  department_id: 1,
  department_name: "Engineering",
  role: "user" as const,
  avatar_url: "https://example.com/avatar.jpg",
  created_at: "2024-01-01T00:00:00.000Z",
};

export const mockAdmin = {
  id: 2,
  name: "Admin User",
  email: "admin@example.com",
  department_id: 1,
  department_name: "Engineering",
  role: "admin" as const,
  avatar_url: "https://example.com/admin-avatar.jpg",
  created_at: "2024-01-01T00:00:00.000Z",
};

export const mockDepartment = {
  id: 1,
  name: "Engineering",
  code: "ENG",
  created_at: "2024-01-01T00:00:00.000Z",
};

export const mockEquipment = {
  id: 1,
  name: 'MacBook Pro 16"',
  asset_tag: "LAP-001",
  category: "laptop" as const,
  brand: "Apple",
  model: 'MacBook Pro 16" M3 Max',
  status: "available" as const,
  department_id: 1,
  department_name: "Engineering",
  purchase_price: 3499.99,
  purchase_date: "2024-01-15",
  specs: { processor: "M3 Max", ram: "36GB", storage: "1TB SSD" },
  specs_json: '{"processor":"M3 Max","ram":"36GB","storage":"1TB SSD"}',
  image_url: "https://example.com/macbook.jpg",
  created_at: "2024-01-15T00:00:00.000Z",
};

export const mockBorrowingRequest = {
  id: 1,
  equipment_id: 1,
  user_id: 1,
  approved_by: null,
  start_date: "2024-02-01",
  end_date: "2024-02-15",
  reason: "Project development",
  status: "pending" as const,
  created_at: "2024-01-20T00:00:00.000Z",
  updated_at: "2024-01-20T00:00:00.000Z",
  equipment_name: 'MacBook Pro 16"',
  equipment_asset_tag: "LAP-001",
  equipment_image: "https://example.com/macbook.jpg",
  equipment_category: "laptop" as const,
  user_name: "Test User",
  user_email: "test@example.com",
};

export const mockReturnRequest = {
  id: 1,
  borrowing_request_id: 1,
  return_date: "2024-02-15",
  device_condition: "good" as const,
  notes: "Device returned in good condition",
  created_at: "2024-02-15T00:00:00.000Z",
  equipment_id: 1,
  equipment_name: 'MacBook Pro 16"',
  equipment_asset_tag: "LAP-001",
  user_id: 1,
  user_name: "Test User",
};

export const handlers = [
  // Auth routes
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.email === "test@example.com" && body.password === "password123") {
      return HttpResponse.json({
        success: true,
        data: {
          token: "mock-jwt-token",
          user: mockUser,
        },
      });
    }
    if (body.email === "admin@example.com" && body.password === "admin123") {
      return HttpResponse.json({
        success: true,
        data: {
          token: "mock-admin-jwt-token",
          user: mockAdmin,
        },
      });
    }
    return HttpResponse.json(
      { success: false, error: "Invalid email or password" },
      { status: 401 },
    );
  }),

  http.post(`${API_BASE}/auth/signup`, async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      email: string;
      password: string;
      department_id: number;
    };
    if (body.email === "existing@example.com") {
      return HttpResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 400 },
      );
    }
    if (body.password.length < 6) {
      return HttpResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }
    return HttpResponse.json(
      {
        success: true,
        data: {
          token: "mock-new-user-token",
          user: { ...mockUser, name: body.name, email: body.email },
        },
      },
      { status: 201 },
    );
  }),

  http.get(`${API_BASE}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return HttpResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const token = authHeader.substring(7);
    if (token === "mock-jwt-token") {
      return HttpResponse.json({ success: true, data: mockUser });
    }
    if (token === "mock-admin-jwt-token") {
      return HttpResponse.json({ success: true, data: mockAdmin });
    }
    return HttpResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }),

  // Users routes
  http.get(`${API_BASE}/users`, ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return HttpResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    return HttpResponse.json({ success: true, data: [mockUser, mockAdmin] });
  }),

  http.get(`${API_BASE}/users/:id`, ({ params }) => {
    const id = Number(params.id);
    if (id === 1) return HttpResponse.json({ success: true, data: mockUser });
    if (id === 2) return HttpResponse.json({ success: true, data: mockAdmin });
    return HttpResponse.json(
      { success: false, error: "User not found" },
      { status: 404 },
    );
  }),

  http.put(`${API_BASE}/users/:id`, async ({ params, request }) => {
    const id = Number(params.id);
    const body = (await request.json()) as Partial<typeof mockUser>;
    return HttpResponse.json({
      success: true,
      data: { ...mockUser, id, ...body },
      message: "User updated",
    });
  }),

  http.delete(`${API_BASE}/users/:id`, ({ params }) => {
    const id = Number(params.id);
    if (id === 999) {
      return HttpResponse.json(
        {
          success: false,
          error: "Cannot delete user with active borrowing requests",
        },
        { status: 400 },
      );
    }
    return HttpResponse.json({ success: true, message: "User deleted" });
  }),

  // Departments routes
  http.get(`${API_BASE}/departments`, () => {
    return HttpResponse.json({ success: true, data: [mockDepartment] });
  }),

  http.get(`${API_BASE}/departments/:id`, ({ params }) => {
    const id = Number(params.id);
    if (id === 1)
      return HttpResponse.json({ success: true, data: mockDepartment });
    return HttpResponse.json(
      { success: false, error: "Department not found" },
      { status: 404 },
    );
  }),

  http.post(`${API_BASE}/departments`, async ({ request }) => {
    const body = (await request.json()) as { name: string; code: string };
    return HttpResponse.json(
      {
        success: true,
        data: { id: 2, ...body, created_at: new Date().toISOString() },
        message: "Department created",
      },
      { status: 201 },
    );
  }),

  http.put(`${API_BASE}/departments/:id`, async ({ params, request }) => {
    const id = Number(params.id);
    const body = (await request.json()) as Partial<typeof mockDepartment>;
    return HttpResponse.json({
      success: true,
      data: { ...mockDepartment, id, ...body },
      message: "Department updated",
    });
  }),

  http.delete(`${API_BASE}/departments/:id`, () => {
    return HttpResponse.json({ success: true, message: "Department deleted" });
  }),

  // Equipment routes
  http.get(`${API_BASE}/equipment`, ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const status = url.searchParams.get("status");

    let data = [mockEquipment];
    if (category && mockEquipment.category !== category) {
      data = [];
    }
    if (status && mockEquipment.status !== status) {
      data = [];
    }
    return HttpResponse.json({ success: true, data });
  }),

  http.get(`${API_BASE}/equipment/:id`, ({ params }) => {
    const id = Number(params.id);
    if (id === 1)
      return HttpResponse.json({ success: true, data: mockEquipment });
    return HttpResponse.json(
      { success: false, error: "Equipment not found" },
      { status: 404 },
    );
  }),

  http.post(`${API_BASE}/equipment`, async ({ request }) => {
    const body = (await request.json()) as typeof mockEquipment;
    if (body.asset_tag === "DUPLICATE") {
      return HttpResponse.json(
        { success: false, error: "Asset tag already exists" },
        { status: 400 },
      );
    }
    return HttpResponse.json(
      {
        success: true,
        data: { ...mockEquipment, ...body, id: 2 },
        message: "Equipment created",
      },
      { status: 201 },
    );
  }),

  http.put(`${API_BASE}/equipment/:id`, async ({ params, request }) => {
    const id = Number(params.id);
    const body = (await request.json()) as Partial<typeof mockEquipment>;
    return HttpResponse.json({
      success: true,
      data: { ...mockEquipment, id, ...body },
      message: "Equipment updated",
    });
  }),

  http.delete(`${API_BASE}/equipment/:id`, ({ params }) => {
    const id = Number(params.id);
    if (id === 999) {
      return HttpResponse.json(
        {
          success: false,
          error: "Cannot delete equipment with active borrowing requests",
        },
        { status: 400 },
      );
    }
    return HttpResponse.json({ success: true, message: "Equipment deleted" });
  }),

  http.get(`${API_BASE}/equipment/category/:category`, ({ params }) => {
    const category = params.category as string;
    if (category === mockEquipment.category) {
      return HttpResponse.json({ success: true, data: [mockEquipment] });
    }
    return HttpResponse.json({ success: true, data: [] });
  }),

  http.get(`${API_BASE}/equipment/status/:status`, ({ params }) => {
    const status = params.status as string;
    if (status === mockEquipment.status) {
      return HttpResponse.json({ success: true, data: [mockEquipment] });
    }
    return HttpResponse.json({ success: true, data: [] });
  }),

  // Borrowing routes
  http.get(`${API_BASE}/borrowing`, () => {
    return HttpResponse.json({ success: true, data: [mockBorrowingRequest] });
  }),

  http.get(`${API_BASE}/borrowing/:id`, ({ params }) => {
    const id = Number(params.id);
    if (id === 1)
      return HttpResponse.json({ success: true, data: mockBorrowingRequest });
    return HttpResponse.json(
      { success: false, error: "Request not found" },
      { status: 404 },
    );
  }),

  http.post(`${API_BASE}/borrowing`, async ({ request }) => {
    const body = (await request.json()) as {
      equipment_id: number;
      start_date: string;
      end_date: string;
      reason: string;
    };
    if (body.equipment_id === 999) {
      return HttpResponse.json(
        { success: false, error: "Equipment is not available" },
        { status: 400 },
      );
    }
    return HttpResponse.json(
      {
        success: true,
        data: { ...mockBorrowingRequest, ...body, id: 2 },
        message: "Borrowing request created",
      },
      { status: 201 },
    );
  }),

  http.patch(
    `${API_BASE}/borrowing/:id/status`,
    async ({ params, request }) => {
      const id = Number(params.id);
      const body = (await request.json()) as { status: string };
      return HttpResponse.json({
        success: true,
        data: { ...mockBorrowingRequest, id, status: body.status },
        message: "Status updated",
      });
    },
  ),

  http.get(`${API_BASE}/borrowing/user/:userId`, ({ params }) => {
    const userId = Number(params.userId);
    if (userId === 1)
      return HttpResponse.json({ success: true, data: [mockBorrowingRequest] });
    return HttpResponse.json({ success: true, data: [] });
  }),

  http.get(`${API_BASE}/borrowing/status/:status`, ({ params }) => {
    const status = params.status as string;
    if (status === mockBorrowingRequest.status) {
      return HttpResponse.json({ success: true, data: [mockBorrowingRequest] });
    }
    return HttpResponse.json({ success: true, data: [] });
  }),

  // Returns routes
  http.get(`${API_BASE}/returns`, () => {
    return HttpResponse.json({ success: true, data: [mockReturnRequest] });
  }),

  http.get(`${API_BASE}/returns/:id`, ({ params }) => {
    const id = Number(params.id);
    if (id === 1)
      return HttpResponse.json({ success: true, data: mockReturnRequest });
    return HttpResponse.json(
      { success: false, error: "Return request not found" },
      { status: 404 },
    );
  }),

  http.post(`${API_BASE}/returns`, async ({ request }) => {
    const body = (await request.json()) as {
      borrowing_request_id: number;
      condition: string;
      notes?: string;
    };
    if (body.borrowing_request_id === 999) {
      return HttpResponse.json(
        { success: false, error: "Borrowing request not found" },
        { status: 404 },
      );
    }
    return HttpResponse.json(
      {
        success: true,
        data: { ...mockReturnRequest, ...body, id: 2 },
        message: "Return request created",
      },
      { status: 201 },
    );
  }),
];
