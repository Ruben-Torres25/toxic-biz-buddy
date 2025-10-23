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

const PAGE_SIZE = 8;

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

  // ===== Ledger rows con debe/haber/saldo (ASC para calcular saldo), luego invertimos para mostrar recientes primero
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
      return {
        ...it,
        debe,
        haber,
        saldo: running,
      };
    });
  }, [qPeriod.data, qOpening.data, customer?.id]);

  // ===== Mostrar más recientes primero
  const rowsDesc = useMemo(() => [...rowsAsc].reverse(), [rowsAsc]);

  // ===== Paginar 8 filas (cliente-side) sobre orden DESC
  const [ledgerPage, setLedgerPage] = React.useState(1);
  useEffect(() => {
    setLedgerPage(1); // reset al cambiar cliente/dataset
  }, [customer?.id, rowsDesc.length]);

  const ledgerTotal = rowsDesc.length;
  const ledgerTotalPages = Math.max(1, Math.ceil(ledgerTotal / PAGE_SIZE));
  const ledgerStartIdx = (ledgerPage - 1) * PAGE_SIZE;
  const ledgerEndIdx = ledgerStartIdx + PAGE_SIZE;
  const ledgerPaged = rowsDesc.slice(ledgerStartIdx, ledgerEndIdx);
  const ledgerRangeFrom = ledgerTotal ? ledgerStartIdx + 1 : 0;
  const ledgerRangeTo = Math.min(ledgerTotal, ledgerEndIdx);

  // ===== Caja AGRUPADA POR DÍA (usa /cash/daily) → paginar a 8 y mostrar días recientes primero
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
    setCashPage(1); // reset al cambiar dataset
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

  const showCustomerCol = !customer?.id; // mostrar “Cliente” solo en GENERAL

  return (
    <div className="space-y-6">
      {/* Header + Filtro por cliente */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <History className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Historial</h1>
            <p className="text-sm text-muted-foreground">
              KPIs y movimientos contables{" "}
              {customer ? `— Cliente: ${customer.name}` : "— General"}
            </p>
          </div>
        </div>
        <CustomerPicker value={customer} onChange={setCustomer} />
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary" />
            {customer ? "Cuenta corriente del cliente" : "Movimientos recientes (general)"}
          </CardTitle>
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
                          {when ? new Date(when).toLocaleString("es-AR") : "—"}
                        </td>
                        <td className="p-2 align-middle">{typeLabel(r.type)}</td>
                        {showCustomerCol && (
                          <td className="p-2 align-middle">
                            {(r as any).customerName ?? "—"}
                          </td>
                        )}
                        <td className="p-2 align-middle font-mono">
                          {shortId(r.sourceId)}
                        </td>
                        <td className="p-2 align-middle">
                          <span className="text-muted-foreground">
                            {r.description ?? "—"}
                          </span>
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

            {/* Paginador (ledger, DESC) */}
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

      {/* Caja por día (usa /cash/daily) → DESC + 8 por página */}
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

            {/* Paginador (caja por día, DESC) */}
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

      {/* Modal de detalle del día: pasa g.details (si tu backend las expone) */}
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
    <Card>
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
