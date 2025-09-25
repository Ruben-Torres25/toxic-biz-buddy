import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderDTO as Order } from "@/types/domain";
import { CheckCircle, Clock, XCircle } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
};

const fmtMoney = (n: any) => `$${Number(n ?? 0).toFixed(2)}`;

const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  switch (status) {
    case "confirmed":
    case "completado":
    case "delivered":
      return (
        <Badge className="bg-success/10 text-success border-success/20">
          <CheckCircle className="w-3 h-3 mr-1" />
          Confirmado
        </Badge>
      );
    case "pending":
    case "pendiente":
      return (
        <Badge className="bg-warning/10 text-warning border-warning/20">
          <Clock className="w-3 h-3 mr-1" />
          Pendiente
        </Badge>
      );
    case "canceled":
    case "cancelado":
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
          <XCircle className="w-3 h-3 mr-1" />
          Cancelado
        </Badge>
      );
    default:
      return <Badge variant="outline">{status ?? "—"}</Badge>;
  }
};

export const ViewOrderModal: React.FC<Props> = ({ open, onOpenChange, order }) => {
  const customer =
    (order?.customer && typeof order.customer === "object" && order.customer) || null;

  const created =
    (order?.createdAt && new Date(order.createdAt as any).toLocaleString()) || "—";

  const items = Array.isArray((order as any)?.items) ? (order as any).items : [];

  const subtotal = items.reduce(
    (acc: number, it: any) => acc + Number(it.unitPrice ?? 0) * Number(it.quantity ?? 0),
    0
  );
  const discountSum = items.reduce((acc: number, it: any) => acc + Number(it.discount ?? 0), 0);
  const total = Number(order?.total ?? subtotal - discountSum);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Pedido {order?.code ?? order?.id ?? "—"}
          </DialogTitle>
          {/* Evita el warning de accesibilidad de Radix */}
          <DialogDescription>Resumen del pedido seleccionado</DialogDescription>
        </DialogHeader>

        {/* Datos principales */}
        <div className="grid gap-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Estado</div>
              <div className="mt-1">
                <StatusBadge status={order?.status} />
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Fecha</div>
              <div className="mt-1 text-foreground">{created}</div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Cliente</div>
              <div className="mt-1 text-foreground">
                {customer?.name ?? "Sin cliente"}
              </div>
              {(customer?.email || customer?.phone) && (
                <div className="mt-1 text-sm text-muted-foreground">
                  {customer?.email && <div>{customer.email}</div>}
                  {customer?.phone && <div>{customer.phone}</div>}
                </div>
              )}
            </div>

            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Total</div>
              <div className="mt-1 font-semibold text-foreground">
                {fmtMoney(total)}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="rounded-lg border">
            <div className="p-3 border-b">
              <div className="font-medium">Ítems</div>
              <div className="text-xs text-muted-foreground">
                {items.length} {items.length === 1 ? "ítem" : "ítems"}
              </div>
            </div>
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-muted-foreground font-medium">Producto</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">Precio</th>
                    <th className="text-center p-2 text-muted-foreground font-medium">Cant.</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">Desc.</th>
                    <th className="text-right p-2 text-muted-foreground font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr>
                      <td className="p-4 text-center text-muted-foreground" colSpan={5}>
                        Sin ítems
                      </td>
                    </tr>
                  )}
                  {items.map((it: any) => {
                    const unitPrice = Number(it.unitPrice ?? 0);
                    const qty = Number(it.quantity ?? 0);
                    const discount = Number(it.discount ?? 0);
                    const line = unitPrice * qty - discount;

                    return (
                      <tr key={it.id} className="border-b last:border-b-0">
                        <td className="p-2">{it.productName ?? it.product?.name ?? "—"}</td>
                        <td className="p-2 text-right">{fmtMoney(unitPrice)}</td>
                        <td className="p-2 text-center">{qty}</td>
                        <td className="p-2 text-right">
                          {discount > 0 ? `- ${fmtMoney(discount)}` : "—"}
                        </td>
                        <td className="p-2 text-right font-medium">{fmtMoney(line)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="p-3 border-t">
              <div className="flex justify-end">
                <div className="w-full sm:w-80 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{fmtMoney(subtotal)}</span>
                  </div>
                  {discountSum > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Descuentos</span>
                      <span className="text-destructive">- {fmtMoney(discountSum)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t mt-2">
                    <span className="font-semibold">Total</span>
                    <span className="font-semibold">{fmtMoney(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notas (si el back las devuelve) */}
          {(order as any)?.notes && (
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground mb-1">Notas</div>
              <div className="whitespace-pre-wrap text-sm">{(order as any).notes}</div>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewOrderModal;
