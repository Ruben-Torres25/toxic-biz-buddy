// src/types/domain.ts

// Productos
export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  reserved?: number;
  available?: number;
}

// Clientes
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  balance: number;
}

// Items / Pedidos
export interface OrderItemDTO {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  discount?: number; // monto absoluto
}

export interface OrderDTO {
  id: string;
  code: string | null;
  status: "pending" | "confirmed" | "canceled";
  total: number;
  notes?: string;
  customer?: Customer;
  items?: OrderItemDTO[];
  createdAt: string | Date;
}

export interface CreateOrderDTO {
  customerId?: string;
  items: OrderItemDTO[];
  notes?: string;
}

// Caja
export interface CashMovement {
  id: string;
  // cubrir nomenclaturas del backend: sale (venta), deposit/withdrawal (manuales)
  // mantener income/expense por compatibilidad si alguna ruta los mapea así
  type: "sale" | "deposit" | "withdrawal" | "income" | "expense";
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
