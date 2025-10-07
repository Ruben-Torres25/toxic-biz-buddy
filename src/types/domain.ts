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
}

// Clientes
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  balance: number;

  // extras opcionales que usa la UI
  phone2?: string;
  address?: string;
  postalCode?: string;
  notes?: string;
  createdAt?: string | Date;

  // ===== Datos fiscales (opcionales) =====
  businessName?: string;                    // Razón social
  cuit?: string;                            // CUIT/CUIL (con o sin guiones)
  vatStatus?: 'RI' | 'MONO' | 'EXENTO' | 'CF'; // Condición frente al IVA
  iibb?: string;                            // Ingresos Brutos
  fiscalAddress?: string;                   // Domicilio fiscal
  afipCode?: string;                        // Actividad / Código AFIP
  taxNotes?: string;                        // Observaciones fiscales
}

// Historial de movimientos
export interface CustomerMovement {
  id: string;
  amount: number | string; // backend puede enviarlo string decimal
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
  /** Cantidad devuelta acumulada (se actualiza con notas de crédito) */
  returnedQty?: number; // 👈 NUEVO
}

export interface OrderDTO {
  id: string;
  code: string | null;
  status: "pending" | "confirmed" | "canceled" | "partially_returned" | "returned"; // ⬅️ agregado
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
