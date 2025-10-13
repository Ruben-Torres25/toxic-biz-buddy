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

export const CashAPI = {
  current: async (): Promise<CashCurrent> => api.get("/cash/current"),
  movements: async (): Promise<CashMovement[]> => api.get("/cash/movements"),
  history: async (days = 14): Promise<CashMovement[]> =>
    api.get("/cash/history", { days }),

  open: async (amount: number) => api.post("/cash/open", { amount }),
  close: async (amount: number) => api.post("/cash/close", { amount }),

  movement: async (p: { amount: number; type: Exclude<MovementKind, "open" | "close">; description: string }) =>
    api.post("/cash/movement", p),

  // Compatibilidad
  status: async (): Promise<{ isOpen: boolean }> => api.get("/cash/status"),
};
