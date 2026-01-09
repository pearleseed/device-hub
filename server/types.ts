// Shared TypeScript types for the backend

export type UserRole = "admin" | "user";
export type DeviceStatus = "available" | "borrowed" | "maintenance";
export type DeviceCategory =
  | "laptop"
  | "mobile"
  | "tablet"
  | "monitor"
  | "accessories";
export type RequestStatus =
  | "pending"
  | "approved"
  | "active"
  | "returned"
  | "rejected";
export type DeviceCondition = "excellent" | "good" | "fair" | "damaged";

export interface Department {
  id: number;
  name: string;
  code: string;
  created_at: Date;
}

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  department_id: number;
  role: UserRole;
  avatar_url: string | null;
  created_at: Date;
}

export interface UserPublic {
  id: number;
  name: string;
  email: string;
  department_id: number;
  department_name?: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: Date;
}

export interface Device {
  id: number;
  name: string;
  asset_tag: string;
  category: DeviceCategory;
  brand: string;
  model: string;
  status: DeviceStatus;
  department_id: number;
  purchase_price: number;
  purchase_date: Date;
  specs_json: string;
  image_url: string;
  created_at: Date;
}

export interface DeviceWithDepartment extends Device {
  department_name?: string;
  assigned_to_name?: string;
  assigned_to_id?: number;
}

export interface BorrowRequest {
  id: number;
  device_id: number;
  user_id: number;
  approved_by: number | null;
  start_date: Date;
  end_date: Date;
  reason: string;
  status: RequestStatus;
  created_at: Date;
  updated_at: Date;
}

export interface BorrowRequestWithDetails extends BorrowRequest {
  device_name?: string;
  device_asset_tag?: string;
  device_image?: string;
  device_category?: DeviceCategory;
  user_name?: string;
  user_email?: string;
  approved_by_name?: string;
}

export interface ReturnRequest {
  id: number;
  borrow_request_id: number;
  return_date: Date;
  device_condition: DeviceCondition;
  notes: string | null;
  created_at: Date;
}

export interface ReturnRequestWithDetails extends ReturnRequest {
  device_id?: number;
  user_id?: number;
  device_name?: string;
  device_asset_tag?: string;
  user_name?: string;
}

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  department_id: number;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: UserPublic;
  error?: string;
}

export interface CreateBorrowRequest {
  device_id: number;
  start_date: string;
  end_date: string;
  reason: string;
}

export interface CreateReturnRequest {
  borrow_request_id: number;
  condition: DeviceCondition;
  notes?: string;
}

export interface CreateDeviceRequest {
  name: string;
  asset_tag: string;
  category: DeviceCategory;
  brand: string;
  model: string;
  department_id: number;
  purchase_price: number;
  purchase_date: string;
  specs_json: string;
  image_url: string;
}

export interface UpdateDeviceRequest extends Partial<CreateDeviceRequest> {
  status?: DeviceStatus;
}

// JWT Payload
export interface JWTPayload {
  userId: number;
  email: string;
  role: UserRole;
  exp: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
