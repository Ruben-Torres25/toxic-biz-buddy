import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { money, number } from "@/utils/format";
import type { PaymentMethod } from "@/types/sales";
import { Button } from "@/components/ui/button";

type Props = {
  total: number;
  onSetPayment: (method: PaymentMethod, amount: number) => void;
  current: Partial<Record<PaymentMethod, number>>;
  onAutofill?: (method: PaymentMethod, value: number) => void;
};

export default function PaymentPanel({ total, onSetPayment, current, onAutofill }: Props) {
  const [cashGiven, setCashGiven] = useState<number>(0);
  const paid = useMemo(() => (current.cash || 0) + (current.debit || 0) + (current.credit || 0) + (current.transfer || 0), [current]);
  const pending = Math.max(0, total - paid);
  const change = Math.max(0, (cashGiven || 0) - Math.max(0, total - ((current.debit || 0) + (current.credit || 0) + (current.transfer || 0))));

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base">Pagos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="cash" className="w-full">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="cash">Efectivo</TabsTrigger>
            <TabsTrigger value="debit">Débito</TabsTrigger>
            <TabsTrigger value="credit">Crédito</TabsTrigger>
            <TabsTrigger value="transfer">Transferencia</TabsTrigger>
          </TabsList>

          <TabsContent value="cash" className="space-y-3 pt-3">
            <div>
              <Label>Entrega efectivo</Label>
              <Input type="number" step="0.01" value={cashGiven}
                onChange={(e) => { const v = Number(e.target.value || 0); setCashGiven(v); onSetPayment("cash", Math.max(0, v)); }}
                onFocus={(e) => e.currentTarget.select()} className="mt-1" />
              <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                <span>Pendiente: {money(pending)}</span>
                <span>Vuelto: <b>{money(change)}</b></span>
              </div>
            </div>
            <div className="flex gap-2">
              {[1000, 2000, 5000, 10000].map((d) => (
                <Button key={d} type="button" variant="outline" onClick={() => { const v = (cashGiven || 0) + d; setCashGiven(v); onSetPayment("cash", v); }}>
                  +{number(d)}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="debit" className="space-y-3 pt-3">
            <Label>Monto Débito</Label>
            <Input type="number" step="0.01" value={current.debit || 0}
              onChange={(e) => onSetPayment("debit", Number(e.target.value || 0))}
              onFocus={(e) => e.currentTarget.select()} />
            <Button type="button" variant="outline" onClick={() => onAutofill?.("debit", pending)}>Completar pendiente</Button>
          </TabsContent>

          <TabsContent value="credit" className="space-y-3 pt-3">
            <Label>Monto Crédito</Label>
            <Input type="number" step="0.01" value={current.credit || 0}
              onChange={(e) => onSetPayment("credit", Number(e.target.value || 0))}
              onFocus={(e) => e.currentTarget.select()} />
            <Button type="button" variant="outline" onClick={() => onAutofill?.("credit", pending)}>Completar pendiente</Button>
          </TabsContent>

          <TabsContent value="transfer" className="space-y-3 pt-3">
            <Label>Monto Transferencia</Label>
            <Input type="number" step="0.01" value={current.transfer || 0}
              onChange={(e) => onSetPayment("transfer", Number(e.target.value || 0))}
              onFocus={(e) => e.currentTarget.select()} />
            <Button type="button" variant="outline" onClick={() => onAutofill?.("transfer", pending)}>Completar pendiente</Button>
          </TabsContent>
        </Tabs>

        <div className="border rounded-md p-3 text-sm">
          <div className="flex items-center justify-between"><span>Total a pagar</span><b>{money(total)}</b></div>
          <div className="flex items-center justify-between text-muted-foreground"><span>Pagado</span><span>{money(paid)}</span></div>
          <div className="flex items-center justify-between"><span>Pendiente</span><b>{money(Math.max(0, pending))}</b></div>
        </div>
      </CardContent>
    </Card>
  );
}
