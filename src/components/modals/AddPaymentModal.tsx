import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CustomersAPI } from "@/services/customers.api";
import { toast } from "@/hooks/use-toast";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  customer?: { id: string; name: string } | null;
};

const RegisterPaymentModal: React.FC<Props> = ({ open, onOpenChange, customer }) => {
  const qc = useQueryClient();
  const [amount, setAmount] = React.useState<string>("");
  const [method, setMethod] = React.useState<"cash" | "debit" | "credit" | "transfer" | "">("");
  const [notes, setNotes] = React.useState<string>("");

  const reset = () => {
    setAmount("");
    setMethod("");
    setNotes("");
  };

  const mut = useMutation({
    mutationFn: async () => {
      if (!customer?.id) throw new Error("Falta cliente");
      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt <= 0) throw new Error("Monto inválido");
      if (!method) throw new Error("Seleccioná un medio de pago");
      return CustomersAPI.createPayment(customer.id, {
        amount: amt,
        method,
        notes: notes?.trim() || undefined,
      });
    },
    onSuccess: (res) => {
      toast({
        title: "Pago registrado",
        description: `Se acreditaron $${Number(res.amount).toFixed(2)} a ${customer?.name ?? "Cliente"}.`,
      });
      // refrescar balances de clientes y, si estás viendo movimientos, también:
      qc.invalidateQueries({ queryKey: ["customers"] });
      if (customer?.id) qc.invalidateQueries({ queryKey: ["customers", customer.id, "movements"] as any });
      reset();
      onOpenChange(false);
    },
    onError: (e: any) => {
      toast({
        title: "No se pudo registrar el pago",
        description: e?.message ?? "Intentá nuevamente",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Registrar pago {customer?.name ? `— ${customer.name}` : ""}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Monto</Label>
            <Input
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>

          <div className="grid gap-2">
            <Label>Método</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as any)}>
              <SelectTrigger><SelectValue placeholder="Seleccioná un medio" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="debit">Débito</SelectItem>
                <SelectItem value="credit">Crédito</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones del pago…"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }} disabled={mut.isPending}>
              Cancelar
            </Button>
            <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
              {mut.isPending ? "Guardando…" : "Registrar pago"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterPaymentModal;
