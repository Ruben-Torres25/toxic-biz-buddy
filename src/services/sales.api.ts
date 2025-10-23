import { api } from "@/lib/api";

/** Métodos de pago admitidos */
export type PaymentMethod = "cash" | "debit" | "credit" | "transfer";

/** Item de venta (detalle) */
export type SaleItem = {
  productId: string;
  sku?: string | null;
  name: string;
  qty: number;
  price: number;       // precio unitario
  discount?: number;   // descuento ABS por unidad
};

/** Pago de la venta */
export type SalePayment = {
  method: PaymentMethod;
  amount: number;
};

/** Resumen de una venta (para listados) */
export type SaleSummary = {
  id: string;
  number?: string | null;
  createdAt: string;
  /** Si la venta se asocia a un cliente */
  customerId?: string | null;
  customerName?: string | null;

  /** Totales */
  subtotal: number;
  discountGlobal?: number;
  total: number;

  /** Breakdown opcional por método (si tu backend lo devuelve) */
  paymentsBreakdown?: Partial<Record<PaymentMethod, number>>;
  /** Cantidad de ítems (opcional) */
  itemsCount?: number;
};

/** Venta completa (para el modal de detalle) */
export type SaleDetail = SaleSummary & {
  notes?: string | null;
  items: SaleItem[];
  payments: SalePayment[];
};

/** Payload para crear/confirmar una venta */
export type CreateSalePayload = {
  items: Array<{ productId: string; qty: number; price: number; discount?: number }>;
  payments: Array<{ method: PaymentMethod; amount: number }>;
  notes?: string;
  /** Si necesitás asociar a cliente, podés agregar estas props si tu backend las soporta */
  customerId?: string;
  discountGlobal?: number;
};

// 👉 Base clásica
const SALES_BASE = "/sales";

export class SalesAPI {
  /** Crear venta (ruta clásica /sales) */
  static create(data: CreateSalePayload) {
    return api.post<{ id: string; number?: string; total: number; createdAt: string }>(
      SALES_BASE,
      data
    );
  }

  /**
   * Obtener venta por id (tolerante a rutas alternativas).
   * 1) /sales/:id
   * 2) /cash/sales/:id  (si tu caja expone ventas desde otra ruta)
   */
  static async getById(id: string): Promise<SaleDetail> {
    try {
      return await api.get<SaleDetail>(`${SALES_BASE}/${id}`);
    } catch (e: any) {
      // fallback a posible ruta alternativa
      try {
        return await api.get<SaleDetail>(`/cash/sales/${id}`);
      } catch {
        throw e; // devolvemos el error original (404)
      }
    }
  }

  /**
   * Listar ventas por rango (opcional, útil para historiales).
   */
  static list(params: {
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
    customerId?: string;
  }): Promise<{ items: SaleSummary[]; total: number; page: number; pageSize: number }> {
    const q: Record<string, any> = {};
    if (params.from) q.from = params.from;
    if (params.to) q.to = params.to;
    if (params.page) q.page = params.page;
    if (params.pageSize) q.pageSize = params.pageSize;
    if (params.customerId) q.customerId = params.customerId;
    return api.get(SALES_BASE, q);
  }

  /** Helper para listar por un día (YYYY-MM-DD). */
  static listByDay(dayISODate: string, customerId?: string) {
    const day = new Date(dayISODate);
    const from = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0).toISOString();
    const to   = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999).toISOString();
    return this.list({ from, to, pageSize: 500, customerId });
  }
}
