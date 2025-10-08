import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LedgerSummary({ balance, total, loading }: { balance: number; total: number; loading?: boolean }) {
  const fmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Card>
        <CardHeader><CardTitle>Saldo total de clientes</CardTitle></CardHeader>
        <CardContent className="text-2xl font-semibold tabular-nums">
          {loading ? "…" : fmt.format(balance)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Movimientos encontrados</CardTitle></CardHeader>
        <CardContent className="text-2xl font-semibold">{loading ? "…" : total}</CardContent>
      </Card>
    </div>
  );
}
