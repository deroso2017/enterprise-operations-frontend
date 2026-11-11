export type OrderStatus =
  'DRAFT' | 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  warehouse: number | null;
  warehouse_name: string | null;
  quantity: number;
  unit_price: string;
  line_total: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer: number;
  customer_name: string;
  status: OrderStatus;
  order_date: string;
  required_date: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  total: string;
  notes: string;
  cancellation_reason: string;
  created_by: number;
  created_by_email: string;
  updated_by: number | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateOrderItem {
  product_id: number;
  quantity: number;
}

export interface CreateOrderRequest {
  customer_id: number;
  required_date: string | null;
  tax_rate: string;
  notes: string;
  items: CreateOrderItem[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface WarehouseOption {
  id: number;
  code: string;
  name: string;
  location: string;
  is_active: boolean;
}

export interface ProductOption {
  id: number;
  sku: string;
  name: string;
  unit_price: string;
  is_active: boolean;
}
