export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  reserved?: number;
  available?: number;
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
  lineTotal?: number;
}

export interface OrderDTO {
  id: string;
  code?: string | null;
  status: OrderStatus;
  total: number;
  notes?: string | null;
  items?: OrderItemDTO[];
  customer?: Customer | string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateOrderDTO {
  customerId?: string;
  items: OrderItemDTO[];
  notes?: string;
}

// Caja (si lo usás)
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
