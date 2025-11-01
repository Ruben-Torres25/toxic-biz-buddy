// src/components/sections/HistorySection.tsx
import * as React from "react";
import { useMemo, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Landmark,
  RotateCcw,
  Banknote,
  Scale,
  History,
  Eye,
} from "lucide-react";
import {
  LedgerAPI,
  type LedgerListResponse,
  type LedgerEntry,
} from "@/services/ledger.api";
import {
  CashAPI,
  type CashDailyDay,
  type MovementKind,
} from "@/services/cash.api";
import {
  CustomerPicker,
  type CustomerOption,
} from "@/components/common/CustomerPicker";
import { cn } from "@/lib/utils";
import { CashDayDetailModal } from "@/components/modals/CashDayDetailModal";
import { Input } from "@/components/ui/input";
import {
  fetchCollections,
  type CollectionsResponse,
  type CollectionRow,
} from "@/services/collections.api";

const moneyFmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

function monthRangeISO(d = new Date()) {
  const y = d.getFullYear();
  const m = d.getMonth();
  const from = new Date(y, m, 1, 0, 0, 0, 0).toISOString();
  const to = new Date(y, m + 1, 0, 23, 59, 59, 999).toISOString();
  return { from, to };
}

const sum = (ls?: number[]) =>
  (ls ?? []).reduce((a, b) => a + (Number.isFinite(b) ? Number(b) : 0), 0);

function typeLabel(t: LedgerEntry["type"]) {
  return t === "order"
    ? "Pedido"
    : t === "payment"
    ? "Pago"
    : t === "credit_note"
    ? "Nota de crédito"
    : "Ajuste";
}

function shortId(id?: string) {
  return id ? id.slice(0, 8) : "—";
}

function sortAsc(items: LedgerEntry[]) {
  return [...items].sort((a, b) => {
    const da = new Date((a as any).date ?? (a as any).createdAt ?? 0).getTime();
    const db = new Date((b as any).date ?? (b as any).createdAt ?? 0).getTime();
    if (da !== db) return da - db;
    return a.id.localeCompare(b.id);
  });
}

function oneMsBefore(iso: string) {
  const t = new Date(iso).getTime() - 1;
  return new Date(t).toISOString();
}

function saldoToneClasses(n: number) {
  if (n > 0) {
    return {
      text: "text-red-700 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/30",
      border: "border-red-200 dark:border-red-800",
      dot: "bg-red-500",
    };
  }
  if (n < 0) {
    return {
      text: "text-emerald-700 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/30",
      border: "border-emerald-200 dark:border-emerald-800",
      dot: "bg-emerald-500",
    };
  }
  return {
    text: "text-muted-foreground",
    bg: "bg-muted/30",
    border: "border-transparent",
    dot: "bg-muted-foreground",
  };
}

const PAGE_SIZE = 10;

