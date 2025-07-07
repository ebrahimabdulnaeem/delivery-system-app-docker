import { Order, OrderStatus, PaginatedResults } from "@/types";
import { generateId } from "./utils";

// Mock orders data
let orders: Order[] = [];

// Generate a random order
function generateMockOrder(userId: string): Order {
  const cities = ["القاهرة", "الإسكندرية", "الجيزة", "المنصورة", "طنطا", "الإسماعيلية"];
  const statuses = Object.values(OrderStatus);
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  return {
    id: generateId("ord_"),
    barcode: generateId("BC"),
    order_date: new Date(),
    recipient_name: `عميل ${Math.floor(Math.random() * 1000)}`,
    recipient_phone1: `01${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 100000000)}`,
    recipient_address: `شارع ${Math.floor(Math.random() * 100)} - ${cities[Math.floor(Math.random() * cities.length)]}`,
    recipient_city: cities[Math.floor(Math.random() * cities.length)],
    cod_amount: Math.floor(Math.random() * 2000) + 100,
    order_description: `طلب ${Math.floor(Math.random() * 1000)}`,
    status: status,
    driver_id: status !== OrderStatus.ENTERED ? generateId("drv_") : undefined,
    created_by: userId,
    created_at: new Date(),
    updated_at: new Date()
  };
}

// Add sample orders for development
export function addSampleOrders(userId: string): void {
  if (orders.length === 0) {
    for (let i = 0; i < 50; i++) {
      orders.push(generateMockOrder(userId));
    }
  }
}

// Get order by ID
export function getOrderById(id: string): Order | null {
  return orders.find(order => order.id === id) || null;
}

// Create a new order
export function createOrder(orderData: Omit<Order, "id" | "created_at" | "updated_at" | "barcode">): Order {
  const newOrder: Order = {
    ...orderData,
    id: generateId("ord_"),
    barcode: generateId("BC"),
    created_at: new Date(),
    updated_at: new Date()
  };
  
  orders.unshift(newOrder);
  return newOrder;
}

// Update an existing order
export function updateOrder(id: string, orderData: Partial<Order>): Order | null {
  const index = orders.findIndex(order => order.id === id);
  
  if (index === -1) return null;
  
  const updatedOrder = {
    ...orders[index],
    ...orderData,
    updated_at: new Date()
  };
  
  orders[index] = updatedOrder;
  return updatedOrder;
}

// Get orders with pagination and optional filtering
export function getOrders(
  page: number = 1, 
  pageSize: number = 10,
  filters?: {
    status?: OrderStatus;
    city?: string;
    driver_id?: string;
    search?: string;
  }
): PaginatedResults<Order> {
  let filteredOrders = [...orders];
  
  // Apply filters if provided
  if (filters) {
    if (filters.status) {
      filteredOrders = filteredOrders.filter(order => order.status === filters.status);
    }
    
    if (filters.city) {
      filteredOrders = filteredOrders.filter(order => order.recipient_city === filters.city);
    }
    
    if (filters.driver_id) {
      filteredOrders = filteredOrders.filter(order => order.driver_id === filters.driver_id);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredOrders = filteredOrders.filter(order => 
        order.recipient_name.toLowerCase().includes(searchLower) ||
        order.recipient_phone1.includes(filters.search!) ||
        order.barcode.toLowerCase().includes(searchLower) ||
        order.recipient_address.toLowerCase().includes(searchLower)
      );
    }
  }
  
  // Sort by most recent first
  filteredOrders.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  
  // Calculate pagination
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const normalizedPage = Math.max(1, Math.min(page, totalPages || 1));
  const startIndex = (normalizedPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  return {
    data: filteredOrders.slice(startIndex, endIndex),
    pagination: {
      currentPage: normalizedPage,
      totalPages,
      pageSize,
      totalItems
    }
  };
} 