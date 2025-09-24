// src/types/domain.ts
export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  balance: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'canceled';

export interface OrderItemDTO {
  productId: string;
  productName?: string;
  unitPrice: number;
  quantity: number;
  discount?: number;
}

export interface CreateOrderDTO {
  customerId: string;
  items: OrderItemDTO[];
  notes?: string;
}

export interface OrderDTO {
  id: string;
  code?: string;            // 👈 NUEVO: PED001, PED002, ...
  status: OrderStatus;
  subtotal?: number;
  discount?: number;
  total: number;
  notes?: string;
  items: OrderItemDTO[];
  customer?: Customer | string;
  createdAt?: string | Date;
}

export interface CashMovement {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  createdAt: string | Date;
}

export interface CashReport {
  date: string;
  openingAmount: number;
  closingAmount: number;
  totalIncome: number;
  totalExpense: number;
  totalSales: number;
  balance: number;
  movements: CashMovement[];
}
