// src/services/cash.api.ts
import { api } from "@/lib/api";

/** Tipos de movimiento */
export type MovementKind = "open" | "close" | "income" | "expense" | "sale";

/** Entrada de detalle por día (open/close/sale/income/expense) */
export type CashDailyEntry = {
  id: string;
  type: MovementKind;
  description?: string | null;
  amount: number;
  createdAt: string;
  occurredAt?: string | null;

  // opcionales (si en el futuro conectás ventas reales)
  saleId?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  paymentsBreakdown?: {
    cash?: number;
    debit?: number;
    credit?: number;
    transfer?: number;
  };
  itemsCount?: number;
};

/** Día de caja */
export type CashDailyDay = {
  date: string;            // YYYY-MM-DD
  openingAmount: number;
  closingAmount: number;
  isOpen: boolean;
  income: number;          // suma de ingresos
  expense: number;         // suma de egresos (valor positivo)
  salesCash: number;       // ventas en efectivo
  details: CashDailyEntry[]; // movimientos del día (incluye open/close)
};

/** Estado “current” (opcional si lo usás) */
export type CashCurrent = {
  date: string;
  openingAmount: number;
  closingAmount: number;
  totalIncome: number;
  totalExpense: number;
  totalSales: number;
  balance: number;
  movements: Array<{
    id: string;
    createdAt: string;
    occurredAt?: string | null;
    amount: number;
    type: Exclude<MovementKind, "open" | "close">;
    description: string;
  }>;
  isOpen: boolean;
};

export const CashAPI = {
  // Estado del día (opcional si lo mostrás en otra parte)
  current: async (): Promise<CashCurrent> => api.get("/cash/current"),

  // Historial agrupado por día -> usa el backend que ya compone aperturas/cierres
  daily: async (days = 30): Promise<CashDailyDay[]> =>
    api.get("/cash/daily", { days }),

  // (legacy) Historial plano - ya NO lo usamos en HistorySection
  history: async (days = 14) => api.get("/cash/history", { days }),

  // Operaciones de caja -> IMPORTANTES: nombres correctos del payload
  open: async (amount: number) => api.post("/cash/open", { openingAmount: amount }),
  close: async (amount: number) => api.post("/cash/close", { closingAmount: amount }),

  movement: async (p: { amount: number; type: "income" | "expense" | "sale"; description: string }) =>
    api.post("/cash/movement", p),

  status: async (): Promise<{ isOpen: boolean }> => api.get("/cash/status"),

  // Checkout (opcional, si lo usás)
  checkout: async (payload: {
    items: Array<{ productId: string; qty: number; price?: number; discount?: number }>;
    payments: Array<{ method: "cash" | "debit" | "credit" | "transfer"; amount: number }>;
    discountGlobal?: number;
    notes?: string;
    customerId?: string;
  }) => api.post("/sales/checkout", payload),
};
