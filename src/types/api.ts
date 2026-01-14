// Frontend API types - mirrors server/types.ts
// This file is the single source of truth for frontend type definitions

// ============================================================================
// Enum Types
// ============================================================================

export type UserRole = "superuser" | "admin" | "user";
export type DeviceStatus = "available" | "borrowed" | "maintenance";
export type DeviceCategory =
  | "laptop"
  | "mobile"
  | "tablet"
  | "monitor"
  | "accessories"
  | "storage"
  | "ram";
export type RequestStatus =
  | "pending"
  | "approved"
  | "active"
  | "returned"
  | "rejected";
export type DeviceCondition = "excellent" | "good" | "fair" | "damaged";
export type RenewalStatus = "pending" | "approved" | "rejected";

// Department name is now a string to allow dynamic creation
export type DepartmentName = string;

// ============================================================================
// Constants
// ============================================================================

export const DEPARTMENT_NAMES: DepartmentName[] = [
  "QA",
  "DEV",
  "CG",
  "ADMIN",
  "STG",
];

// ============================================================================
// Entity Interfaces
// ============================================================================

export interface Department {
  id: number;
  name: DepartmentName;
  code: string;
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
  avatar_thumbnail_url: string | null;
  is_active: boolean;
  must_change_password?: boolean;
  last_login_at: Date | null;
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
  selling_price: number | null;
  purchase_date: Date;
  warranty_date: Date | null;
  vendor: string | null;
  mac_address: string | null;
  ip_address: string | null;
  hostname: string | null;
  specs_json: string | Record<string, string>;
  image_url: string;
  image_thumbnail_url: string | null;
  created_at: Date;
}

export interface DeviceWithDepartment extends Device {
  department_name?: string;
  assigned_to_name?: string;
  assigned_to_id?: number;
  assigned_to_avatar?: string | null;
  assigned_to_department_name?: string;
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

export interface RenewalRequest {
  id: number;
  borrow_request_id: number;
  user_id: number;
  current_end_date: Date;
  requested_end_date: Date;
  reason: string;
  status: RenewalStatus;
  reviewed_by: number | null;
  reviewed_at: Date | null;
  created_at: Date;
}

export interface RenewalRequestWithDetails extends RenewalRequest {
  device_id?: number;
  borrow_start_date?: Date;
  device_name?: string;
  device_asset_tag?: string;
  device_image?: string;
  user_name?: string;
  user_email?: string;
  reviewed_by_name?: string;
}

// ============================================================================
// API Request Types
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  department_id: number;
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

export interface CreateRenewalRequest {
  borrow_request_id: number;
  requested_end_date: string;
  reason: string;
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
  specs_json: string | Record<string, string>;
  image_url: string;
}

export interface UpdateDeviceRequest extends Partial<CreateDeviceRequest> {
  status?: DeviceStatus;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: UserPublic;
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================================
// Notification Types
// ============================================================================

export type NotificationType =
  | "request_approved"
  | "request_rejected"
  | "new_request"
  | "overdue"
  | "device_returned"
  | "renewal_approved"
  | "renewal_rejected"
  | "info";

export interface InAppNotification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  related_request_id: number | null;
  related_device_id: number | null;
  created_at: Date;
}

export interface CreateNotificationRequest {
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  related_request_id?: number;
  related_device_id?: number;
}
