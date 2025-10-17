import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SalesAPI, type SaleDetail } from "@/services/sales.api";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: string | null; // <- importante para cargar
};

const moneyFmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

export const SaleDetailModal: React.FC<Props> = ({ open, onOpenChange, saleId }) => {
  const q = useQuery({
    enabled: open && !!saleId,
    queryKey: ["sale-detail", saleId],
    queryFn: () => SalesAPI.getById(saleId!),
    staleTime: 30_000,
  });

  const sale: SaleDetail | undefined = q.data;
  const loading = q.isFetching;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] sm:max-w-3xl p-0" aria-describedby={undefined}>
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Detalle de venta</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-4 text-sm">
          {loading && <div className="text-muted-foreground">Cargando…</div>}
          {!loading && !sale && (
            <div className="text-destructive">No se pudo cargar la venta.</div>
          )}

          {!loading && sale && (
            <>
              {/* Encabezado */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <div className="text-muted-foreground text-xs">N°</div>
                  <div className="font-medium">{sale.number || sale.id}</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground text-xs">Fecha</div>
                  <div>{new Date(sale.createdAt).toLocaleString()}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-muted-foreground text-xs">Cliente</div>
                  <div>{sale.customerName || "Consumidor final"}</div>
                </div>
              </div>

              {/* Pagos */}
              <div className="rounded-md border mb-4">
                <div className="px-3 py-2 border-b text-xs text-muted-foreground">Pagos</div>
                <div className="px-3 py-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                  {sale.payments.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="uppercase text-muted-foreground">{p.method}</span>
                      <span className="font-medium tabular-nums">{moneyFmt.format(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items */}
              <div className="rounded-md border">
                <div className="px-3 py-2 border-b text-xs text-muted-foreground">
                  Productos vendidos
                </div>
                <ScrollArea className="max-h-[45vh]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/40 backdrop-blur z-10">
                      <tr className="border-b">
                        <th className="text-left p-2 w-[18%]">SKU</th>
                        <th className="text-left p-2">Producto</th>
                        <th className="text-right p-2 w-[10%]">Cant.</th>
                        <th className="text-right p-2 w-[14%]">P. unit.</th>
                        <th className="text-right p-2 w-[14%]">Desc.</th>
                        <th className="text-right p-2 w-[14%]">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sale.items.map((it, i) => {
                        const lineSubtotal = Number(it.qty) * Number(it.price || 0);
                        const disc = Number(it.discount || 0) * Number(it.qty || 0);
                        const lineTotal = lineSubtotal - disc;
                        return (
                          <tr key={i} className="border-b">
                            <td className="p-2 align-middle font-mono">{it.sku || "—"}</td>
                            <td className="p-2 align-middle">{it.name}</td>
                            <td className="p-2 align-middle text-right tabular-nums">{it.qty}</td>
                            <td className="p-2 align-middle text-right tabular-nums">{moneyFmt.format(it.price)}</td>
                            <td className={cn("p-2 align-middle text-right tabular-nums", disc ? "text-foreground" : "text-muted-foreground")}>
                              {disc ? `-${moneyFmt.format(disc)}` : "—"}
                            </td>
                            <td className="p-2 align-middle text-right tabular-nums font-medium">
                              {moneyFmt.format(lineTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </ScrollArea>

                {/* Totales */}
                <div className="px-3 py-3 flex items-center justify-end gap-6">
                  <div className="text-right">
                    <div className="text-muted-foreground text-xs">Subtotal</div>
                    <div className="tabular-nums">{moneyFmt.format(sale.subtotal)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground text-xs">Desc. global</div>
                    <div className="tabular-nums">{moneyFmt.format(Number(sale.discountGlobal || 0))}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground text-xs">Total</div>
                    <div className="text-xl font-bold tabular-nums">{moneyFmt.format(sale.total)}</div>
                  </div>
                </div>
              </div>

              {/* Notas */}
              {sale.notes && (
                <div className="mt-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Notas: </span>
                  {sale.notes}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
