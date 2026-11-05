export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface Category {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  location: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  category: number;
  category_name: string;
  unit_price: string;
  reorder_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockLevel {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  warehouse: number;
  warehouse_name: string;
  quantity: number;
  reorder_level: number;
  is_low_stock: boolean;
}

export type MovementType = 'RECEIPT' | 'ISSUE' | 'ADJUSTMENT' | 'TRANSFER_IN' | 'TRANSFER_OUT';

export interface StockMovement {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  warehouse: number;
  warehouse_name: string;
  movement_type: MovementType;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  reference: string;
  notes: string;
  created_by: number;
  created_by_email: string;
  created_at: string;
}

export interface InventorySummary {
  total_products: number;
  total_warehouses: number;
  total_units: number;
  low_stock_items: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface StockAdjustmentRequest {
  product: number;
  warehouse: number;
  direction: 'IN' | 'OUT';
  quantity: number;
  reference: string;
  notes: string;
}

export interface StockTransferRequest {
  product: number;
  source_warehouse: number;
  destination_warehouse: number;
  quantity: number;
  reference: string;
  notes: string;
}

export interface StockTransferResponse {
  source_movement: StockMovement;
  destination_movement: StockMovement;
}
