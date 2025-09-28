import { api } from "@/lib/api";

export type CashCurrent = {
  date: string;
  openingAmount: number;
  closingAmount: number;
  totalIncome: number;
  totalExpense: number;
  totalSales: number;
  balance: number;
  movements: any[];
  isOpen: boolean;
};

export const CashAPI = {
  current: async (): Promise<CashCurrent> => api.get("/cash/current"),
  movements: async () => api.get("/cash/movements"),
  open: async (amount: number) => api.post("/cash/open", { amount }),
  close: async (amount: number) => api.post("/cash/close", { amount }),
  movement: async (p: { amount: number; type: "income" | "expense" | "sale"; description: string }) =>
    api.post("/cash/movement", p),
  // Dejado por compatibilidad; NO usar ensureOpen en ningún lado.
  status: async (): Promise<{ isOpen: boolean }> => api.get("/cash/status"),
};
