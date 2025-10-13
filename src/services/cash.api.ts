// src/services/cash.api.ts
import { api } from "@/lib/api";

export type MovementKind = "open" | "close" | "income" | "expense" | "sale";

export type CashMovement = {
  id: string;
  createdAt: string;
  occurredAt?: string | null;
  amount: number;
  type: MovementKind;
  description: string;
};

export type CashCurrent = {
  date: string;
  openingAmount: number;
  closingAmount: number;
  totalIncome: number;
  totalExpense: number;
  totalSales: number;
  balance: number;
  movements: CashMovement[];
  isOpen: boolean;
};

/** ===== NUEVO: tipos del diario por día ===== */
export type CashDailyEntry = {
  id: string;
  type: MovementKind;                 // 'open' | 'close' | 'sale' | 'income' | 'expense'
  createdAt: string;
  occurredAt?: string | null;
  description?: string | null;

  /** Venta asociada (si type === 'sale') */
  saleId?: string | null;

  /** Cliente (si aplica) */
  customerId?: string | null;
  customerName?: string | null;

  /** Totales */
  total: number;                      // total de la venta o del movimiento
  paymentsBreakdown?: {
    cash?: number;
    debit?: number;
    credit?: number;
    transfer?: number;
  };

  itemsCount?: number;                // cantidad de ítems de la venta (si aplica)
};

export type CashDailyDay = {
  date: string;                       // YYYY-MM-DD
  openingAmount: number;
  closingAmount: number;
  totals: {
    sales: number;
    cashIncomes: number;
    cashExpenses: number;
    cashDelta: number;               // opening + incomes - expenses + sales
  };
  entries: CashDailyEntry[];
};

export const CashAPI = {
  current: async (): Promise<CashCurrent> => api.get("/cash/current"),
  movements: async (): Promise<CashMovement[]> => api.get("/cash/movements"),
  history: async (days = 14): Promise<CashMovement[]> =>
    api.get("/cash/history", { days }),

  /** ===== NUEVO: agrupado por día ===== */
  daily: async (days = 14): Promise<CashDailyDay[]> =>
    api.get("/cash/daily", { days }),

  open: async (amount: number) => api.post("/cash/open", { amount }),
  close: async (amount: number) => api.post("/cash/close", { amount }),

  movement: async (p: { amount: number; type: Exclude<MovementKind, "open" | "close">; description: string }) =>
    api.post("/cash/movement", p),

  // Compatibilidad
  status: async (): Promise<{ isOpen: boolean }> => api.get("/cash/status"),

  /** ===== NUEVO: confirmar venta desde caja ===== */
  checkout: async (payload: {
    items: Array<{ productId: string; qty: number; price?: number; discount?: number }>;
    payments: Array<{ method: "cash" | "debit" | "credit" | "transfer"; amount: number }>;
    discountGlobal?: number;
    notes?: string;
    customerId?: string;
  }) => api.post("/sales/checkout", payload),
};
