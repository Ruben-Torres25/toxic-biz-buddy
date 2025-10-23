import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/pages/StatsCard";
import { Landmark, RotateCcw, Banknote, Scale, History } from "lucide-react";
import { LedgerAPI, type LedgerListResponse } from "@/services/ledger.api";

const moneyFmt = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });

function monthRangeISO(d = new Date()) {
  const y = d.getFullYear();
  const m = d.getMonth();
  const from = new Date(y, m, 1, 0, 0, 0, 0).toISOString();
  const to   = new Date(y, m + 1, 0, 23, 59, 59, 999).toISOString();
  return { from, to };
}
const sum = (ls?: number[]) => (ls ?? []).reduce((a, b) => a + (Number.isFinite(b) ? Number(b) : 0), 0);

export default function HistorialDashboardPage() {
  const { from, to } = useMemo(() => monthRangeISO(new Date()), []);

  // Ventas (order = +)
  const qOrders = useQuery<LedgerListResponse>({
    queryKey: ["ledger", "orders-month", { from, to }],
    queryFn: () => LedgerAPI.list({ from, to, type: "order", pageSize: 500 }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
  // Pagos (payment = -)
  const qPayments = useQuery<LedgerListResponse>({
    queryKey: ["ledger", "payments-month", { from, to }],
    queryFn: () => LedgerAPI.list({ from, to, type: "payment", pageSize: 500 }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
  // Notas de crédito (credit_note = -)
  const qCN = useQuery<LedgerListResponse>({
    queryKey: ["ledger", "cn-month", { from, to }],
    queryFn: () => LedgerAPI.list({ from, to, type: "credit_note", pageSize: 500 }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  // Movimientos recientes (últimos 12, global)
  const qRecent = useQuery<LedgerListResponse>({
    queryKey: ["ledger", "recent"],
    queryFn: () => LedgerAPI.list({ page: 1, pageSize: 12 }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const ordersSum   = useMemo(() => sum(qOrders.data?.items.map(i => i.amount)), [qOrders.data]);
  const paymentsSum = useMemo(() => sum(qPayments.data?.items.map(i => i.amount)), [qPayments.data]);
  const cnSum       = useMemo(() => sum(qCN.data?.items.map(i => i.amount)), [qCN.data]);
  const netSum      = useMemo(() => ordersSum + paymentsSum + cnSum, [ordersSum, paymentsSum, cnSum]);

  const loadingKPIs = qOrders.isFetching || qPayments.isFetching || qCN.isFetching;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <History className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Historial</h1>
          <p className="text-sm text-muted-foreground">KPIs y movimientos contables</p>
        </div>
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
          title="Balance neto (mes)"
          value={loadingKPIs ? "…" : moneyFmt.format(netSum)}
          icon={Scale}
          variant={netSum >= 0 ? "success" : "destructive"}
        />
      </div>

      {/* Movimientos recientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary" />
            Movimientos recientes
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
                    <th className="text-left p-2">Documento</th>
                    <th className="text-left p-2">Descripción</th>
                    <th className="text-right p-2">Importe</th>
                  </tr>
                </thead>
                <tbody className="[&>tr:nth-child(even)]:bg-muted/20">
                  {(qRecent.data?.items ?? []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        {qRecent.isFetching ? "Cargando..." : "Sin movimientos"}
                      </td>
                    </tr>
                  )}
                  {(qRecent.data?.items ?? []).map((r) => (
                    <tr key={r.id} className="border-b last:border-b-0">
                      <td className="p-2 align-middle">{new Date(r.date).toLocaleString()}</td>
                      <td className="p-2 align-middle">
                        {r.type === "order" ? "Pedido" :
                         r.type === "payment" ? "Pago" :
                         r.type === "credit_note" ? "Nota de crédito" : "Ajuste"}
                      </td>
                      <td className="p-2 align-middle">{r.sourceType} #{r.sourceId.slice(0,8)}</td>
                      <td className="p-2 align-middle">
                        <span className="text-muted-foreground">{r.description ?? "—"}</span>
                      </td>
                      <td className="p-2 align-middle text-right tabular-nums">
                        {moneyFmt.format(Number(r.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
