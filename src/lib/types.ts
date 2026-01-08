// Shared TypeScript types for the frontend

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
  created_at: string;
  user_count?: number;
  equipment_count?: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  department_id: number;
  department_name?: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface DeviceSpecs {
  os?: string;
  processor?: string;
  ram?: string;
  storage?: string;
  display?: string;
  battery?: string;
  resolution?: string;
  refresh_rate?: string;
  ports?: string;
  connectivity?: string;
  features?: string;
}

export interface Equipment {
  id: number;
  name: string;
  asset_tag: string;
  category: DeviceCategory;
  brand: string;
  model: string;
  status: DeviceStatus;
  department_id: number;
  department_name?: string;
  purchase_price: number;
  purchase_date: string;
  specs: DeviceSpecs;
  specs_json?: string;
  image_url: string;
  created_at: string;
  assigned_to_id?: number;
  assigned_to_name?: string;
}

// Alias for backward compatibility with existing code
export interface Device extends Equipment {
  // Additional computed fields for UI
  image: string; // Alias for image_url
  assetTag: string; // Alias for asset_tag
  assignedTo: number | null; // Alias for assigned_to_id
  addedDate: string; // Alias for created_at
}

export interface BorrowingRequest {
  id: number;
  equipment_id: number;
  user_id: number;
  approved_by: number | null;
  start_date: string;
  end_date: string;
  reason: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  // Joined fields
  equipment_name?: string;
  equipment_asset_tag?: string;
  equipment_image?: string;
  equipment_category?: DeviceCategory;
  user_name?: string;
  user_email?: string;
  approved_by_name?: string;
}

// Alias for backward compatibility
export interface BookingRequest {
  id: string;
  deviceId: string;
  userId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: RequestStatus;
  createdAt: string;
}

export interface ReturnRequest {
  id: number;
  borrowing_request_id: number;
  return_date: string;
  device_condition: DeviceCondition;
  notes: string | null;
  created_at: string;
  // Joined fields
  equipment_id?: number;
  equipment_name?: string;
  equipment_asset_tag?: string;
  user_id?: number;
  user_name?: string;
  start_date?: string;
  end_date?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

// Request types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  department_id: number;
}

export interface CreateBorrowingRequest {
  equipment_id: number;
  start_date: string;
  end_date: string;
  reason: string;
}

export interface CreateReturnRequest {
  borrowing_request_id: number;
  condition: DeviceCondition;
  notes?: string;
}

export interface CreateEquipmentData {
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

export interface UpdateEquipmentData extends Partial<CreateEquipmentData> {
  status?: DeviceStatus;
}

// Helper functions for type conversion
export function equipmentToDevice(equipment: Equipment): Device {
  return {
    ...equipment,
    image: equipment.image_url,
    assetTag: equipment.asset_tag,
    assignedTo: equipment.assigned_to_id || null,
    addedDate: equipment.created_at,
  };
}

export function borrowingToBookingRequest(
  request: BorrowingRequest,
): BookingRequest {
  return {
    id: String(request.id),
    deviceId: String(request.equipment_id),
    userId: String(request.user_id),
    startDate: request.start_date,
    endDate: request.end_date,
    reason: request.reason,
    status: request.status,
    createdAt: request.created_at,
  };
}

// Category icons
export const getCategoryIcon = (category: DeviceCategory): string => {
  const icons: Record<DeviceCategory, string> = {
    laptop: "💻",
    mobile: "📱",
    tablet: "📲",
    monitor: "🖥️",
    accessories: "🎧",
  };
  return icons[category];
};

// Status colors
export const getStatusColor = (status: DeviceStatus): string => {
  const colors: Record<DeviceStatus, string> = {
    available: "bg-status-available text-status-available-foreground",
    borrowed: "bg-status-borrowed text-status-borrowed-foreground",
    maintenance: "bg-status-maintenance text-status-maintenance-foreground",
  };
  return colors[status];
};
