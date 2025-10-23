// Productos
export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  reserved?: number;
  available?: number;

  // 🔎 Campos opcionales para el buscador
  category?: string | null;
  barcode?: string | null;

  // 👇 NUEVO
  minStock?: number | null;
}

// Clientes
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  balance: number;

  phone2?: string;
  address?: string;
  postalCode?: string;
  notes?: string;
  createdAt?: string | Date;

  businessName?: string;
  cuit?: string;
  vatStatus?: 'RI' | 'MONO' | 'EXENTO' | 'CF';
  iibb?: string;
  fiscalAddress?: string;
  afipCode?: string;
  taxNotes?: string;
}

// Historial de movimientos
export interface CustomerMovement {
  id: string;
  amount: number | string;
  type: "payment" | "debt" | "adjust";
  reason?: string | null;
  createdAt: string | Date;
}

// Items / Pedidos
export interface OrderItemDTO {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  discount?: number;
  returnedQty?: number;
}

export interface OrderDTO {
  id: string;
  code: string | null;
  status: "pending" | "confirmed" | "canceled" | "partially_returned" | "returned";
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
