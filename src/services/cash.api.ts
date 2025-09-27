// src/services/cash.api.ts
import { api } from "@/lib/api";

export const CashAPI = {
  current: async () => api.get("/cash/current"),
  open: async (amount: number) => api.post("/cash/open", { amount }),
  close: async (amount: number) => api.post("/cash/close", { amount }),
  movement: async (p: { amount: number; type: string; description: string }) =>
    api.post("/cash/movement", p),

  // Abre la caja si está cerrada; si ya está abierta, no falla.
  ensureOpen: async (amount = 0) => {
    try {
      await api.post("/cash/open", { amount });
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (!msg.includes("ya está abierta")) throw e;
    }
  },
};
