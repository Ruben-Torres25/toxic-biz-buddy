// src/components/modals/ViewOrderModal.tsx
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { OrderDTO as Order } from "@/types/domain";
import { CheckCircle, Clock, XCircle, Copy, RotateCcw } from "lucide-react";
import CreateCreditNoteModal from "@/components/modals/CreateCreditNoteModal";
import { toast } from "@/hooks/use-toast";
import { OrdersAPI } from "@/services/orders.api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onSoftRefresh?: (orderId: string) => Promise<void> | void;
};

const IVA_RATE = 0.21;
const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const moneyFmt =
  typeof Intl !== "undefined"
    ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 })
    : { format: (n: number) => `$${Number(n ?? 0).toFixed(2)}` };
const fmtMoney = (n: any) => moneyFmt.format(Number(n ?? 0));

const formatDateTimeDMY = (d: string | Date) => {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

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
    case "partially_returned":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Devolución parcial</Badge>;
    case "returned":
      return <Badge className="bg-muted text-foreground border-muted-foreground/20">Devuelto</Badge>;
    default:
      return <Badge variant="outline">{status ?? "—"}</Badge>;
  }
};

const remainingReturnableQty = (order?: Order | null) => {
  const items = Array.isArray((order as any)?.items) ? (order as any).items : [];
  return items.reduce((acc: number, it: any) => {
    const sold = Number(it?.quantity ?? 0);
    const ret = Number(it?.returnedQty ?? 0);
    return acc + Math.max(0, sold - ret);
  }, 0);
};