// YYYY-MM-DD (TZ segura)
function isoYMD(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

/** ===== Helpers cliente / extracción ===== */
function pickCustomerName(row: any): string | null {
  const direct =
    row.customerName ||
    row.saleCustomerName ||
    row.customer?.name ||
    row.businessName ||
    row.customerBusinessName ||
    row.customer ||
    row.customer_name ||
    row.saleDetail?.customerName ||
    null;

  if (direct && String(direct).trim().length > 0) return String(direct).trim();
  if (row.customerId) return `#${shortId(String(row.customerId))}`;
  return null;
}

function extractOrderId(text?: string): string | null {
  if (!text) return null;
  const rgx1 =
    /pedido\s+([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})/i.exec(text);
  if (rgx1) return rgx1[1];
  const rgx2 = /([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})/i.exec(text);
  return rgx2 ? rgx2[1] : null;
}

/** ===== Normalización de medio y detalle ===== */
function normalizeMethod(
  method?: string | null,
  description?: string | null
): "EFECTIVO" | "TRANSFERENCIA" | "DEBITO" | "CREDITO" | "OTRO" {
  const m = (method ?? "").toString().trim().toUpperCase();
  const desc = (description ?? "").toString().trim().toUpperCase();

  const isCash =
    ["CASH", "EFECTIVO"].includes(m) || /(^|\W)(EFECTIVO|CASH)(\W|$)/.test(desc);
  if (isCash) return "EFECTIVO";

  const isTransfer =
    ["TRANSFER", "TRANSFERENCIA", "BANK_TRANSFER"].includes(m) ||
    /(^|\W)(TRANSFER|TRANSFERENCIA)(\W|$)/.test(desc);
  if (isTransfer) return "TRANSFERENCIA";

  const isDebit =
    ["DEBIT", "DEBITO", "DEBIT CARD", "TARJETA DEBITO"].includes(m) ||
    /(^|\W)(DEBIT|DEBITO)(\W|$)/.test(desc);
  if (isDebit) return "DEBITO";

  const isCredit =
    ["CREDIT", "CREDITO", "CREDIT CARD", "TARJETA CREDITO"].includes(m) ||
    /(^|\W)(CREDIT|CREDITO)(\W|$)/.test(desc);
  if (isCredit) return "CREDITO";

  return "OTRO";
}

function fixDescription(s?: string | null) {
  if (!s) return "—";
  return s
    .replace(/\bTRANSFER\b/gi, "TRANSFERENCIA")
    .replace(/\bDEBIT\b/gi, "DEBITO")
    .replace(/\bCREDIT\b/gi, "CREDITO");
}

/** ===== Heurísticas de origen/filtrado ===== */
function originOf(it: CollectionRow): "CAJA" | "CLIENTES" {
  if ((it as any).source === "CLIENTES") return "CLIENTES";
  if ((it as any).customerId || (it as any).customerName) return "CLIENTES";
  if (/(venta\s+pedido|pedido)/i.test((it as any).description ?? "")) return "CLIENTES";
  return "CAJA";
}

function looksLikeOrder(row: any): boolean {
  const t = (row.type ?? "").toString().toUpperCase();
  const desc = (row.description ?? "").toString().toUpperCase();
  if (t === "ORDER") return true;
  if (/(^|\W)(VENTA\s+PEDIDO|PEDIDO|VENTA\s+A\s+CUENTA|FACTURA)(\W|$)/.test(desc)) return true;
  if (extractOrderId(row.description)) return true;
  return false;
}

function looksLikePayment(row: any): boolean {
  const t = (row.type ?? "").toString().toUpperCase();
  const desc = (row.description ?? "").toString().toUpperCase();
  if (t === "PAYMENT") return true;
  if (/(^|\W)(PAGO|COBRO|SEÑA|SEÑA\s+PEDIDO)(\W|$)/.test(desc)) return true;
  const m = normalizeMethod(row.method, row.description);
  return m !== "OTRO";
}

/** Orden descendente por fecha para cobranzas */
function sortByDateDesc<T extends { date?: string }>(rows: T[]) {
  return [...rows].sort(
    (a: any, b: any) =>
      new Date(b?.date ?? 0).getTime() - new Date(a?.date ?? 0).getTime()
  );
}

/** ===== Nuevo: mostrar “Medio” como INGRESO/EGRESO/VENTA para CAJA ===== */
function displayMediumFor(row: CollectionRow) {
  const mov = (row as any).movement as ("INGRESO" | "EGRESO" | "VENTA" | undefined);
  if (originOf(row) === "CAJA" && mov) return mov;
  return normalizeMethod((row as any).method, (row as any).description);
}

/** ===== Nuevo: clave de totales (CAJA = EFECTIVO por defecto) ===== */
function methodKeyForTotals(row: CollectionRow) {
  const mov = (row as any).movement as ("INGRESO" | "EGRESO" | "VENTA" | undefined);
  if (originOf(row) === "CAJA" && mov) return "EFECTIVO";
  return normalizeMethod((row as any).method, (row as any).description);
}

export const HistorySection: React.FC = () => {
  const { from, to } = useMemo(() => monthRangeISO(new Date()), []);
  const [customer, setCustomer] = React.useState<CustomerOption | null>(null);

  // ===== Ledger KPIs =====
  const qOrders = useQuery<LedgerListResponse>({
    queryKey: ["ledger", "orders-month", { from, to, customerId: customer?.id ?? null }],
    queryFn: () =>
      LedgerAPI.list({
        from,
        to,
        type: "order",
        pageSize: 500,
        customerId: customer?.id || undefined,
      }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const qPayments = useQuery<LedgerListResponse>({
    queryKey: ["ledger", "payments-month", { from, to, customerId: customer?.id ?? null }],
    queryFn: () =>
      LedgerAPI.list({
        from,
        to,
        type: "payment",
        pageSize: 500,
        customerId: customer?.id || undefined,
      }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const qCN = useQuery<LedgerListResponse>({
    queryKey: ["ledger", "cn-month", { from, to, customerId: customer?.id ?? null }],
    queryFn: () =>
      LedgerAPI.list({
        from,
        to,
        type: "credit_note",
        pageSize: 500,
        customerId: customer?.id || undefined,
      }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const qPeriod = useQuery<LedgerListResponse>({
    queryKey: ["ledger", "period", { from, to, customerId: customer?.id ?? null }],
    queryFn: () =>
      LedgerAPI.list({
        from,
        to,
        pageSize: 1000,
        customerId: customer?.id || undefined,
      }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const qOpening = useQuery<LedgerListResponse>({
    enabled: !!customer?.id,
    queryKey: ["ledger", "opening", { to, from, customerId: customer?.id ?? null }],
    queryFn: async () => {
      const toPrev = oneMsBefore(from);
      return LedgerAPI.list({
        to: toPrev,
        pageSize: 1,
        customerId: customer?.id || undefined,
      });
    },
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const ordersSum = useMemo(
    () => sum(qOrders.data?.items.map((i) => i.amount)),
    [qOrders.data]
  );
  const paymentsSum = useMemo(
    () => sum(qPayments.data?.items.map((i) => i.amount)),
    [qPayments.data]
  );
  const cnSum = useMemo(
    () => sum(qCN.data?.items.map((i) => i.amount)),
    [qCN.data]
  );
  const netSum = useMemo(
    () => ordersSum + paymentsSum + cnSum,
    [ordersSum, paymentsSum, cnSum]
  );
  const loadingKPIs =
    qOrders.isFetching || qPayments.isFetching || qCN.isFetching;

  // ===== Ledger rows (ASC -> saldo) y luego DESC para mostrar
  const rowsAsc = useMemo(() => {
    const items = sortAsc(qPeriod.data?.items ?? []);
    const openingBalance = customer?.id
      ? Number(qOpening.data?.balance ?? 0)
      : 0;

    let running = openingBalance;
    return items.map((it) => {
      const amount = Number(it.amount);
      const debe = amount > 0 ? amount : 0;
      const haber = amount < 0 ? Math.abs(amount) : 0;
      running = Number((running + amount).toFixed(2));
      return { ...it, debe, haber, saldo: running };
    });
  }, [qPeriod.data, qOpening.data, customer?.id]);

  const rowsDesc = useMemo(() => [...rowsAsc].reverse(), [rowsAsc]);

  // ===== Paginación ledger (DESC)
  const [ledgerPage, setLedgerPage] = React.useState(1);
  useEffect(() => {
    setLedgerPage(1);
  }, [customer?.id, rowsDesc.length]);

  const ledgerTotal = rowsDesc.length;
  const ledgerTotalPages = Math.max(1, Math.ceil(ledgerTotal / PAGE_SIZE));
  const ledgerStartIdx = (ledgerPage - 1) * PAGE_SIZE;
  const ledgerEndIdx = ledgerStartIdx + PAGE_SIZE;
  const ledgerPaged = rowsDesc.slice(ledgerStartIdx, ledgerEndIdx);
  const ledgerRangeFrom = ledgerTotal ? ledgerStartIdx + 1 : 0;
  const ledgerRangeTo = Math.min(ledgerTotal, ledgerEndIdx);

  // ===== Caja por día
  const qDaily = useQuery<CashDailyDay[]>({
    queryKey: ["cash", "daily", { days: 30 }],
    queryFn: () => CashAPI.daily(30),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  // dd/mm/aaaa
  function dayLabel(isoYMD: string) {
    const [y, m, d] = isoYMD.split("-").map((x) => Number(x));
    const date = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
    return date.toLocaleDateString("es-AR");
  }

  function dayTotals(g: CashDailyDay) {
    const openAmt = Number((g as any).openingAmount || 0);
    const closeAmt = Number((g as any).closingAmount || 0);
    const income = Number((g as any).income || 0);
    const expense = Number((g as any).expense || 0);
    const sales = Number((g as any).salesCash || 0);
    const saldoCalc = openAmt + income - expense + sales;
    return { openAmt, closeAmt, income, expense, sales, saldoCalc };
  }

  const daysDesc = useMemo(
    () => [...(qDaily.data ?? [])].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [qDaily.data]
  );

  const [cashPage, setCashPage] = React.useState(1);
  useEffect(() => {
    setCashPage(1);
  }, [daysDesc.length]);

  const cashTotal = daysDesc.length;
  const cashTotalPages = Math.max(1, Math.ceil(cashTotal / PAGE_SIZE));
  const cashStartIdx = (cashPage - 1) * PAGE_SIZE;
  const cashEndIdx = cashStartIdx + PAGE_SIZE;
  const cashPaged = daysDesc.slice(cashStartIdx, cashEndIdx);
  const cashRangeFrom = cashTotal ? cashStartIdx + 1 : 0;
  const cashRangeTo = Math.min(cashTotal, cashEndIdx);

  const [cashDetailOpen, setCashDetailOpen] = React.useState(false);
  const [cashDetailDay, setCashDetailDay] = React.useState<CashDailyDay | null>(null);
  const openCashDetail = (day: CashDailyDay) => {
    setCashDetailDay(day);
    setCashDetailOpen(true);
  };

  const showCustomerCol = !customer?.id;

  // ===== Cobranzas (Clientes + Caja)
  const todayYMD = isoYMD(new Date());
  const sevenDaysYMD = isoYMD(new Date(Date.now() - 7 * 864e5));
  const thirtyDaysYMD = isoYMD(new Date(Date.now() - 30 * 864e5));
  const oneYearYMD = isoYMD(new Date(Date.now() - 365 * 864e5));

  const [cFrom, setCFrom] = React.useState(sevenDaysYMD);
  const [cTo, setCTo] = React.useState(todayYMD);
  const [origin, setOrigin] = React.useState<"ALL" | "CAJA" | "CLIENTES">("ALL");

  const qCollections = useQuery<CollectionsResponse>({
    queryKey: ["collections", cFrom, cTo],
    queryFn: () =>
      fetchCollections({
        from: `${cFrom}T00:00:00.000Z`,
        to: `${cTo}T23:59:59.999Z`,
      }),
    // fuerza actualización al volver o cambiar foco
    placeholderData: keepPreviousData,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });

  // Ledger en rango para resolver nombres
  const qLedgerForCollections = useQuery<LedgerListResponse>({
    queryKey: ["ledger", "collections-range", { cFrom, cTo }],
    queryFn: () =>
      LedgerAPI.list({
        from: `${cFrom}T00:00:00.000Z`,
        to: `${cTo}T23:59:59.999Z`,
        pageSize: 1000,
      }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const nameMaps = useMemo(() => {
    const items = qLedgerForCollections.data?.items ?? [];
    const byCustomerId = new Map<string, string>();
    const bySourceId = new Map<string, string>();
    for (const it of items as any[]) {
      const cid = it.customerId;
      const cname = it.customerName;
      if (cid && cname && !byCustomerId.has(cid)) byCustomerId.set(cid, cname);
      const sid = it.sourceId;
      if (sid && cname && !bySourceId.has(sid)) bySourceId.set(sid, cname);
    }
    return { byCustomerId, bySourceId };
  }, [qLedgerForCollections.data]);

  // Mantener TODO lo de CAJA; en CLIENTES quitar órdenes y dejar pagos
  const cobranzasRows = useMemo<CollectionRow[]>(() => {
    const all = qCollections.data?.items ?? [];

    // Primero filtro por tipo/origen
    const filtered = all.filter((row) => {
      const o = originOf(row);
      if (o === "CAJA") return true;
      if (looksLikeOrder(row)) return false;
      return looksLikePayment(row);
    });

    // Luego ordeno por fecha desc
    const sorted = sortByDateDesc(filtered as any[]);

    // Finalmente aplico el toggle de origen
    if (origin === "ALL") return sorted;
    return sorted.filter((it) => originOf(it) === origin);
  }, [qCollections.data, origin]);

  // Totales por medio de pago (ingresos suman, egresos restan)
  type Totals = {
    EFECTIVO: number; TRANSFERENCIA: number; DEBITO: number; CREDITO: number; OTRO: number; TOTAL: number;
  };

  const computeTotals = (rows: CollectionRow[]): Totals => {
    const base: Totals = { EFECTIVO: 0, TRANSFERENCIA: 0, DEBITO: 0, CREDITO: 0, OTRO: 0, TOTAL: 0 };
    for (const it of rows) {
      const v = Number((it as any).amount || 0); // puede ser negativo (egreso)
      const k = methodKeyForTotals(it);          // CAJA -> EFECTIVO por defecto
      if (k in base) (base as any)[k] += v; else base.OTRO += v;
      base.TOTAL += v;
    }
    return base;
  };
  const totalsFiltered = useMemo(() => computeTotals(cobranzasRows), [cobranzasRows]);

  // ===== Paginación cobranzas (DESC ya garantizado)
  const [collPage, setCollPage] = React.useState(1);
  useEffect(() => {
    setCollPage(1);
  }, [origin, cFrom, cTo, cobranzasRows.length]);

  const collTotal = cobranzasRows.length;
  const collTotalPages = Math.max(1, Math.ceil(collTotal / PAGE_SIZE));
  const collStartIdx = (collPage - 1) * PAGE_SIZE;
  const collEndIdx = collStartIdx + PAGE_SIZE;
  const cobranzasPaged = cobranzasRows.slice(collStartIdx, collEndIdx);
  const collRangeFrom = collTotal ? collStartIdx + 1 : 0;
  const collRangeTo = Math.min(collTotal, collEndIdx);

  // Label amigable para origen
  const originLabel = origin === "ALL" ? "Todos" : origin === "CAJA" ? "Caja" : "Clientes";

  // Resolver nombre de cliente para Cobranzas
  function resolveCustomerForRow(row: any): string {
    const rowOrigin = originOf(row);
    if (rowOrigin === "CAJA") return "Consumidor Final";

    const direct = pickCustomerName(row);
    if (direct) return direct;

    if (row.customerId && nameMaps.byCustomerId.has(row.customerId)) {
      return nameMaps.byCustomerId.get(row.customerId)!;
    }
    const sid =
      (row as any).sourceId ||
      (row as any).orderId ||
      (row as any).referenceId ||
      extractOrderId(row.description);
    if (sid && nameMaps.bySourceId.has(sid)) {
      return nameMaps.bySourceId.get(sid)!;
    }
    return "—";
  }

  return (
    <div className="space-y-6">
      {/* Header general */}
      <div className="flex items-center gap-2">
        <History className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Historial</h1>
          <p className="text-sm text-muted-foreground">
            KPIs y movimientos contables {customer ? `— Cliente: ${customer.name}` : "— General"}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Ventas (mes)" value={loadingKPIs ? "…" : moneyFmt.format(ordersSum)} icon={Landmark} />
        <StatsCard title="Pagos (mes)"  value={loadingKPIs ? "…" : moneyFmt.format(paymentsSum)} icon={Banknote} />
        <StatsCard title="Notas de crédito (mes)" value={loadingKPIs ? "…" : moneyFmt.format(cnSum)} icon={RotateCcw} />
        <StatsCard
          title={`Balance neto (${customer ? "cliente" : "mes"})`}
          value={loadingKPIs ? "…" : moneyFmt.format(netSum)}
          icon={Scale}
          variant={netSum >= 0 ? "success" : "destructive"}
        />
      </div>

      {/* Tabla Debe / Haber / Saldo (recientes primero) */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary" />
            {customer ? "Cuenta corriente del cliente" : "Movimientos recientes (general)"}
          </CardTitle>

        {/* Picker de cliente */}
          <div className="w-full sm:w-auto">
            <CustomerPicker value={customer} onChange={setCustomer} />
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
                  <tr className="border-b">
                    <th className="text-left p-2">Fecha</th>
                    <th className="text-left p-2">Tipo</th>
                    {showCustomerCol && <th className="text-left p-2">Cliente</th>}
                    <th className="text-left p-2">N°</th>
                    <th className="text-left p-2">Descripción</th>
                    <th className="text-right p-2">Debe</th>
                    <th className="text-right p-2">Haber</th>
                    <th className="text-right p-2">Saldo</th>
                  </tr>
                </thead>

                <tbody className="[&>tr:nth-child(even)]:bg-muted/20">
                  {customer?.id && (
                    <tr className="border-b">
                      <td className="p-2 text-muted-foreground" colSpan={showCustomerCol ? 7 : 6}>
                        Saldo inicial al {new Date(from).toLocaleDateString("es-AR")}
                      </td>
                      <td className="p-2 text-right">
                        {(() => {
                          const init = Number(qOpening.data?.balance ?? 0);
                          const tone = saldoToneClasses(init);
                          return (
                            <span
                              className={cn(
                                "inline-flex items-center justify-end gap-2 rounded-md px-2 py-1 tabular-nums font-semibold border",
                                tone.text,
                                tone.bg,
                                tone.border
                              )}
                            >
                              <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
                              {moneyFmt.format(init)}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  )}

                  {rowsDesc.length === 0 && (
                    <tr>
                      <td colSpan={showCustomerCol ? 8 : 7} className="p-4 text-center text-muted-foreground">
                        {qPeriod.isFetching ? "Cargando..." : "Sin movimientos en el período"}
                      </td>
                    </tr>
                  )}

                  {ledgerPaged.map((r) => {
                    const tone = saldoToneClasses((r as any).saldo);
                    const when = (r as any).date || (r as any).createdAt || "";
                    return (
                      <tr key={r.id} className="border-b last:border-b-0">
                        <td className="p-2 align-middle whitespace-nowrap">
                          {when ? new Date(when).toLocaleString("es-AR", { hour12: false }) : "—"}
                        </td>
                        <td className="p-2 align-middle">{typeLabel(r.type)}</td>
                        {showCustomerCol && (
                          <td className="p-2 align-middle">
                            {(r as any).customerName ?? "—"}
                          </td>
                        )}
                        <td className="p-2 align-middle font-mono">{shortId((r as any).sourceId)}</td>
                        <td className="p-2 align-middle">
                          <span className="text-muted-foreground">{(r as any).description ?? "—"}</span>
                        </td>
                        <td
                          className={cn(
                            "p-2 align-middle text-right tabular-nums",
                            (r as any).debe ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {(r as any).debe ? moneyFmt.format((r as any).debe) : "—"}
                        </td>
                        <td
                          className={cn(
                            "p-2 align-middle text-right tabular-nums",
                            (r as any).haber ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {(r as any).haber ? moneyFmt.format((r as any).haber) : "—"}
                        </td>
                        <td className="p-2 align-middle text-right">
                          <span
                            className={cn(
                              "inline-flex items-center justify-end gap-2 rounded-md px-2 py-1 tabular-nums font-semibold border",
                              tone.text,
                              tone.bg,
                              tone.border
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
                            {moneyFmt.format((r as any).saldo)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginador ledger */}
            <div className="flex items-center justify-between px-3 py-2 border-t bg-background/70">
              <div className="text-xs text-muted-foreground">
                {ledgerTotal
                  ? `Mostrando ${ledgerRangeFrom}–${ledgerRangeTo} de ${ledgerTotal}`
                  : "Sin resultados"}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setLedgerPage(1)} disabled={ledgerPage <= 1}>«</Button>
                <Button size="sm" variant="outline" onClick={() => setLedgerPage((p) => Math.max(1, p - 1))} disabled={ledgerPage <= 1}>Anterior</Button>
                <span className="text-sm tabular-nums">{ledgerPage} / {ledgerTotalPages}</span>
                <Button size="sm" variant="outline" onClick={() => setLedgerPage((p) => Math.min(ledgerTotalPages, p + 1))} disabled={ledgerPage >= ledgerTotalPages}>Siguiente</Button>
                <Button size="sm" variant="outline" onClick={() => setLedgerPage(ledgerTotalPages)} disabled={ledgerPage >= ledgerTotalPages}>»</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Caja por día */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">
            Historial de Caja por día (últimos 30 días)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-12 text-xs text-muted-foreground px-3 py-2 border-b">
              <div className="col-span-3">Fecha</div>
              <div className="col-span-2 text-right">Ventas</div>
              <div className="col-span-2 text-right">Ingresos</div>
              <div className="col-span-2 text-right">Egresos</div>
              <div className="col-span-2 text-right">Saldo calc.</div>
              <div className="col-span-1 text-center">Detalle</div>
            </div>

            {cashPaged.map((g) => {
              const t = dayTotals(g);
              return (
                <div
                  key={g.date}
                  className="grid grid-cols-12 items-center px-3 py-2 border-b hover:bg-accent/30 text-sm"
                >
                  <div className="col-span-3">
                    <div className="font-medium">{dayLabel(g.date)}</div>
                    <div className="text-[11px] text-muted-foreground">
                      Apertura: {moneyFmt.format(t.openAmt)}{" "}
                      {t.closeAmt ? `· Cierre contado: ${moneyFmt.format(t.closeAmt)}` : ""}
                    </div>
                  </div>
                  <div className="col-span-2 text-right tabular-nums">
                    {moneyFmt.format(t.sales)}
                  </div>
                  <div className="col-span-2 text-right tabular-nums">
                    {moneyFmt.format(t.income)}
                  </div>
                  <div className="col-span-2 text-right tabular-nums">
                    -{moneyFmt.format(t.expense)}
                  </div>
                  <div className="col-span-2 text-right tabular-nums">
                    {moneyFmt.format(t.saldoCalc)}
                  </div>
                  <div className="col-span-1 text-center">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => openCashDetail(g)}
                      title="Ver detalle del día"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {cashTotal === 0 && (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                {qDaily.isFetching ? "Cargando..." : "Aún no hay movimientos de caja registrados."}
              </div>
            )}

            {/* Paginador caja por día */}
            {cashTotal > 0 && (
              <div className="flex items-center justify-between px-3 py-2 border-t bg-background/70">
                <div className="text-xs text-muted-foreground">
                  {`Mostrando ${cashRangeFrom}–${cashRangeTo} de ${cashTotal}`}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setCashPage(1)} disabled={cashPage <= 1}>«</Button>
                  <Button size="sm" variant="outline" onClick={() => setCashPage((p) => Math.max(1, p - 1))} disabled={cashPage <= 1}>Anterior</Button>
                  <span className="text-sm tabular-nums">{cashPage} / {cashTotalPages}</span>
                  <Button size="sm" variant="outline" onClick={() => setCashPage((p) => Math.min(cashTotalPages, p + 1))} disabled={cashPage >= cashTotalPages}>Siguiente</Button>
                  <Button size="sm" variant="outline" onClick={() => setCashPage(cashTotalPages)} disabled={cashPage >= cashTotalPages}>»</Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cobranzas (Clientes + Caja) */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Cobranzas (Clientes + Caja)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros rápidos */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => { setCFrom(sevenDaysYMD); setCTo(todayYMD); }}>
                Últimos 7 días
              </Button>
              <Button variant="secondary" onClick={() => { setCFrom(thirtyDaysYMD); setCTo(todayYMD); }}>
                Últimos 30 días
              </Button>
              <Button variant="secondary" onClick={() => { setCFrom(oneYearYMD); setCTo(todayYMD); }}>
                Último año
              </Button>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Input type="date" value={cFrom} onChange={(e) => setCFrom(e.target.value)} aria-label="Desde" />
              <span className="text-muted-foreground">→</span>
              <Input type="date" value={cTo} onChange={(e) => setCTo(e.target.value)} aria-label="Hasta" />
            </div>
          </div>

          {/* Filtro por origen + resumen */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 md:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Origen:</span>
              <Button size="sm" className="rounded-full" variant={origin === "ALL" ? "default" : "outline"} onClick={() => setOrigin("ALL")}>Todos</Button>
              <Button size="sm" className="rounded-full" variant={origin === "CAJA" ? "default" : "outline"} onClick={() => setOrigin("CAJA")}>Caja</Button>
              <Button size="sm" className="rounded-full" variant={origin === "CLIENTES" ? "default" : "outline"} onClick={() => setOrigin("CLIENTES")}>Clientes</Button>
            </div>

            <div className="text-sm text-muted-foreground">
              Cobranzas filtradas: <span className="font-medium text-foreground">{collTotal}</span>{" "}
              · <span className="font-medium text-foreground">{originLabel}</span>{" "}
              · Total del filtro: <span className="font-semibold text-foreground">{moneyFmt.format(totalsFiltered.TOTAL)}</span>
            </div>
          </div>

          {/* Totales por medio de pago */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {["EFECTIVO", "TRANSFERENCIA", "DEBITO", "CREDITO", "TOTAL"].map((k) => (
              <Card key={k} className="shadow-sm">
                <CardHeader className="py-2">
                  <CardTitle className="text-xs text-muted-foreground">{k}</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold tabular-nums">
                  {qCollections.isLoading ? "…" : moneyFmt.format((totalsFiltered as any)[k] ?? 0)}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detalle (paginado a 10) */}
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
                  <tr className="border-b [&>th]:px-3 [&>th]:py-2">
                    <th className="text-left">Fecha</th>
                    <th className="text-left">Origen</th>
                    <th className="text-left">Cliente</th>
                    <th className="text-left">Medio</th>
                    <th className="text-left">Detalle</th>
                    <th className="text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="[&>tr:nth-child(even)]:bg-muted/20">
                  {qCollections.isFetching && (
                    <tr><td colSpan={6} className="px-3 py-4">Cargando…</td></tr>
                  )}
                  {!qCollections.isFetching && cobranzasPaged.length === 0 && (
                    <tr><td colSpan={6} className="px-3 py-4">Sin cobranzas para {originLabel.toLowerCase()} en el rango seleccionado.</td></tr>
                  )}
                  {cobranzasPaged.map((it) => {
                    const rowOrigin = originOf(it);
                    const name = rowOrigin === "CAJA" ? "Consumidor Final" : resolveCustomerForRow(it);
                    const medium = displayMediumFor(it);
                    const descFixed = fixDescription((it as any).description);
                    const when = (it as any).date;
                    return (
                      <tr
                        key={`${(it as any).source || "row"}-${(it as any).id || shortId((it as any).description)}`}
                        className="border-b last:border-b-0 [&>td]:px-3 [&>td]:py-2"
                      >
                        <td>{when ? new Date(when).toLocaleString("es-AR", { hour12: false }) : "—"}</td>
                        <td>{rowOrigin}</td>
                        <td>{name}</td>
                        <td>{medium}</td>
                        <td className="truncate max-w-[360px]">{descFixed}</td>
                        <td className="text-right tabular-nums">{moneyFmt.format(Number((it as any).amount || 0))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginador cobranzas */}
            <div className="flex items-center justify-between px-3 py-2 border-t bg-background/70">
              <div className="text-xs text-muted-foreground">
                {collTotal ? `Mostrando ${collRangeFrom}–${collRangeTo} de ${collTotal}` : "Sin resultados"}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setCollPage(1)} disabled={collPage <= 1}>«</Button>
                <Button size="sm" variant="outline" onClick={() => setCollPage((p) => Math.max(1, p - 1))} disabled={collPage <= 1}>Anterior</Button>
                <span className="text-sm tabular-nums">{collPage} / {collTotalPages}</span>
                <Button size="sm" variant="outline" onClick={() => setCollPage((p) => Math.min(collTotalPages, p + 1))} disabled={collPage >= collTotalPages}>Siguiente</Button>
                <Button size="sm" variant="outline" onClick={() => setCollPage(collTotalPages)} disabled={collPage >= collTotalPages}>»</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalle del día */}
      <CashDayDetailModal
        open={cashDetailOpen}
        onOpenChange={setCashDetailOpen}
        dateLabel={cashDetailDay ? dayLabel(cashDetailDay.date) : ""}
        movements={(cashDetailDay as any)?.details
          ? (cashDetailDay as any).details.map((m: any) => ({
              id: m.id,
              type: m.type as MovementKind,
              amount: Number(m.amount || 0),
              description: m.description,
              createdAt: m.createdAt,
              occurredAt: m.occurredAt,
              saleId: m.saleId,
              customerName: m.customerName,
            }))
          : []}
      />
    </div>
  );
};

type StatsCardProps = {
  title: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  variant?: "default" | "success" | "destructive";
};

function StatsCard({ title, value, icon: Icon, variant = "default" }: StatsCardProps) {
  const tone =
    variant === "success"
      ? "text-emerald-600"
      : variant === "destructive"
      ? "text-red-600"
      : "text-primary";

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <Icon className={cn("w-6 h-6", tone)} />
      </CardContent>
    </Card>
  );
}
