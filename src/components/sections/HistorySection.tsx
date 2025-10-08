// src/components/sections/HistorySection.tsx
import * as React from "react";
import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, RotateCcw, Banknote, Scale, History, Info } from "lucide-react";
import { LedgerAPI, type LedgerListResponse, type LedgerEntry } from "@/services/ledger.api";
import { CustomerPicker, type CustomerOption } from "@/components/common/CustomerPicker";
import { cn } from "@/lib/utils";

// ===== Helpers =====
const moneyFmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

function monthRangeISO(d = new Date()) {
  const y = d.getFullYear();
  const m = d.getMonth();
  const from = new Date(y, m, 1, 0, 0, 0, 0).toISOString();
  const to   = new Date(y, m + 1, 0, 23, 59, 59, 999).toISOString();
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

// Orden estable: fecha asc + id asc (para balance correcto)
function sortAsc(items: LedgerEntry[]) {
  return [...items].sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    if (da !== db) return da - db;
    return a.id.localeCompare(b.id);
  });
}

function oneMsBefore(iso: string) {
  const t = new Date(iso).getTime() - 1;
  return new Date(t).toISOString();
}

// === estilos para saldo (positivo = debe / negativo = a favor)
function saldoToneClasses(n: number) {
  if (n > 0) {
    // rojo suave + texto rojo
    return {
      text: "text-red-700 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/30",
      border: "border-red-200 dark:border-red-800",
      dot: "bg-red-500",
    };
  }
  if (n < 0) {
    // verde suave + texto verde
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

// ===== Componente =====
export const HistorySection: React.FC = () => {
  const { from, to } = useMemo(() => monthRangeISO(new Date()), []);
  const [customer, setCustomer] = React.useState<CustomerOption | null>(null);

  // === KPIs del mes (no requieren saldo inicial)
  const qOrders = useQuery<LedgerListResponse>({
    queryKey: ["ledger", "orders-month", { from, to, customerId: customer?.id ?? null }],
    queryFn: () => LedgerAPI.list({ from, to, type: "order", pageSize: 500, customerId: customer?.id || undefined }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const qPayments = useQuery<LedgerListResponse>({
    queryKey: ["ledger", "payments-month", { from, to, customerId: customer?.id ?? null }],
    queryFn: () => LedgerAPI.list({ from, to, type: "payment", pageSize: 500, customerId: customer?.id || undefined }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const qCN = useQuery<LedgerListResponse>({
    queryKey: ["ledger", "cn-month", { from, to, customerId: customer?.id ?? null }],
    queryFn: () => LedgerAPI.list({ from, to, type: "credit_note", pageSize: 500, customerId: customer?.id || undefined }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  // === Movimientos del período (para tabla y saldo corrido)
  const qPeriod = useQuery<LedgerListResponse>({
    queryKey: ["ledger", "period", { from, to, customerId: customer?.id ?? null }],
    queryFn: () => LedgerAPI.list({ from, to, pageSize: 1000, customerId: customer?.id || undefined }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  // === Saldo anterior al período (solo si hay cliente → saldo inicial correcto)
  const qOpening = useQuery<LedgerListResponse>({
    enabled: !!customer?.id,
    queryKey: ["ledger", "opening", { to, from, customerId: customer?.id ?? null }],
    queryFn: async () => {
      const toPrev = oneMsBefore(from);
      return LedgerAPI.list({ to: toPrev, pageSize: 1, customerId: customer?.id || undefined });
    },
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const ordersSum   = useMemo(() => sum(qOrders.data?.items.map(i => i.amount)), [qOrders.data]);
  const paymentsSum = useMemo(() => sum(qPayments.data?.items.map(i => i.amount)), [qPayments.data]);
  const cnSum       = useMemo(() => sum(qCN.data?.items.map(i => i.amount)), [qCN.data]);
  const netSum      = useMemo(() => ordersSum + paymentsSum + cnSum, [ordersSum, paymentsSum, cnSum]);
  const loadingKPIs = qOrders.isFetching || qPayments.isFetching || qCN.isFetching;

  // === Filas con Debe / Haber / Saldo ===
  const rows = useMemo(() => {
    const items = sortAsc(qPeriod.data?.items ?? []);
    const openingBalance = customer?.id ? Number(qOpening.data?.balance ?? 0) : 0;

    let running = openingBalance;
    return items.map((it) => {
      const amount = Number(it.amount);
      const debe  = amount > 0 ? amount : 0;
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

  return (
    <div className="space-y-6">
      {/* Header + Filtro por cliente */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <History className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Historial</h1>
            <p className="text-sm text-muted-foreground">
              KPIs y movimientos contables {customer ? `— Cliente: ${customer.name}` : "— General"}
            </p>
          </div>
        </div>
        <CustomerPicker value={customer} onChange={setCustomer} />
      </div>

      {/* Leyenda de colores */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
          Saldo Deudor (cliente debe)
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Saldo Acreedor (a favor del cliente)
        </span>
        <span className="inline-flex items-center gap-2">
          <Info className="w-3.5 h-3.5" />
          El color aplica al saldo corrida de la cuenta.
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Ventas (mes)"
          value={loadingKPIs ? "…" : moneyFmt.format(ordersSum)}
          icon={Landmark}
        />
        <StatsCard
          title="Pagos (mes)"
          value={loadingKPIs ? "…" : moneyFmt.format(paymentsSum)}
          icon={Banknote}
        />
        <StatsCard
          title="Notas de crédito (mes)"
          value={loadingKPIs ? "…" : moneyFmt.format(cnSum)}
          icon={RotateCcw}
        />
        <StatsCard
          title={`Balance neto (${customer ? "cliente" : "mes"})`}
          value={loadingKPIs ? "…" : moneyFmt.format(netSum)}
          icon={Scale}
          variant={netSum >= 0 ? "success" : "destructive"}
        />
      </div>

      {/* Tabla Debe / Haber / Saldo */}
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
                    <th className="text-left p-2">N°</th>
                    <th className="text-left p-2">Descripción</th>
                    <th className="text-right p-2">Debe</th>
                    <th className="text-right p-2">Haber</th>
                    <th className="text-right p-2">Saldo</th>
                  </tr>
                </thead>

                <tbody className="[&>tr:nth-child(even)]:bg-muted/20">
                  {/* Saldo inicial visible cuando hay cliente */}
                  {customer?.id && (
                    <tr className="border-b">
                      <td className="p-2 text-muted-foreground" colSpan={6}>
                        Saldo inicial al {new Date(from).toLocaleDateString()}
                      </td>
                      <td className="p-2 text-right">
                        {(() => {
                          const init = Number(qOpening.data?.balance ?? 0);
                          const tone = saldoToneClasses(init);
                          return (
                            <span
                              className={cn(
                                "inline-flex items-center justify-end gap-2 rounded-md px-2 py-1 tabular-nums font-semibold border",
                                tone.text, tone.bg, tone.border
                              )}
                              aria-label={init > 0 ? "Saldo deudor" : init < 0 ? "Saldo acreedor" : "Saldo cero"}
                              title={init > 0 ? "Saldo deudor" : init < 0 ? "Saldo acreedor" : "Saldo cero"}
                            >
                              <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
                              {moneyFmt.format(init)}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  )}

                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-muted-foreground">
                        {qPeriod.isFetching ? "Cargando..." : "Sin movimientos en el período"}
                      </td>
                    </tr>
                  )}

                  {rows.map((r) => {
                    const tone = saldoToneClasses(r.saldo);
                    return (
                      <tr key={r.id} className="border-b last:border-b-0">
                        <td className="p-2 align-middle whitespace-nowrap">
                          {new Date(r.date).toLocaleString()}
                        </td>
                        <td className="p-2 align-middle">{typeLabel(r.type)}</td>
                        <td className="p-2 align-middle font-mono">{shortId(r.sourceId)}</td>
                        <td className="p-2 align-middle">
                          <span className="text-muted-foreground">{r.description ?? "—"}</span>
                        </td>
                        <td className={cn("p-2 align-middle text-right tabular-nums", r.debe ? "text-foreground" : "text-muted-foreground")}>
                          {r.debe ? moneyFmt.format(r.debe) : "—"}
                        </td>
                        <td className={cn("p-2 align-middle text-right tabular-nums", r.haber ? "text-foreground" : "text-muted-foreground")}>
                          {r.haber ? moneyFmt.format(r.haber) : "—"}
                        </td>
                        <td className="p-2 align-middle text-right">
                          <span
                            className={cn(
                              "inline-flex items-center justify-end gap-2 rounded-md px-2 py-1 tabular-nums font-semibold border",
                              tone.text, tone.bg, tone.border
                            )}
                            aria-label={r.saldo > 0 ? "Saldo deudor" : r.saldo < 0 ? "Saldo acreedor" : "Saldo cero"}
                            title={r.saldo > 0 ? "Saldo deudor" : r.saldo < 0 ? "Saldo acreedor" : "Saldo cero"}
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
                            {moneyFmt.format(r.saldo)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ===== StatsCard (inline) =====
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
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <Icon className={cn("w-6 h-6", tone)} />
      </CardContent>
    </Card>
  );
}
