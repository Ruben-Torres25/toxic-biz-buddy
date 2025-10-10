import { api } from "@/lib/api";

export type PaymentMethod = "cash" | "debit" | "credit" | "transfer";

// 👉 Forzamos la base de Caja a /cash (tu backend ya lo tiene)
const CASH_BASE = "/cash";

export class SalesAPI {
  /** Devuelve la sesión de caja actual, o null si no hay. */
  static async current(): Promise<any | null> {
    // tu backend puede responder 200 con null o 404; soportamos ambos
    try {
      const data = await api.get<any>(`${CASH_BASE}/current`);
      return data ?? null;
    } catch (e: any) {
      if (e?.status === 404) return null;
      throw e;
    }
  }

  /** Abrir caja */
  static open(amount: number) {
    return api.post(`${CASH_BASE}/open`, { amount });
  }

  /** Cerrar caja */
  static close(
    _payments: { method: PaymentMethod; amount: number }[] = [],
    counted?: number
  ) {
    // si tu controller espera { counted }, esto lo respeta
    return api.post(`${CASH_BASE}/close`, { counted: counted ?? 0 });
  }

  /** Crear venta (ya lo tenías) */
  static create(data: {
    items: { productId: string; qty: number; price: number; discount?: number }[];
    payments: { method: PaymentMethod; amount: number }[];
    notes?: string;
  }) {
    return api.post<{ id: string; number: string; total: number; createdAt: string }>(
      "/sales",
      data
    );
  }
}
