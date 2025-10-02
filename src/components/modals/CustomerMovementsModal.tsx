import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CustomersAPI } from "@/services/customers.api";

type Movement = {
  id: string;
  type: "payment" | "debt" | "adjust";
  amount: number;
  reason?: string | null;
  createdAt: string | Date;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
  customerName: string | null;
}

const formatDate = (d: string | Date) => {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const amountBadge = (n: number) => {
  if (n > 0) return <Badge className="bg-success/10 text-success border-success/20">+${n.toFixed(2)}</Badge>;
  if (n < 0) return <Badge className="bg-destructive/10 text-destructive border-destructive/20">${n.toFixed(2)}</Badge>;
  return <Badge className="bg-muted/10 text-muted-foreground border-muted/20">$0.00</Badge>;
};

const typeLabel: Record<Movement["type"], string> = {
  payment: "Pago",
  debt: "Deuda",
  adjust: "Ajuste",
};

export default function CustomerMovementsModal({
  open,
  onOpenChange,
  customerId,
  customerName,
}: Props) {
  const enabled = open && !!customerId;

  const movementsQuery = useQuery({
    queryKey: ["customer-movements", customerId],
    queryFn: () => CustomersAPI.listMovements(customerId as string),
    enabled,
  });

  const rows: Movement[] = useMemo(() => {
    const arr = Array.isArray(movementsQuery.data) ? movementsQuery.data : [];
    return arr
      .slice()
      .sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());
  }, [movementsQuery.data]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Historial de {customerName ?? "cliente"}</DialogTitle>
        </DialogHeader>

        {movementsQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">Cargando historial…</div>
        ) : movementsQuery.isError ? (
          <div className="text-sm text-destructive">No se pudo cargar el historial.</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">Sin movimientos.</div>
        ) : (
          <div className="overflow-x-auto">
            {/* table-fixed para respetar anchos y permitir wrap */}
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground w-36">Fecha</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground w-28">Tipo</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground w-36">Monto</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-4 align-top text-sm text-muted-foreground">
                      {formatDate(m.createdAt)}
                    </td>
                    <td className="py-3 px-4 align-top text-sm">{typeLabel[m.type]}</td>
                    <td className="py-3 px-4 align-top">{amountBadge(Number(m.amount || 0))}</td>
                    <td className="py-3 px-4 align-top text-sm whitespace-pre-wrap break-words">
                      {m.reason?.trim() ? m.reason : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
