// API Client for Device Hub Backend

import type {
  User,
  Equipment,
  Department,
  BorrowingRequest,
  ReturnRequest,
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  SignupData,
  CreateBorrowingRequest,
  CreateReturnRequest,
  CreateEquipmentData,
  UpdateEquipmentData,
  DeviceCategory,
  DeviceStatus,
  RequestStatus,
  Device,
  BookingRequest,
  equipmentToDevice,
  borrowingToBookingRequest,
} from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Token management
let authToken: string | null = localStorage.getItem("auth-token");

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (token) {
    localStorage.setItem("auth-token", token);
  } else {
    localStorage.removeItem("auth-token");
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

// Fetch wrapper with auth
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (authToken) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

// ============ Auth API ============

export const authAPI = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success && data.token && data.user) {
        setAuthToken(data.token);
        return {
          success: true,
          token: data.token,
          user: data.user,
        };
      }

      return { success: false, error: data.error || "Login failed" };
    } catch (error) {
      console.error("Login API Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  },

  async signup(data: SignupData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success && result.token && result.user) {
        setAuthToken(result.token);
        return {
          success: true,
          token: result.token,
          user: result.user,
        };
      }

      return { success: false, error: result.error || "Signup failed" };
    } catch (error) {
      console.error("Signup API Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  },

  async me(): Promise<ApiResponse<User>> {
    return fetchAPI<User>("/auth/me");
  },

  logout(): void {
    setAuthToken(null);
  },
};

// ============ Users API ============

export const usersAPI = {
  async getAll(): Promise<ApiResponse<User[]>> {
    return fetchAPI<User[]>("/users");
  },

  async getById(id: number): Promise<ApiResponse<User>> {
    return fetchAPI<User>(`/users/${id}`);
  },

  async update(id: number, data: Partial<User>): Promise<ApiResponse<User>> {
    return fetchAPI<User>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    return fetchAPI<void>(`/users/${id}`, {
      method: "DELETE",
    });
  },
};

// ============ Departments API ============

export const departmentsAPI = {
  async getAll(): Promise<ApiResponse<Department[]>> {
    return fetchAPI<Department[]>("/departments");
  },

  async getById(id: number): Promise<ApiResponse<Department>> {
    return fetchAPI<Department>(`/departments/${id}`);
  },

  async create(data: {
    name: string;
    code: string;
  }): Promise<ApiResponse<Department>> {
    return fetchAPI<Department>("/departments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(
    id: number,
    data: Partial<Department>,
  ): Promise<ApiResponse<Department>> {
    return fetchAPI<Department>(`/departments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    return fetchAPI<void>(`/departments/${id}`, {
      method: "DELETE",
    });
  },
};

// ============ Equipment API ============

export const equipmentAPI = {
  async getAll(params?: {
    category?: DeviceCategory;
    status?: DeviceStatus;
    department_id?: number;
    search?: string;
  }): Promise<ApiResponse<Equipment[]>> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set("category", params.category);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.department_id)
      searchParams.set("department_id", String(params.department_id));
    if (params?.search) searchParams.set("search", params.search);

    const queryString = searchParams.toString();
    return fetchAPI<Equipment[]>(
      `/equipment${queryString ? `?${queryString}` : ""}`,
    );
  },

  async getById(id: number): Promise<ApiResponse<Equipment>> {
    return fetchAPI<Equipment>(`/equipment/${id}`);
  },

  async create(data: CreateEquipmentData): Promise<ApiResponse<Equipment>> {
    return fetchAPI<Equipment>("/equipment", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async update(
    id: number,
    data: UpdateEquipmentData,
  ): Promise<ApiResponse<Equipment>> {
    return fetchAPI<Equipment>(`/equipment/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<ApiResponse<void>> {
    return fetchAPI<void>(`/equipment/${id}`, {
      method: "DELETE",
    });
  },

  async getByCategory(
    category: DeviceCategory,
  ): Promise<ApiResponse<Equipment[]>> {
    return fetchAPI<Equipment[]>(`/equipment/category/${category}`);
  },

  async getByStatus(status: DeviceStatus): Promise<ApiResponse<Equipment[]>> {
    return fetchAPI<Equipment[]>(`/equipment/status/${status}`);
  },
};

// ============ Borrowing API ============

export const borrowingAPI = {
  async getAll(params?: {
    status?: RequestStatus;
    equipment_id?: number;
  }): Promise<ApiResponse<BorrowingRequest[]>> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.equipment_id)
      searchParams.set("equipment_id", String(params.equipment_id));

    const queryString = searchParams.toString();
    return fetchAPI<BorrowingRequest[]>(
      `/borrowing${queryString ? `?${queryString}` : ""}`,
    );
  },

  async getById(id: number): Promise<ApiResponse<BorrowingRequest>> {
    return fetchAPI<BorrowingRequest>(`/borrowing/${id}`);
  },

  async create(
    data: CreateBorrowingRequest,
  ): Promise<ApiResponse<BorrowingRequest>> {
    return fetchAPI<BorrowingRequest>("/borrowing", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateStatus(
    id: number,
    status: RequestStatus,
  ): Promise<ApiResponse<BorrowingRequest>> {
    return fetchAPI<BorrowingRequest>(`/borrowing/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async getByUser(userId: number): Promise<ApiResponse<BorrowingRequest[]>> {
    return fetchAPI<BorrowingRequest[]>(`/borrowing/user/${userId}`);
  },

  async getByStatus(
    status: RequestStatus,
  ): Promise<ApiResponse<BorrowingRequest[]>> {
    return fetchAPI<BorrowingRequest[]>(`/borrowing/status/${status}`);
  },
};

// ============ Returns API ============

export const returnsAPI = {
  async getAll(params?: {
    condition?: string;
  }): Promise<ApiResponse<ReturnRequest[]>> {
    const searchParams = new URLSearchParams();
    if (params?.condition) searchParams.set("condition", params.condition);

    const queryString = searchParams.toString();
    return fetchAPI<ReturnRequest[]>(
      `/returns${queryString ? `?${queryString}` : ""}`,
    );
  },

  async getById(id: number): Promise<ApiResponse<ReturnRequest>> {
    return fetchAPI<ReturnRequest>(`/returns/${id}`);
  },

  async create(data: CreateReturnRequest): Promise<ApiResponse<ReturnRequest>> {
    return fetchAPI<ReturnRequest>("/returns", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// ============ Backward Compatibility Helpers ============
// These functions provide similar interfaces to the old mockData helpers

export async function getDevices(): Promise<Device[]> {
  const response = await equipmentAPI.getAll();
  if (response.success && response.data) {
    return response.data.map((eq) => ({
      ...eq,
      image: eq.image_url,
      assetTag: eq.asset_tag,
      assignedTo: eq.assigned_to_id || null,
      addedDate: eq.created_at,
    }));
  }
  return [];
}

export async function getDeviceById(
  id: number | string,
): Promise<Device | null> {
  const numId = typeof id === "string" ? parseInt(id) : id;
  const response = await equipmentAPI.getById(numId);
  if (response.success && response.data) {
    const eq = response.data;
    return {
      ...eq,
      image: eq.image_url,
      assetTag: eq.asset_tag,
      assignedTo: eq.assigned_to_id || null,
      addedDate: eq.created_at,
    };
  }
  return null;
}

export async function getDevicesByStatus(
  status: DeviceStatus,
): Promise<Device[]> {
  const response = await equipmentAPI.getByStatus(status);
  if (response.success && response.data) {
    return response.data.map((eq) => ({
      ...eq,
      image: eq.image_url,
      assetTag: eq.asset_tag,
      assignedTo: eq.assigned_to_id || null,
      addedDate: eq.created_at,
    }));
  }
  return [];
}

export async function getDevicesByCategory(
  category: DeviceCategory,
): Promise<Device[]> {
  const response = await equipmentAPI.getByCategory(category);
  if (response.success && response.data) {
    return response.data.map((eq) => ({
      ...eq,
      image: eq.image_url,
      assetTag: eq.asset_tag,
      assignedTo: eq.assigned_to_id || null,
      addedDate: eq.created_at,
    }));
  }
  return [];
}

export async function getUsers(): Promise<User[]> {
  const response = await usersAPI.getAll();
  return response.success && response.data ? response.data : [];
}

export async function getUserById(id: number | string): Promise<User | null> {
  const numId = typeof id === "string" ? parseInt(id) : id;
  const response = await usersAPI.getById(numId);
  return response.success && response.data ? response.data : null;
}

export async function getBookingRequests(): Promise<BookingRequest[]> {
  const response = await borrowingAPI.getAll();
  if (response.success && response.data) {
    return response.data.map((req) => ({
      id: String(req.id),
      deviceId: String(req.equipment_id),
      userId: String(req.user_id),
      startDate: req.start_date,
      endDate: req.end_date,
      reason: req.reason,
      status: req.status,
      createdAt: req.created_at,
    }));
  }
  return [];
}

export async function getRequestsByStatus(
  status: RequestStatus,
): Promise<BookingRequest[]> {
  const response = await borrowingAPI.getByStatus(status);
  if (response.success && response.data) {
    return response.data.map((req) => ({
      id: String(req.id),
      deviceId: String(req.equipment_id),
      userId: String(req.user_id),
      startDate: req.start_date,
      endDate: req.end_date,
      reason: req.reason,
      status: req.status,
      createdAt: req.created_at,
    }));
  }
  return [];
}

export async function getRequestsByUser(
  userId: number | string,
): Promise<BookingRequest[]> {
  const numId = typeof userId === "string" ? parseInt(userId) : userId;
  const response = await borrowingAPI.getByUser(numId);
  if (response.success && response.data) {
    return response.data.map((req) => ({
      id: String(req.id),
      deviceId: String(req.equipment_id),
      userId: String(req.user_id),
      startDate: req.start_date,
      endDate: req.end_date,
      reason: req.reason,
      status: req.status,
      createdAt: req.created_at,
    }));
  }
  return [];
}

// Export default API object
export const api = {
  auth: authAPI,
  users: usersAPI,
  departments: departmentsAPI,
  equipment: equipmentAPI,
  borrowing: borrowingAPI,
  returns: returnsAPI,
};

export default api;
