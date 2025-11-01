// src/services/collections.api.ts
import { CashAPI, type CashMovement } from "@/services/cash.api";

export type CollectionMethod =
  | "EFECTIVO"
  | "TRANSFERENCIA"
  | "DEBITO"
  | "CREDITO"
  | "OTRO";

export type CollectionMovementKind = "INGRESO" | "EGRESO" | "VENTA";

export type CollectionRow = {
  id: string;
  source: "CAJA" | "CLIENTES";
  date: string; // ISO
  method: CollectionMethod; // usado para TOTALES
  amount: number; // puede ser negativo (egreso)
  description?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  /** Solo para CAJA: etiqueta visible en la columna “Medio” */
  movement?: CollectionMovementKind;
};

export type CollectionsResponse = {
  range: { from: string; to: string };
  totals: {
    EFECTIVO: number;
    TRANSFERENCIA: number;
    DEBITO: number;
    CREDITO: number;
    OTRO: number;
    TOTAL: number;
  };
  items: CollectionRow[];
};

const API = import.meta.env.VITE_API_URL ?? "";

/* ===== helpers ===== */
function normalizeMethod(
  method?: string | null,
  description?: string | null
): CollectionMethod {
  const m = String(method ?? "").trim().toUpperCase();
  const d = String(description ?? "").trim().toUpperCase();

  if (m === "EFECTIVO" || m === "CASH" || /(^|\W)(EFECTIVO|CASH)(\W|$)/.test(d))
    return "EFECTIVO";
  if (
    m === "TRANSFERENCIA" ||
    m === "TRANSFER" ||
    m === "BANK_TRANSFER" ||
    /(^|\W)(TRANSFER|TRANSFERENCIA)(\W|$)/.test(d)
  )
    return "TRANSFERENCIA";
  if (m === "DEBITO" || m === "DEBIT" || /(^|\W)(DEBITO|DEBIT)(\W|$)/.test(d))
    return "DEBITO";
  if (m === "CREDITO" || m === "CREDIT" || /(^|\W)(CREDITO|CREDIT)(\W|$)/.test(d))
    return "CREDITO";
  return "OTRO";
}

function computeTotals(items: CollectionRow[]) {
  const t = { EFECTIVO: 0, TRANSFERENCIA: 0, DEBITO: 0, CREDITO: 0, OTRO: 0, TOTAL: 0 };
  for (const it of items) {
    const amt = Number(it.amount || 0);
    const k = (it.method as keyof typeof t) || "OTRO";
    if (k in t) t[k] += amt;
    else t.OTRO += amt;
    t.TOTAL += amt;
  }
  return t;
}

function normDesc(s?: string | null) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

/** Firma “blanda” para deduplicar. Para CAJA redondeamos fecha al minuto. */
function dedupeKey(row: CollectionRow) {
  const cents = Math.round(Number(row.amount || 0) * 100);
  const d = new Date(row.date ? row.date : Date.now());
  if (row.source === "CAJA") {
    d.setSeconds(0, 0); // tolerancia a segundos distintos
  } else {
    d.setMilliseconds(0);
  }
  // no incluimos `method` en la llave para que gane el que traiga mejor info (movement)
  return `${row.source}|${d.toISOString()}|${cents}|${normDesc(row.description)}`;
}

function score(row: CollectionRow) {
  // Prioriza registros con movement (INGRESO/EGRESO/VENTA) y luego los que no son OTRO
  let s = 0;
  if (row.movement) s += 2;
  if (row.method !== "OTRO") s += 1;
  return s;
}

/* ===== API ===== */
export async function fetchCollections(params: {
  from?: string;
  to?: string;
}): Promise<CollectionsResponse> {
  // 1) Backend base
  const qs = new URLSearchParams();
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);

  const res = await fetch(`${API}/collections?${qs.toString()}`);
  if (!res.ok) throw new Error("Error al obtener cobranzas");
  const base = (await res.json()) as CollectionsResponse;

  const fromISO =
    params.from ?? base?.range?.from ?? new Date(Date.now() - 7 * 864e5).toISOString();
  const toISO = params.to ?? base?.range?.to ?? new Date().toISOString();
  const fromTs = new Date(fromISO).getTime();
  const toTs = new Date(toISO).getTime();

  const baseItems: CollectionRow[] = (Array.isArray(base?.items) ? base.items : []).map(
    (i) => ({
      ...i,
      source: i.source ?? "CLIENTES",
      method: normalizeMethod(i.method, i.description),
      // los de base no traen 'movement'; si vienen de caja podrían quedar como OTRO
    })
  );

  // 2) CAJA income/expense -> SIEMPRE cuentan como EFECTIVO para totales
  const cashMovs: CashMovement[] = await CashAPI.movements({ days: 120 });
  const cashRows: CollectionRow[] = cashMovs
    .filter((m) => m.type === "income" || m.type === "expense")
    .filter((m) => {
      const t = new Date(m.occurredAt || m.createdAt).getTime();
      return t >= fromTs && t <= toTs;
    })
    .map((m) => {
      const isExpense = m.type === "expense";
      return {
        id: `cash-${m.id}`,
        source: "CAJA",
        date: String(m.occurredAt || m.createdAt),
        method: "EFECTIVO", // 👈 clave: así los totales netean en EFECTIVO
        amount: isExpense
          ? -Math.abs(Number(m.amount || 0))
          : Math.abs(Number(m.amount || 0)),
        description: m.description ?? "",
        customerId: null,
        customerName: m.customerName ?? null,
        movement: isExpense ? "EGRESO" : "INGRESO",
      };
    });

  // 3) Merge + DEDUPE (preferimos el que tiene movement/medio específico)
  const merged = [...baseItems, ...cashRows];
  const byKey = new Map<string, CollectionRow>();
  for (const row of merged) {
    const key = dedupeKey(row);
    const prev = byKey.get(key);
    if (!prev) byKey.set(key, row);
    else if (score(row) > score(prev)) byKey.set(key, row);
  }
  const items = Array.from(byKey.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // 4) Totales (netean ingresos y egresos)
  const totals = computeTotals(items);

  return {
    range: { from: fromISO, to: toISO },
    totals,
    items,
  };
}
