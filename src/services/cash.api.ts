// src/services/cash.api.ts
import { api } from "@/lib/api";

/** Tipos de movimiento que maneja caja */
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
  date: string;             // YYYY-MM-DD
  openingAmount: number;
  closingAmount: number;
  isOpen: boolean;
  income: number;           // suma de ingresos
  expense: number;          // suma de egresos (valor positivo)
  salesCash: number;        // ventas en efectivo
  details: CashDailyEntry[]; // movimientos del día (incluye open/close)
};

/** Estado “current” */
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

/** Movimiento plano (lista de movimientos) */
export type CashMovement = {
  id: string;
  createdAt: string;
  occurredAt?: string | null;
  amount: number;
  type: "income" | "expense" | "sale";
  description?: string | null;
  saleId?: string | null;
  customerName?: string | null;
  method?: "EFECTIVO" | "TRANSFERENCIA" | "DEBITO" | "CREDITO" | "OTRO";
};

/** Normaliza cualquier forma que pueda devolver el backend a una lista de movimientos planos */
function normalizeCashMovements(raw: any): CashMovement[] {
  const mapOne = (m: any): CashMovement | null => {
    if (!m) return null;
    const t = String(m.type ?? "").toLowerCase();
    // ignoramos open/close en esta vista
    if (t === "open" || t === "close") return null;
    const type = (t === "income" || t === "expense" || t === "sale") ? t : "sale";
    return {
      id: String(m.id ?? m._id ?? cryptoRandomId()),
      createdAt: String(m.createdAt ?? m.date ?? new Date().toISOString()),
      occurredAt: m.occurredAt ?? null,
      amount: Number(m.amount ?? 0),
      type,
      description: m.description ?? null,
      saleId: m.saleId ?? null,
      customerName: m.customerName ?? null,
      method:
        (m.method as CashMovement["method"]) ??
        (m.paymentsBreakdown ? "EFECTIVO" : undefined),
    };
  };

  const out: CashMovement[] = [];

  if (Array.isArray(raw)) {
    raw.forEach((r) => {
      const mm = mapOne(r);
      if (mm) out.push(mm);
    });
    return out;
  }

  // formatos comunes { items:[] } | { data:[] } | { results:[] }
  const arr = raw?.items || raw?.data || raw?.results;
  if (Array.isArray(arr)) {
    arr.forEach((r: any) => {
      const mm = mapOne(r);
      if (mm) out.push(mm);
    });
    return out;
  }

  // /cash/daily -> { days:[{details:[]}, ...] }
  if (Array.isArray(raw?.days)) {
    raw.days.forEach((d: any) => {
      (d?.details ?? []).forEach((r: any) => {
        const mm = mapOne(r);
        if (mm) out.push(mm);
      });
    });
    return out;
  }

  // { details:[] }
  if (Array.isArray(raw?.details)) {
    raw.details.forEach((r: any) => {
      const mm = mapOne(r);
      if (mm) out.push(mm);
    });
    return out;
  }

  return out;
}

// fallback para IDs si faltan
function cryptoRandomId() {
  return "tmp_" + Math.random().toString(36).slice(2, 10);
}

/** Mapea sinónimos en español y normaliza el signo según el tipo (para cumplir el CHECK de DB) */
function normalizeMovementInput(p: {
  amount: number;
  type: string;
  description?: string;
}): { amount: number; type: "income" | "expense" | "sale"; description: string } {
  const rawType = String(p.type || "").toLowerCase();

  const typeNorm: "income" | "expense" | "sale" =
    rawType === "ingreso" ? "income"
    : rawType === "egreso" ? "expense"
    : rawType === "income" ? "income"
    : rawType === "expense" ? "expense"
    : "sale"; // fallback seguro

  let amt = Number(p.amount || 0);
  if (!Number.isFinite(amt)) amt = 0;

  if (amt === 0) {
    throw new Error("El monto no puede ser 0.");
  }

  // Regla de signo para respetar el CHECK:
  // - income / sale  -> positivo
  // - expense        -> negativo
  const normalizedAmount = typeNorm === "expense" ? -Math.abs(amt) : Math.abs(amt);

  return {
    type: typeNorm,
    amount: normalizedAmount,
    description: p.description?.toString() ?? "",
  };
}

export const CashAPI = {
  // Estado del día
  current: async (): Promise<CashCurrent> => api.get("/cash/current"),

  // Historial agrupado por día
  daily: async (days = 30): Promise<CashDailyDay[]> =>
    api.get("/cash/daily", { days }),

  // Historial plano (legacy)
  history: async (days = 14) => api.get("/cash/history", { days }),

  // Lista de movimientos (plano). Si pasás from/to usa rango; si no, usa days.
  movements: async (
    params?: { from?: string; to?: string; days?: number }
  ): Promise<CashMovement[]> => {
    let raw: any;
    if (params?.from || params?.to) {
      raw = await api.get("/cash/history", {
        from: params.from,
        to: params.to,
      });
    } else {
      raw = await api.get("/cash/history", { days: params?.days ?? 7 });
    }
    return normalizeCashMovements(raw);
  },

  // Operaciones de caja
  open: async (amount: number) => api.post("/cash/open", { openingAmount: amount }),
  close: async (amount: number) => api.post("/cash/close", { closingAmount: amount }),

  /** Movimiento genérico (acepta "ingreso"/"egreso" o "income"/"expense"/"sale"). Normaliza tipo y signo. */
  movement: async (p: {
    amount: number;
    type: "income" | "expense" | "sale" | "ingreso" | "egreso";
    description: string;
  }) => {
    const body = normalizeMovementInput(p);
    return api.post("/cash/movement", body);
  },

  /** Atajo para registrar un INGRESO (siempre positivo) */
  income: async (p: { amount: number; description: string }) => {
    const body = normalizeMovementInput({ ...p, type: "income" });
    return api.post("/cash/movement", body);
  },

  /** Atajo para registrar un EGRESO (siempre negativo) */
  expense: async (p: { amount: number; description: string }) => {
    const body = normalizeMovementInput({ ...p, type: "expense" });
    return api.post("/cash/movement", body);
  },

  status: async (): Promise<{ isOpen: boolean }> => api.get("/cash/status"),

  // Checkout (venta al mostrador)
  checkout: async (payload: {
    items: Array<{ productId: string; qty: number; price?: number; discount?: number }>;
    payments: Array<{ method: "cash" | "debit" | "credit" | "transfer"; amount: number }>;
    discountGlobal?: number;
    notes?: string;
    customerId?: string; // normalmente omitido en caja (consumidor final)
  }) => api.post("/sales/checkout", payload),
};
