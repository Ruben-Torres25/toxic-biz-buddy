// src/components/modals/CashDayDetailModal.tsx
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MovementKind = "open" | "close" | "sale" | "income" | "expense";

export type CashMovement = {
  id: string;
  createdAt: string;
  occurredAt?: string | null;
  amount: number;
  type: MovementKind;
  description: string;
};

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

function totals(movs: CashMovement[]) {
  let openAmt = 0, closeAmt = 0, income = 0, expense = 0, sales = 0;
  for (const m of movs) {
    if (m.type === "open") openAmt = Number(m.amount || 0);
    else if (m.type === "close") closeAmt = Number(m.amount || 0);
    else if (m.type === "income") income += Number(m.amount || 0);
    else if (m.type === "expense") expense += Math.abs(Number(m.amount || 0));
    else if (m.type === "sale") sales += Number(m.amount || 0);
  }
  const saldoCalc = openAmt + income - expense + sales;
  return { openAmt, closeAmt, income, expense, sales, saldoCalc };
}

export function CashDayDetailModal({
  open,
  onOpenChange,
  dateLabel,
  movements,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateLabel: string;
  movements: CashMovement[];
}) {
  const sorted = React.useMemo(() => {
    return [...(movements || [])].sort((a, b) => {
      const ta = new Date((a.occurredAt || a.createdAt) ?? a.createdAt).getTime();
      const tb = new Date((b.occurredAt || b.createdAt) ?? b.createdAt).getTime();
      return ta - tb;
    });
  }, [movements]);

  const T = totals(sorted);

  const chip = (t: MovementKind) =>
    t === "open"
      ? <Badge variant="outline" className="border-blue-300 text-blue-700">Apertura</Badge>
      : t === "close"
      ? <Badge variant="outline" className="border-violet-300 text-violet-700">Cierre</Badge>
      : t === "sale"
      ? <Badge variant="outline" className="border-emerald-300 text-emerald-700">Venta</Badge>
      : t === "income"
      ? <Badge variant="outline" className="border-green-300 text-green-700">Ingreso</Badge>
      : <Badge variant="outline" className="border-red-300 text-red-700">Egreso</Badge>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:max-w-3xl p-0" aria-describedby={undefined}>
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Detalle de caja — {dateLabel}</DialogTitle>
        </DialogHeader>

        {/* Resumen del día */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card>
              <CardContent className="py-3">
                <div className="text-xs text-muted-foreground">Apertura</div>
                <div className="text-lg font-semibold tabular-nums">{money.format(T.openAmt)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <div className="text-xs text-muted-foreground">Ventas</div>
                <div className="text-lg font-semibold tabular-nums">{money.format(T.sales)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <div className="text-xs text-muted-foreground">Ingresos / Egresos</div>
                <div className="text-lg font-semibold tabular-nums">
                  {money.format(T.income)} <span className="text-muted-foreground">/</span> -{money.format(T.expense)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <Card>
              <CardContent className="py-3">
                <div className="text-xs text-muted-foreground">Saldo calculado</div>
                <div className="text-lg font-semibold tabular-nums">{money.format(T.saldoCalc)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <div className="text-xs text-muted-foreground">Cierre (contado)</div>
                <div className="text-lg font-semibold tabular-nums">{money.format(T.closeAmt)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-3">
                <div className="text-xs text-muted-foreground">Diferencia (contado - calc.)</div>
                <div className={cn(
                  "text-lg font-semibold tabular-nums",
                  (T.closeAmt - T.saldoCalc) === 0 ? "text-muted-foreground" :
                  (T.closeAmt - T.saldoCalc) > 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {money.format(T.closeAmt - T.saldoCalc)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lista cronológica */}
        <div className="px-6 pb-6">
          <div className="rounded-md border">
            <div className="grid grid-cols-12 text-xs text-muted-foreground px-3 py-2 border-b">
              <div className="col-span-2">Hora</div>
              <div className="col-span-2">Tipo</div>
              <div className="col-span-6">Descripción</div>
              <div className="col-span-2 text-right">Monto</div>
            </div>

            <ScrollArea className="max-h-[50vh]">
              {sorted.map((m) => {
                const d = new Date(m.occurredAt || m.createdAt);
                const hhmm = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const isExpense = m.type === "expense";
                return (
                  <div key={m.id} className="grid grid-cols-12 items-center px-3 py-2 border-b text-sm">
                    <div className="col-span-2 tabular-nums">{hhmm}</div>
                    <div className="col-span-2">{chip(m.type)}</div>
                    <div className="col-span-6 truncate">{m.description || "—"}</div>
                    <div className={cn("col-span-2 text-right tabular-nums font-medium",
                      isExpense ? "text-destructive" : "text-foreground"
                    )}>
                      {isExpense ? `- ${money.format(Math.abs(m.amount))}` : money.format(m.amount)}
                    </div>
                  </div>
                );
              })}
              {sorted.length === 0 && (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">Sin movimientos.</div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CashDayDetailModal;
