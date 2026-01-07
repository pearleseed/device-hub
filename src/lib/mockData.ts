// Mock Data for Device Management System

export type DeviceStatus = 'available' | 'borrowed' | 'maintenance';
export type DeviceCategory = 'laptop' | 'mobile' | 'tablet' | 'monitor' | 'accessories';
export type UserRole = 'admin' | 'user';
export type RequestStatus = 'pending' | 'approved' | 'active' | 'returned' | 'rejected';

export interface Device {
  id: string;
  name: string;
  category: DeviceCategory;
  brand: string;
  model: string;
  assetTag: string;
  status: DeviceStatus;
  assignedTo: string | null;
  specs: {
    os?: string;
    processor?: string;
    ram?: string;
    storage?: string;
    display?: string;
    battery?: string;
  };
  image: string;
  addedDate: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  role: UserRole;
  avatar: string;
}

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

export const devices: Device[] = [
  {
    id: '1',
    name: 'MacBook Pro 16"',
    category: 'laptop',
    brand: 'Apple',
    model: 'MacBook Pro 16-inch (2023)',
    assetTag: 'LAP-001',
    status: 'available',
    assignedTo: null,
    specs: {
      os: 'macOS Sonoma',
      processor: 'Apple M3 Pro',
      ram: '18GB',
      storage: '512GB SSD',
      display: '16.2" Liquid Retina XDR',
      battery: '22 hours',
    },
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop',
    addedDate: '2024-01-15',
  },
  {
    id: '2',
    name: 'ThinkPad X1 Carbon',
    category: 'laptop',
    brand: 'Lenovo',
    model: 'ThinkPad X1 Carbon Gen 11',
    assetTag: 'LAP-002',
    status: 'borrowed',
    assignedTo: '2',
    specs: {
      os: 'Windows 11 Pro',
      processor: 'Intel Core i7-1365U',
      ram: '16GB',
      storage: '512GB SSD',
      display: '14" 2.8K OLED',
      battery: '15 hours',
    },
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&h=300&fit=crop',
    addedDate: '2024-02-10',
  },
  {
    id: '3',
    name: 'iPhone 15 Pro',
    category: 'mobile',
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    assetTag: 'MOB-001',
    status: 'available',
    assignedTo: null,
    specs: {
      os: 'iOS 17',
      processor: 'A17 Pro',
      ram: '8GB',
      storage: '256GB',
      display: '6.1" Super Retina XDR',
      battery: 'Up to 23 hours',
    },
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop',
    addedDate: '2024-01-20',
  },
  {
    id: '4',
    name: 'Samsung Galaxy S24 Ultra',
    category: 'mobile',
    brand: 'Samsung',
    model: 'Galaxy S24 Ultra',
    assetTag: 'MOB-002',
    status: 'maintenance',
    assignedTo: null,
    specs: {
      os: 'Android 14',
      processor: 'Snapdragon 8 Gen 3',
      ram: '12GB',
      storage: '256GB',
      display: '6.8" Dynamic AMOLED 2X',
      battery: '5000mAh',
    },
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=300&fit=crop',
    addedDate: '2024-02-05',
  },
  {
    id: '5',
    name: 'iPad Pro 12.9"',
    category: 'tablet',
    brand: 'Apple',
    model: 'iPad Pro 12.9-inch (M2)',
    assetTag: 'TAB-001',
    status: 'available',
    assignedTo: null,
    specs: {
      os: 'iPadOS 17',
      processor: 'Apple M2',
      ram: '8GB',
      storage: '256GB',
      display: '12.9" Liquid Retina XDR',
      battery: '10 hours',
    },
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop',
    addedDate: '2024-01-25',
  },
  {
    id: '6',
    name: 'Dell UltraSharp 27"',
    category: 'monitor',
    brand: 'Dell',
    model: 'UltraSharp U2723QE',
    assetTag: 'MON-001',
    status: 'borrowed',
    assignedTo: '3',
    specs: {
      display: '27" 4K UHD IPS',
      processor: 'N/A',
    },
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop',
    addedDate: '2024-02-01',
  },
  {
    id: '7',
    name: 'Dell XPS 15',
    category: 'laptop',
    brand: 'Dell',
    model: 'XPS 15 9530',
    assetTag: 'LAP-003',
    status: 'available',
    assignedTo: null,
    specs: {
      os: 'Windows 11 Pro',
      processor: 'Intel Core i7-13700H',
      ram: '32GB',
      storage: '1TB SSD',
      display: '15.6" 3.5K OLED',
      battery: '13 hours',
    },
    image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=300&fit=crop',
    addedDate: '2024-02-15',
  },
  {
    id: '8',
    name: 'Google Pixel 8 Pro',
    category: 'mobile',
    brand: 'Google',
    model: 'Pixel 8 Pro',
    assetTag: 'MOB-003',
    status: 'available',
    assignedTo: null,
    specs: {
      os: 'Android 14',
      processor: 'Google Tensor G3',
      ram: '12GB',
      storage: '128GB',
      display: '6.7" LTPO OLED',
      battery: '5050mAh',
    },
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=300&fit=crop',
    addedDate: '2024-02-20',
  },
  {
    id: '9',
    name: 'MacBook Air M2',
    category: 'laptop',
    brand: 'Apple',
    model: 'MacBook Air 13-inch (M2)',
    assetTag: 'LAP-004',
    status: 'available',
    assignedTo: null,
    specs: {
      os: 'macOS Sonoma',
      processor: 'Apple M2',
      ram: '8GB',
      storage: '256GB SSD',
      display: '13.6" Liquid Retina',
      battery: '18 hours',
    },
    image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400&h=300&fit=crop',
    addedDate: '2024-01-10',
  },
  {
    id: '10',
    name: 'LG UltraWide 34"',
    category: 'monitor',
    brand: 'LG',
    model: '34WN80C-B',
    assetTag: 'MON-002',
    status: 'available',
    assignedTo: null,
    specs: {
      display: '34" WQHD IPS Curved',
      processor: 'N/A',
    },
    image: 'https://images.unsplash.com/photo-1586210579191-33b45e38fa2c?w=400&h=300&fit=crop',
    addedDate: '2024-02-08',
  },
  {
    id: '11',
    name: 'Magic Keyboard',
    category: 'accessories',
    brand: 'Apple',
    model: 'Magic Keyboard with Touch ID',
    assetTag: 'ACC-001',
    status: 'available',
    assignedTo: null,
    specs: {},
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop',
    addedDate: '2024-01-05',
  },
  {
    id: '12',
    name: 'AirPods Pro',
    category: 'accessories',
    brand: 'Apple',
    model: 'AirPods Pro (2nd Gen)',
    assetTag: 'ACC-002',
    status: 'borrowed',
    assignedTo: '4',
    specs: {},
    image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=300&fit=crop',
    addedDate: '2024-01-12',
  },
];

