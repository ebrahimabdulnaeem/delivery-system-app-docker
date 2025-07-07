// User role types
export enum UserRole {
  ADMIN = "admin",
  DATA_ENTRY = "data_entry",
  ACCOUNTS = "accounts"
}

// Order status types
export enum OrderStatus {
  ENTERED = "entered",
  ASSIGNED = "assigned",
  OUT_FOR_DELIVERY = "out_for_delivery",
  DELIVERED = "delivered",
  PARTIAL_RETURN = "partial_return",
  FULL_RETURN = "full_return"
}

// User model
export interface User {
  id: string;
  username: string;
  email: string;
  password: string; // Will be hashed in actual implementation
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// Order model
export interface Order {
  id: string;
  barcode: string;
  order_date: Date;
  recipient_name: string;
  recipient_phone1: string;
  recipient_phone2?: string;
  recipient_address: string;
  recipient_city: string;
  cod_amount: number;
  order_description?: string;
  special_instructions?: string;
  sender_reference?: string;
  number_of_pieces?: number;
  status: OrderStatus;
  driver_id?: string;
  created_by: string; // User ID who created the order
  created_at: Date;
  updated_at: Date;
}

// Driver model
export interface Driver {
  id: string;
  driver_name: string;
  driver_id_number?: string;
  driver_phone: string;
  assigned_areas?: string[];
  created_at: Date;
  updated_at: Date;
}

// City model
export interface City {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

// Pagination model
export interface Pagination {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}

// Paginated results
export interface PaginatedResults<T> {
  data: T[];
  pagination: Pagination;
} 