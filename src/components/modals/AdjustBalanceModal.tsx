import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
// si tenés el componente de shadcn:
import { Textarea } from "@/components/ui/textarea";

type ClientLite = {
  id: string;
  name: string;
  balance?: number | null;
};

export interface AdjustBalanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientLite | null;
  onConfirm: (args: { id: string; amount: number; reason?: string }) => Promise<void> | void;
}

type ActionKind = "payment" | "debt"; // payment = + , debt = -

const REASON_MAX = 140;

// Sanitiza el monto: solo dígitos y UN separador ('.' o ',')
const sanitizeAmount = (s: string) => {
  let v = s.replace(/[^\d.,]/g, "");
  const sepIdx = v.search(/[.,]/);
  if (sepIdx !== -1) {
    const head = v.slice(0, sepIdx + 1);
    const tail = v.slice(sepIdx + 1).replace(/[.,]/g, "");
    v = head + tail;
  }
  return v;
};

export default function AdjustBalanceModal({
  open,
  onOpenChange,
  client,
  onConfirm,
}: AdjustBalanceModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<ActionKind>("payment");

  useEffect(() => {
    if (!open) {
      setAmount("");
      setReason("");
      setLoading(false);
      setAction("payment");
    }
  }, [open]);

  // El usuario ingresa SIEMPRE un monto positivo (lo sanitizamos y normalizamos)
  const parsedAbsAmount = useMemo(() => {
    const raw = (amount || "").replace(",", ".");
    const n = Number(raw);
    if (!Number.isFinite(n)) return NaN;
    return Math.abs(n);
  }, [amount]);

  // Mapeo: pago = +, deuda = -
  const signedAmount = useMemo(() => {
    if (Number.isNaN(parsedAbsAmount)) return NaN;
    return action === "payment" ? +parsedAbsAmount : -parsedAbsAmount;
  }, [parsedAbsAmount, action]);

  const canSubmit = useMemo(() => {
    return !loading && !Number.isNaN(parsedAbsAmount) && parsedAbsAmount > 0;
  }, [loading, parsedAbsAmount]);

  const currentBalance = Number(client?.balance ?? 0);
  const resultingBalance = useMemo(() => {
    if (Number.isNaN(signedAmount)) return currentBalance;
    return currentBalance + signedAmount;
  }, [currentBalance, signedAmount]);

  const balanceBadge = (value: number) => {
    if (value > 0) return <Badge className="bg-success/10 text-success border-success/20">+${value.toFixed(2)}</Badge>;
    if (value < 0) return <Badge className="bg-destructive/10 text-destructive border-destructive/20">${value.toFixed(2)}</Badge>;
    return <Badge className="bg-muted/10 text-muted-foreground border-muted/20">$0.00</Badge>;
  };

  const handleApply = async () => {
    if (!client || !canSubmit) return;
    try {
      setLoading(true);
      await onConfirm({
        id: client.id,
        amount: signedAmount, // pago + / deuda -
        reason: reason.trim() ? reason.trim() : undefined,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (ev: React.KeyboardEvent) => {
    if (ev.key === "Enter" && canSubmit) {
      ev.preventDefault();
      handleApply();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* 👇 contenedor con altura máxima y scroll interno */}
      <DialogContent
        onKeyDown={onKeyDown}
        className="sm:max-w-md max-h-[85vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>Ajustar saldo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm">
            <p className="text-muted-foreground">Cliente</p>
            <p className="font-medium text-foreground">{client?.name ?? "-"}</p>
          </div>

          {/* Selector Pago | Deuda */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={action === "payment" ? "default" : "outline"}
              onClick={() => setAction("payment")}
            >
              Agregar pago
            </Button>
            <Button
              type="button"
              variant={action === "debt" ? "default" : "outline"}
              onClick={() => setAction("debt")}
            >
              Agregar deuda
            </Button>
          </div>

          {/* Saldos */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Saldo actual</p>
              <div className="mt-1">{balanceBadge(currentBalance)}</div>
            </div>
            <div>
              <p className="text-muted-foreground">
                Saldo resultante {action === "payment" ? "(con pago)" : "(con deuda)"}
              </p>
              <div className="mt-1">{balanceBadge(resultingBalance)}</div>
            </div>
          </div>

          {/* Formulario */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                inputMode="decimal"
                placeholder="Ingresá un monto (ej: 1500.50)"
                value={amount}
                onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
              />
              {amount && Number.isNaN(parsedAbsAmount) && (
                <p className="text-xs text-destructive mt-1">Ingresá un número válido.</p>
              )}
              {parsedAbsAmount === 0 && amount !== "" && (
                <p className="text-xs text-muted-foreground mt-1">El monto debe ser mayor que 0.</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Con <strong>Agregar pago</strong> el saldo <em>aumenta</em> (monto positivo). Con <strong>Agregar deuda</strong> el saldo <em>disminuye</em> (monto negativo).
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="reason">Motivo (opcional)</Label>
                <span className="text-xs text-muted-foreground">
                  {reason.length}/{REASON_MAX}
                </span>
              </div>

              {/* 👇 Textarea que respeta márgenes y hace wrap */}
              <Textarea
                id="reason"
                placeholder="Ej: pago en efectivo / ajuste manual"
                value={reason}
                maxLength={REASON_MAX}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[88px] resize-y break-words whitespace-pre-wrap"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleApply} disabled={!canSubmit}>
            {loading ? "Aplicando..." : "Aplicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