export const users: User[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex.johnson@admin.company.com',
    department: 'IT',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  },
  {
    id: '2',
    name: 'Sarah Chen',
    email: 'sarah.chen@company.com',
    department: 'Engineering',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
  },
  {
    id: '3',
    name: 'Michael Park',
    email: 'michael.park@company.com',
    department: 'Design',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily.davis@company.com',
    department: 'Marketing',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
  },
  {
    id: '5',
    name: 'James Wilson',
    email: 'james.wilson@admin.company.com',
    department: 'IT',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
  },
];

export const bookingRequests: BookingRequest[] = [
  {
    id: '1',
    deviceId: '1',
    userId: '2',
    startDate: '2024-03-01',
    endDate: '2024-03-15',
    reason: 'Development project requiring macOS environment',
    status: 'pending',
    createdAt: '2024-02-25',
  },
  {
    id: '2',
    deviceId: '2',
    userId: '2',
    startDate: '2024-02-10',
    endDate: '2024-03-10',
    reason: 'Remote work setup',
    status: 'active',
    createdAt: '2024-02-08',
  },
  {
    id: '3',
    deviceId: '5',
    userId: '3',
    startDate: '2024-03-05',
    endDate: '2024-03-20',
    reason: 'Design review and prototyping',
    status: 'pending',
    createdAt: '2024-02-26',
  },
  {
    id: '4',
    deviceId: '6',
    userId: '3',
    startDate: '2024-02-01',
    endDate: '2024-04-01',
    reason: 'Extended monitor for design work',
    status: 'active',
    createdAt: '2024-01-28',
  },
  {
    id: '5',
    deviceId: '3',
    userId: '4',
    startDate: '2024-03-10',
    endDate: '2024-03-17',
    reason: 'Mobile app testing',
    status: 'pending',
    createdAt: '2024-02-27',
  },
  {
    id: '6',
    deviceId: '12',
    userId: '4',
    startDate: '2024-01-15',
    endDate: '2024-02-15',
    reason: 'Client calls and meetings',
    status: 'active',
    createdAt: '2024-01-12',
  },
  {
    id: '7',
    deviceId: '7',
    userId: '2',
    startDate: '2024-01-20',
    endDate: '2024-02-05',
    reason: 'Testing Windows environment',
    status: 'returned',
    createdAt: '2024-01-18',
  },
];

// Helper functions
export const getDeviceById = (id: string): Device | undefined => 
  devices.find(d => d.id === id);

export const getUserById = (id: string): User | undefined => 
  users.find(u => u.id === id);

export const getDevicesByStatus = (status: DeviceStatus): Device[] => 
  devices.filter(d => d.status === status);

export const getDevicesByCategory = (category: DeviceCategory): Device[] => 
  devices.filter(d => d.category === category);

export const getRequestsByStatus = (status: RequestStatus): BookingRequest[] => 
  bookingRequests.filter(r => r.status === status);

export const getRequestsByUser = (userId: string): BookingRequest[] => 
  bookingRequests.filter(r => r.userId === userId);

export const getCategoryIcon = (category: DeviceCategory): string => {
  const icons: Record<DeviceCategory, string> = {
    laptop: '💻',
    mobile: '📱',
    tablet: '📲',
    monitor: '🖥️',
    accessories: '🎧',
  };
  return icons[category];
};

export const getStatusColor = (status: DeviceStatus): string => {
  const colors: Record<DeviceStatus, string> = {
    available: 'bg-status-available text-status-available-foreground',
    borrowed: 'bg-status-borrowed text-status-borrowed-foreground',
    maintenance: 'bg-status-maintenance text-status-maintenance-foreground',
  };
  return colors[status];
};