export const ViewOrderModal: React.FC<Props> = ({ open, onOpenChange, order, onSoftRefresh }) => {
  const [creditOpen, setCreditOpen] = React.useState(false);
  const didInitialRefresh = React.useRef(false);

  const [currentOrder, setCurrentOrder] = React.useState<Order | null>(order ?? null);

  // sincroniza con la prop
  React.useEffect(() => {
    setCurrentOrder(order ?? null);
  }, [order]);

  const orderId = currentOrder?.id ?? order?.id ?? null;

  const softRefresh = React.useCallback(
    async (id?: string | null) => {
      const targetId = id ?? orderId;
      if (!targetId) return;
      try {
        const fresh = await OrdersAPI.getById(targetId);
        if (fresh) setCurrentOrder(fresh);
      } catch {}
      try {
        await onSoftRefresh?.(targetId);
      } catch {}
    },
    [orderId, onSoftRefresh]
  );

  // si cambia el pedido mientras el modal está abierto, forzamos un nuevo refresh
  React.useEffect(() => {
    if (open) {
      didInitialRefresh.current = false;
      if (orderId) softRefresh(orderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  React.useEffect(() => {
    if (!open) {
      didInitialRefresh.current = false;
      return;
    }
    if (open && !creditOpen && !didInitialRefresh.current) {
      didInitialRefresh.current = true;
      softRefresh(orderId);
    }
  }, [open, creditOpen, softRefresh, orderId]);

  const customer =
    (currentOrder?.customer && typeof currentOrder.customer === "object" && currentOrder.customer) || null;

  const created =
    (currentOrder?.createdAt && formatDateTimeDMY(currentOrder.createdAt as any)) || "—";

  const items = Array.isArray((currentOrder as any)?.items) ? (currentOrder as any).items : [];

  const rows = items.map((it: any) => {
    const unitPrice = Number(it.unitPrice ?? 0);
    const qty = Number(it.quantity ?? 0);
    const discount = Number(it.discount ?? 0); // prorrateado (ítem + global) desde backend
    const base = unitPrice * qty;
    const net = r2(base - discount);
    const iva = r2(net * IVA_RATE);
    const gross = r2(net + iva);
    return { it, unitPrice, qty, base, discount, net, iva, gross };
  });

  // ==== Totales y separación ítem vs condición de venta ====
  const brutoSinIVA = r2(rows.reduce((a, x) => a + x.base, 0));
  const descuentosTotal = r2(rows.reduce((a, x) => a + x.discount, 0));

  // Tomamos metadata si existe
  const metaPct = Number((currentOrder as any)?.globalDiscountPercent);
  const metaAmt = Number((currentOrder as any)?.globalDiscountAmount);
  const metaBase = Number((currentOrder as any)?.globalDiscountBase);

  let condicionVentaMonto = 0;
  if (Number.isFinite(metaAmt) && metaAmt > 0) {
    condicionVentaMonto = r2(metaAmt);
  } else if (Number.isFinite(metaPct) && Number.isFinite(metaBase) && metaPct > 0 && metaBase > 0) {
    condicionVentaMonto = r2(metaBase * (metaPct / 100));
  } else if (Number.isFinite(metaPct) && metaPct > 0) {
    // Último recurso: si sólo tenemos %, asumimos que todo lo descontado es global.
    condicionVentaMonto = descuentosTotal;
  } else {
    condicionVentaMonto = 0;
  }

  const descuentosPorItem = Math.max(0, r2(descuentosTotal - condicionVentaMonto));

  const condPctToShow = Number.isFinite(metaPct) && metaPct >= 0 ? r2(metaPct) : (
    brutoSinIVA > 0 ? r2((condicionVentaMonto / brutoSinIVA) * 100) : 0
  );

  const subtotalSinIVA = r2(brutoSinIVA - descuentosPorItem - condicionVentaMonto);
  const ivaTotal = r2(subtotalSinIVA * IVA_RATE);
  const totalConIVA = r2(subtotalSinIVA + ivaTotal);

  const displayedTotal = totalConIVA;

  const canOpenCredit =
    !!currentOrder &&
    currentOrder.status !== "canceled" &&
    currentOrder.status !== "returned" &&
    (currentOrder.status === "confirmed" || currentOrder.status === "partially_returned") &&
    remainingReturnableQty(currentOrder) > 0;

  const copySummary = async () => {
    try {
      const lines = [
        `Pedido: ${currentOrder?.code ?? currentOrder?.id ?? "—"}`,
        `Fecha: ${created}`,
        customer?.name ? `Cliente: ${customer.name}` : null,
        customer?.email ? `Email: ${customer.email}` : null,
        customer?.phone ? `Tel.: ${customer.phone}` : null,
        "",
        `Bruto (s/IVA): ${fmtMoney(brutoSinIVA)}`,
        `Descuentos por ítem: ${fmtMoney(descuentosPorItem)}`,
        `Condición de venta (${condPctToShow}%): - ${fmtMoney(condicionVentaMonto)}`,
        `Subtotal (s/IVA): ${fmtMoney(subtotalSinIVA)}`,
        `IVA (21%): ${fmtMoney(ivaTotal)}`,
        `Total (c/IVA): ${fmtMoney(displayedTotal)}`,
      ].filter(Boolean);
      await navigator.clipboard?.writeText(lines.join("\n"));
      toast({ title: "Resumen copiado" });
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Contenedor flexible: header y footer fijos, contenido scrolleable */}
      <DialogContent
        aria-describedby={undefined}
        className="w-[98vw] sm:max-w-5xl lg:max-w-6xl p-0 h-[92vh] max-h-[92vh] flex flex-col"
      >
        {/* Header fijo */}
        <div className="border-b px-4 sm:px-6 py-4">
          <DialogHeader className="p-0">
            <DialogTitle className="tracking-tight">
              Pedido {currentOrder?.code ?? currentOrder?.id ?? "—"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Resumen del pedido con items, impuestos y totales.
            </DialogDescription>
            <div className="mt-2 flex items-center justify-end gap-2">
              {canOpenCredit && (
                <Button variant="outline" size="sm" onClick={() => setCreditOpen(true)} title="Generar Nota de Crédito">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Devolver / NC
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={copySummary} title="Copiar resumen">
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </Button>
            </div>
          </DialogHeader>
        </div>

        {/* Contenido scrolleable */}
        <div className="px-4 sm:px-6 py-4 flex-1 min-h-0 flex flex-col">
          <ScrollArea className="h-full">
            <div className="space-y-4 pr-1">
              {/* Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Estado</div>
                  <div className="mt-1"><StatusBadge status={currentOrder?.status} /></div>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground">Fecha</div>
                  <div className="mt-1 text-foreground tabular-nums">{created}</div>
                </div>

                <div className="rounded-lg border p-3 col-span-2 md:col-span-1">
                  <div className="text-xs text-muted-foreground">Cliente</div>
                  <div className="mt-1 text-foreground truncate" title={customer?.name ?? "Sin cliente"}>
                    {customer?.name ?? "Sin cliente"}
                  </div>
                  {(customer?.email || customer?.phone) && (
                    <div className="mt-1 text-[12px] text-muted-foreground space-y-0.5">
                      {customer?.email && <div className="truncate" title={customer.email}>{customer.email}</div>}
                      {customer?.phone && <div className="truncate" title={customer.phone}>{customer.phone}</div>}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border p-3 bg-muted/40">
                  <div className="text-xs text-muted-foreground">Total (c/IVA)</div>
                  <div className="mt-1 font-semibold text-foreground tabular-nums">{fmtMoney(displayedTotal)}</div>
                </div>
              </div>

              {/* Tabla de ítems */}
              <div className="rounded-lg border">
                <div className="p-3 border-b">
                  <div className="font-medium">Ítems</div>
                  <div className="text-xs text-muted-foreground">
                    {rows.length} {rows.length === 1 ? "item" : "items"}
                  </div>
                </div>

                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                      <tr className="border-b">
                        <th className="text-left  p-2 text-muted-foreground font-medium">Producto</th>
                        <th className="text-right p-2 text-muted-foreground font-medium">Precio (s/IVA)</th>
                        <th className="text-center p-2 text-muted-foreground font-medium">Cant.</th>
                        <th className="text-right p-2 text-muted-foreground font-medium">Desc. (%)</th>
                        <th className="text-right p-2 text-muted-foreground font-medium">Desc. ($)</th>
                        <th className="text-right p-2 text-muted-foreground font-medium">Subt. (s/IVA)</th>
                        <th className="text-right p-2 text-muted-foreground font-medium">IVA</th>
                        <th className="text-right p-2 text-muted-foreground font-medium">Total (c/IVA)</th>
                      </tr>
                    </thead>
                    <tbody className="[&>tr:nth-child(even)]:bg-muted/20">
                      {rows.length === 0 && (
                        <tr>
                          <td className="p-4 text-center text-muted-foreground" colSpan={8}>
                            Sin ítems
                          </td>
                        </tr>
                      )}
                      {rows.map(({ it, unitPrice, qty, base, discount, net, iva, gross }: any) => {
                        const discPct = base > 0 ? (discount / base) * 100 : 0;
                        return (
                          <tr key={it.id} className="border-b last:border-b-0">
                            <td className="p-2 align-middle">{it.productName ?? it.product?.name ?? "—"}</td>
                            <td className="p-2 align-middle text-right tabular-nums">{fmtMoney(unitPrice)}</td>
                            <td className="p-2 align-middle text-center tabular-nums">{qty}</td>
                            <td className="p-2 align-middle text-right tabular-nums">
                              {discPct > 0 ? `${discPct.toFixed(2)}%` : <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="p-2 align-middle text-right tabular-nums">
                              {discount > 0 ? fmtMoney(discount) : <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="p-2 align-middle text-right tabular-nums">{fmtMoney(net)}</td>
                            <td className="p-2 align-middle text-right tabular-nums">{fmtMoney(iva)}</td>
                            <td className="p-2 align-middle text-right font-medium tabular-nums">{fmtMoney(gross)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Totales */}
                <div className="p-3 border-t">
                  <div className="flex justify-end">
                    <div className="w-full sm:w-[460px] space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Bruto (s/IVA)</span>
                        <span className="tabular-nums">{fmtMoney(brutoSinIVA)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Descuentos por ítem</span>
                        <span className="text-destructive tabular-nums">- {fmtMoney(descuentosPorItem)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Condición de venta ({condPctToShow.toFixed(0)}%)</span>
                        <span className="text-destructive tabular-nums">- {fmtMoney(condicionVentaMonto)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal (s/IVA)</span>
                        <span className="tabular-nums">{fmtMoney(subtotalSinIVA)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">IVA (21%)</span>
                        <span className="tabular-nums">{fmtMoney(ivaTotal)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t mt-2">
                        <span className="font-semibold">Total (c/IVA)</span>
                        <span className="font-semibold tabular-nums">{fmtMoney(displayedTotal)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {(currentOrder as any)?.notes && (
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground mb-1">Notas</div>
                  <div className="whitespace-pre-wrap text-sm">{(currentOrder as any).notes}</div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer fijo */}
        <div className="border-t px-4 sm:px-6 py-3 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>

      {/* Modal de Nota de Crédito */}
      {currentOrder && (
        <CreateCreditNoteModal
          open={creditOpen}
          onOpenChange={(o) => {
            setCreditOpen(o);
            if (!o && currentOrder?.id) softRefresh(currentOrder.id);
          }}
          order={currentOrder}
          onCreated={async (id) => {
            toast({ title: "Nota de crédito generada", description: `ID: ${id}` });
            if (currentOrder?.id) await softRefresh(currentOrder.id);
            setTimeout(() => {
              if (currentOrder?.id) softRefresh(currentOrder.id);
            }, 1200);
          }}
        />
      )}
    </Dialog>
  );
};

export default ViewOrderModal;
