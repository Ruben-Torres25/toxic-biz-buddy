// src/components/modals/CreateCreditNoteModal.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Save, X, RotateCcw, Eraser, Check, Package, User2, Wallet, Minus, Plus, Info
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CreditNotesAPI, type CreateCreditNotePayload } from "@/services/credit-notes.api";
import type { OrderDTO, OrderItemDTO } from "@/types/domain";
import { useQueryClient } from "@tanstack/react-query";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderDTO;
  onCreated?: (creditNoteId: string) => void;
};

const IVA_RATE = 0.21;
const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const moneyFmt = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });
const fmtMoney = (n: any) => moneyFmt.format(Number(n ?? 0));

type Row = {
  id: string;
  productId: string;
  name: string;
  unitPrice: number;          // sin IVA
  soldQty: number;            // vendida
  alreadyReturned: number;    // ya devuelta
  maxReturnable: number;      // límite = soldQty - alreadyReturned
  returnQty: number;          // editable
  discountPerUnit: number;    // $ por unidad (s/IVA)
  showDetails?: boolean;      // toggle desglose
};

export default function CreateCreditNoteModal({ open, onOpenChange, order, onCreated }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [refundMethod, setRefundMethod] = useState<"cash" | "credit">("credit");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const getDiscountPerUnit = (it: OrderItemDTO) => {
    const qty = Math.max(1, Number(it.quantity ?? 1));
    const totalDisc = Number(it.discount ?? 0);
    return r2(totalDisc / qty);
  };

  useEffect(() => {
    if (!open || !order) return;
    const mapped: Row[] = (order.items ?? []).map((it, idx) => {
      const sold = Number(it.quantity ?? 0);
      const already = Number((it as any).returnedQty ?? 0);
      const maxReturnable = Math.max(0, sold - already);
      return {
        id: `${idx}-${it.productId}`,
        productId: String(it.productId),
        name: it.productName ?? "—",
        unitPrice: Number(it.unitPrice ?? 0),
        soldQty: sold,
        alreadyReturned: already,
        maxReturnable,
        returnQty: 0,
        discountPerUnit: getDiscountPerUnit(it),
        showDetails: false,
      };
    });
    setRows(mapped);
    setRefundMethod("credit");
    setReason("");
  }, [open, order]);

  const totals = useMemo(() => {
    let bruto = 0, descuentos = 0, net = 0, iva = 0, total = 0;
    for (const r of rows) {
      const qty = Math.max(0, Math.min(r.returnQty, r.maxReturnable));
      const base = r.unitPrice * qty;
      const disc = r2(r.discountPerUnit * qty);
      const subNet = r2(base - disc);
      const subIva = r2(subNet * IVA_RATE);
      const subTotal = r2(subNet + subIva);
      bruto += base; descuentos += disc; net += subNet; iva += subIva; total += subTotal;
    }
    return { bruto: r2(bruto), descuentos: r2(descuentos), net: r2(net), iva: r2(iva), total: r2(total) };
  }, [rows]);

  const hasAnyQty = rows.some(r => r.returnQty > 0);
  const allWithinLimits = rows.every(r => r.returnQty >= 0 && r.returnQty <= r.maxReturnable);
  const canSave = hasAnyQty && allWithinLimits && !saving;

  const clampQty = (r: Row, v: number) => Math.max(0, Math.min(Math.floor(v || 0), r.maxReturnable));

  const setQty = useCallback((rowId: string, v: number) => {
    setRows(prev =>
      prev.map(r => r.id === rowId ? { ...r, returnQty: clampQty(r, v) } : r)
    );
  }, []);

  const inc = (rowId: string) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, returnQty: clampQty(r, r.returnQty + 1) } : r));
  };

  const dec = (rowId: string) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, returnQty: clampQty(r, r.returnQty - 1) } : r));
  };

  const toggleDetails = (rowId: string) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, showDetails: !r.showDetails } : r));
  };

  const setMaxForRow = (rowId: string) => {
    setRows(prev => prev.map(r => (r.id === rowId ? { ...r, returnQty: r.maxReturnable } : r)));
  };

  const clearAllQty = () => setRows(prev => prev.map(r => ({ ...r, returnQty: 0 })));
  const selectAllQty = () => setRows(prev => prev.map(r => ({ ...r, returnQty: r.maxReturnable })));
  const resetForm = () => { clearAllQty(); setRefundMethod("credit"); setReason(""); };

  const save = async () => {
    try {
      if (!canSave) return;
      setSaving(true);

      const items = rows
        .filter(r => r.returnQty > 0)
        .map(r => ({
          productId: r.productId,
          description: r.name,
          unitPrice: r.unitPrice,
          quantity: r.returnQty,
          discount: r2(r.discountPerUnit * r.returnQty),
          taxRate: IVA_RATE,
        }));

      const payload: CreateCreditNotePayload = {
        orderId: order.id,
        invoiceId: (order as any).invoiceId ?? null,
        customerId: (order as any)?.customer?.id ?? null,
        reason: reason?.trim() || undefined,
        refundMethod,
        items,
      };

      // ---- Optimistic patch: sumar returnQty a returnedQty en el pedido en caché ----
      // Guardamos un snapshot para rollback si falla:
      const snapshotOrders = queryClient.getQueriesData({ predicate: q => (q.queryKey as any[])[0] === "orders" });

      // Actualizamos cualquier cache de 'orders' que contenga este orderId:
      queryClient.setQueriesData({ predicate: q => (q.queryKey as any[])[0] === "orders" }, (old: any) => {
        if (!old) return old;

        const patchOrder = (o: any) => {
          if (!o || o.id !== order.id) return o;
          const itemsMap = Object.fromEntries(items.map((i) => [String(i.productId), i.quantity]));
          const patchedItems = (o.items ?? []).map((it: any) => {
            const add = Number(itemsMap[String(it.productId)] ?? 0);
            if (!add) return it;
            const currentReturned = Number(it.returnedQty ?? 0);
            return { ...it, returnedQty: currentReturned + add };
          });
          return { ...o, items: patchedItems };
        };

        // Manejar tanto listas como objetos:
        if (Array.isArray(old)) {
          return old.map(patchOrder);
        }
        if (old?.data && Array.isArray(old.data)) {
          return { ...old, data: old.data.map(patchOrder) };
        }
        return patchOrder(old);
      });

      // ---- Llamada real ----
      const cn = await CreditNotesAPI.create(payload);

      toast({
        title: "Nota de crédito creada",
        description: `Total (c/IVA): ${moneyFmt.format(Math.abs(cn.total))}`
      });

      // Invalidar todas las queries de orders (lista, preview, ver pedido, etc.)
      queryClient.invalidateQueries({ predicate: q => (q.queryKey as any[])[0] === "orders" });

      onOpenChange(false);
      onCreated?.(cn.id);
    } catch (err: any) {
      // Rollback si fuese necesario: rehidratar snapshots
      // (no podemos restaurar automáticamente sin keys exactas, por eso invalidamos abajo)
      toast({
        title: "Error",
        description: err?.message ?? "No se pudo crear la nota de crédito.",
        variant: "destructive"
      });
      // Asegurar consistencia refrescando todo lo de orders
      queryClient.invalidateQueries({ predicate: q => (q.queryKey as any[])[0] === "orders" });
    } finally {
      setSaving(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent aria-describedby={undefined} className="w-[98vw] max-w-[1200px] p-0">
        {/* FLEX COLUMN: header + body scroll + footer */}
        <div className="flex flex-col max-h-[92vh] min-h-[60vh]">
          {/* Header (fijo) */}
          <div className="shrink-0 border-b px-4 sm:px-6 py-4">
            <DialogHeader className="p-0">
              <DialogTitle className="tracking-tight">Devolver / Nota de Crédito</DialogTitle>
              <DialogDescription className="sr-only">
                Seleccioná ítems y cantidades a devolver, método de reintegro y revisá totales.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Body (scrolleable) */}
          <div className="grow min-h-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
            {/* Cabecera (pedido/cliente/reintegro) */}
            <div className="rounded-xl border bg-card/50 p-3 sm:p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                {/* Pedido */}
                <div className="rounded-lg border bg-background p-3 sm:p-4 flex items-center gap-3">
                  <div className="shrink-0 rounded-md border bg-muted/40 p-2">
                    <Package className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] sm:text-xs text-muted-foreground">Pedido</div>
                    <div className="mt-0.5 font-medium leading-tight truncate">
                      {order.code ?? order.id}
                    </div>
                  </div>
                </div>

                {/* Cliente */}
                <div className="rounded-lg border bg-background p-3 sm:p-4 flex items-center gap-3">
                  <div className="shrink-0 rounded-md border bg-muted/40 p-2">
                    <User2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] sm:text-xs text-muted-foreground">Cliente</div>
                    <div
                      className="mt-0.5 font-medium leading-tight truncate"
                      title={(order as any)?.customer?.name ?? "—"}
                    >
                      {(order as any)?.customer?.name ?? "—"}
                    </div>
                  </div>
                </div>

                {/* Destino del reintegro */}
                <div className="rounded-lg border bg-background p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="shrink-0 rounded-md border bg-muted/40 p-2">
                        <Wallet className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-[11px] sm:text-xs text-muted-foreground">Destino del reintegro</div>
                        <Badge variant="secondary" className="mt-1">
                          {refundMethod === "credit" ? "Crédito a favor" : "Efectivo/Transferencia"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={refundMethod === "credit" ? "default" : "outline"}
                      className="justify-center"
                      onClick={() => setRefundMethod("credit")}
                    >
                      Crédito a favor
                    </Button>
                    <Button
                      type="button"
                      variant={refundMethod === "cash" ? "default" : "outline"}
                      className="justify-center"
                      onClick={() => setRefundMethod("cash")}
                    >
                      Efectivo/Transferencia
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Textarea
                id="reason"
                placeholder="Defectuoso, arrepentimiento, error de carga, etc."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {/* Acciones rápidas */}
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={selectAllQty} title="Seleccionar el máximo por cada ítem">
                <Check className="w-4 h-4 mr-1" /> Seleccionar todo
              </Button>
              <Button variant="outline" size="sm" onClick={clearAllQty} title="Poner todas las cantidades en 0">
                <Eraser className="w-4 h-4 mr-1" /> Vaciar cantidades
              </Button>
              <Button variant="ghost" size="sm" onClick={resetForm} title="Reiniciar formulario">
                <RotateCcw className="w-4 h-4 mr-1" /> Reiniciar
              </Button>
            </div>

            {/* Ítems: claro sobre MÁXIMO y QUEDAN */}
            <div className="rounded-lg border overflow-hidden">
              <div className="p-3 border-b">
                <div className="font-medium">Ítems a devolver</div>
                <div className="text-xs text-muted-foreground">
                  Indicá cuántas unidades querés devolver. <strong>Máx</strong> es lo permitido. <strong>Quedan</strong> se actualiza en vivo.
                </div>
              </div>

              <div className="divide-y">
                {rows.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">Sin ítems en el pedido.</div>
                )}

                {rows.map((r) => {
                  const qty = Math.max(0, Math.min(r.returnQty, r.maxReturnable));
                  const remaining = Math.max(0, r.maxReturnable - qty); // QUEDAN
                  const base = r.unitPrice * qty;
                  const disc = r2(r.discountPerUnit * qty);
                  const net = r2(base - disc);
                  const iva = r2(net * IVA_RATE);
                  const total = r2(net + iva);
                  const atMax = qty === r.maxReturnable;
                  const isZero = qty === 0;

                  return (
                    <div key={r.id} className="p-3 sm:p-4">
                      {/* fila principal */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center">
                        {/* Producto + métricas */}
                        <div className="md:col-span-5">
                          <div className="text-sm font-medium leading-tight truncate" title={r.name}>
                            {r.name}
                          </div>

                          {/* INFO CLAVE: Vendido / Máx / Quedan */}
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-[11px]">
                              Vendido: <span className="ml-1 tabular-nums">{r.soldQty}</span>
                            </Badge>
                            <Badge variant="secondary" className="text-[11px]">
                              Máx: <span className="ml-1 tabular-nums">{r.maxReturnable}</span>
                            </Badge>
                            <Badge variant={remaining === 0 ? "destructive" : "default"} className="text-[11px]">
                              Quedan: <span className="ml-1 tabular-nums">{remaining}</span>
                            </Badge>
                            {r.alreadyReturned > 0 && (
                              <span className="text-[11px] text-muted-foreground">
                                · Ya devuelto: <span className="tabular-nums">{r.alreadyReturned}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Controles cantidad (respetan MÁX / QUEDAN) */}
                        <div className="md:col-span-4">
                          <div className="flex items-center justify-start md:justify-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => dec(r.id)}
                              disabled={isZero}
                              aria-label="Disminuir"
                              title="Disminuir"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>

                            <Input
                              className={`w-24 text-center tabular-nums ${qty > r.maxReturnable ? "border-destructive" : ""}`}
                              type="number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              min={0}
                              max={r.maxReturnable}
                              value={qty}
                              onChange={(e) => setQty(r.id, parseInt(e.target.value || "0", 10))}
                            />

                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => inc(r.id)}
                              disabled={atMax}
                              aria-label="Aumentar"
                              title="Aumentar"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setMaxForRow(r.id)}
                              disabled={r.maxReturnable === 0 || atMax}
                              title="Llevar a máximo"
                            >
                              Máx.
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setQty(r.id, 0)}
                              disabled={isZero}
                              title="Poner en 0"
                            >
                              0
                            </Button>
                          </div>
                          {/* Barra de progreso simple para visual QUEDAN */}
                          <div className="mt-2 h-1.5 w-full rounded bg-muted/50 overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: r.maxReturnable === 0 ? "0%" : `${(qty / r.maxReturnable) * 100}%` }}
                              aria-hidden
                            />
                          </div>
                          <div className="mt-1 text-[11px] text-muted-foreground text-center">
                            Usado: <span className="tabular-nums">{qty}</span> / Máx <span className="tabular-nums">{r.maxReturnable}</span>
                            {" · "}Quedan <span className="tabular-nums">{remaining}</span>
                          </div>
                        </div>

                        {/* Total por ítem */}
                        <div className="md:col-span-3 text-right">
                          <div className="text-xs text-muted-foreground">Total (c/IVA)</div>
                          <div className="font-medium tabular-nums">{fmtMoney(total)}</div>

                          {/* Botón para ver desglose */}
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1 hover:underline"
                            onClick={() => toggleDetails(r.id)}
                            title="Ver desglose"
                          >
                            <Info className="w-3.5 h-3.5" />
                            {r.showDetails ? "Ocultar detalles" : "Ver detalles"}
                          </button>
                        </div>
                      </div>

                      {/* Desglose opcional */}
                      {r.showDetails && (
                        <div className="mt-3 rounded-md border bg-muted/20 p-3 text-xs">
                          <div className="flex justify-between">
                            <span>Precio unit. (s/IVA)</span>
                            <span className="tabular-nums">{fmtMoney(r.unitPrice)}</span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span>Descuento unit.</span>
                            <span className="tabular-nums">
                              {r.discountPerUnit > 0 ? fmtMoney(r.discountPerUnit) : "—"}
                            </span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between">
                            <span>Subtotal (s/IVA)</span>
                            <span className="tabular-nums">{fmtMoney(net)}</span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span>IVA (21%)</span>
                            <span className="tabular-nums">{fmtMoney(iva)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Totales generales */}
              <div className="p-3 border-t">
                <div className="flex justify-end">
                  <div className="w-full sm:w-[460px] space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bruto (s/IVA)</span>
                      <span className="tabular-nums">{fmtMoney(totals.bruto)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Descuentos</span>
                      <span className="text-destructive tabular-nums">- {fmtMoney(totals.descuentos)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal (s/IVA)</span>
                      <span className="tabular-nums">{fmtMoney(totals.net)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IVA (21%)</span>
                      <span className="tabular-nums">{fmtMoney(totals.iva)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t mt-2">
                      <span className="font-semibold">Total NC (c/IVA)</span>
                      <span className="font-semibold tabular-nums">{fmtMoney(totals.total)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  * El total de la Nota de Crédito se aplicará en negativo sobre la venta original.
                </div>
              </div>
            </div>
          </div>

          {/* Footer (fijo) */}
          <div className="shrink-0 border-t px-4 sm:px-6 py-3 flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              <X className="w-4 h-4 mr-1" /> Cancelar
            </Button>
            <Button onClick={save} disabled={!canSave}>
              <Save className="w-4 h-4 mr-1" /> Generar Nota de Crédito
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
