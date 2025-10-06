// src/components/modals/CreateCreditNoteModal.tsx
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Save, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CreditNotesAPI, type CreateCreditNotePayload } from "@/services/credit-notes.api";
import type { OrderDTO, OrderItemDTO } from "@/types/domain";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderDTO;
  onCreated?: (creditNoteId: string) => void;
};

const IVA_RATE = 0.21; // 21% AR
const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const moneyFmt = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });

type Row = {
  id: string;
  productId: string;
  name: string;
  unitPrice: number;     // sin IVA
  soldQty: number;       // cantidad vendida/confirmada
  returnQty: number;     // a devolver (editable)
  discountPerUnit: number; // $ de descuento por unidad (de la línea original)
};

export default function CreateCreditNoteModal({ open, onOpenChange, order, onCreated }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [refundMethod, setRefundMethod] = useState<"cash" | "credit">("credit");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const getDiscountPerUnit = (it: OrderItemDTO) => {
    const qty = Math.max(1, Number(it.quantity ?? 1));
    const totalDisc = Number(it.discount ?? 0);
    return r2(totalDisc / qty);
  };

  useEffect(() => {
    if (!open || !order) return;
    const mapped: Row[] = (order.items ?? []).map((it, idx) => ({
      id: `${idx}-${it.productId}`,
      productId: String(it.productId),
      name: it.productName ?? "—",
      unitPrice: Number(it.unitPrice ?? 0),
      soldQty: Number(it.quantity ?? 0),
      returnQty: 0,
      discountPerUnit: getDiscountPerUnit(it),
    }));
    setRows(mapped);
    setRefundMethod("credit");
    setReason("");
  }, [open, order]);

  const totals = useMemo(() => {
    let bruto = 0, descuentos = 0, net = 0, iva = 0, total = 0;
    for (const r of rows) {
      const qty = Math.max(0, Math.min(r.returnQty, r.soldQty));
      const base = r.unitPrice * qty;                 // s/IVA
      const disc = r2(r.discountPerUnit * qty);       // $
      const subNet = r2(base - disc);                 // s/IVA
      const subIva = r2(subNet * IVA_RATE);
      const subTotal = r2(subNet + subIva);
      bruto += base; descuentos += disc; net += subNet; iva += subIva; total += subTotal;
    }
    return { bruto: r2(bruto), descuentos: r2(descuentos), net: r2(net), iva: r2(iva), total: r2(total) };
  }, [rows]);

  const canSave = rows.some(r => r.returnQty > 0 && r.returnQty <= r.soldQty) && !saving;

  const setQty = (rowId: string, v: number) => {
    setRows(prev => prev.map(r =>
      r.id === rowId ? { ...r, returnQty: Math.max(0, Math.min(Math.floor(v || 0), r.soldQty)) } : r
    ));
  };

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

      const cn = await CreditNotesAPI.create(payload);

      toast({
        title: "Nota de crédito creada",
        description: `Total (c/IVA): ${moneyFmt.format(Math.abs(cn.total))}`,
      });

      onOpenChange(false);
      onCreated?.(cn.id);
    } catch (err: any) {
      const msg = typeof err?.message === "string" && /404|not found|no route/i.test(err.message)
        ? "El endpoint /api/credit-notes no existe en tu backend. Crealo o ajustá la constante BASE en credit-notes.api.ts."
        : (err?.message ?? "No se pudo crear la nota de crédito.");
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      {/* aria-describedby undefined + Description oculto para evitar warning A11y */}
      <DialogContent
        aria-describedby={undefined}
        className="w-[98vw] sm:max-w-4xl lg:max-w-5xl max-h-[92vh] p-0"
      >
        <div className="border-b px-4 sm:px-6 py-4">
          <DialogHeader className="p-0">
            <DialogTitle>Devolver / Nota de Crédito</DialogTitle>
            <DialogDescription className="sr-only">
              Seleccioná ítems y cantidades a devolver, y el método de reintegro.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Cuerpo scrolleable: el modal no supera la pantalla */}
        <div className="overflow-y-auto px-4 sm:px-6 py-4 space-y-4 max-h-[calc(92vh-5.25rem)]">
          {/* Cabecera */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Pedido</div>
              <div className="mt-1 text-foreground">{order.code ?? order.id}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Cliente</div>
              <div className="mt-1 text-foreground">{(order as any)?.customer?.name ?? "—"}</div>
            </div>
            <div className="rounded-lg border p-3 md:col-span-2">
              <div className="text-xs text-muted-foreground mb-2">Destino del reintegro</div>
              <RadioGroup
                value={refundMethod}
                onValueChange={(v) => setRefundMethod(v as any)}
                className="flex flex-row gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="credit" id="credit" />
                  <Label htmlFor="credit">Crédito a favor</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash">Efectivo/Transferencia</Label>
                </div>
              </RadioGroup>
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

          {/* Tabla */}
          <div className="rounded-lg border">
            <div className="p-3 border-b">
              <div className="font-medium">Ítems a devolver</div>
              <div className="text-xs text-muted-foreground">Indicá la cantidad a devolver por producto.</div>
            </div>
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background/95 backdrop-blur">
                  <tr className="border-b">
                    <th className="text-left  p-2">Producto</th>
                    <th className="text-center p-2 w-[10%]">Vend.</th>
                    <th className="text-center p-2 w-[12%]">A devolver</th>
                    <th className="text-right p-2 w-[14%]">Precio (s/IVA)</th>
                    <th className="text-right p-2 w-[14%]">Desc. ($)</th>
                    <th className="text-right p-2 w-[14%]">Subt. (s/IVA)</th>
                    <th className="text-right p-2 w-[14%]">IVA</th>
                    <th className="text-right p-2 w-[14%]">Total (c/IVA)</th>
                  </tr>
                </thead>
                <tbody className="[&>tr:nth-child(even)]:bg-muted/20">
                  {rows.length === 0 && (
                    <tr>
                      <td className="p-4 text-center text-muted-foreground" colSpan={8}>
                        Sin ítems en el pedido.
                      </td>
                    </tr>
                  )}
                  {rows.map((r) => {
                    const qty = Math.max(0, Math.min(r.returnQty, r.soldQty));
                    const base = r.unitPrice * qty;
                    const disc = r2(r.discountPerUnit * qty);
                    const net = r2(base - disc);
                    const iva = r2(net * IVA_RATE);
                    const total = r2(net + iva);

                    return (
                      <tr key={r.id} className="border-b last:border-b-0">
                        <td className="p-2">{r.name}</td>
                        <td className="p-2 text-center tabular-nums">{r.soldQty}</td>
                        <td className="p-2">
                          <div className="flex items-center justify-center">
                            <Input
                              className="w-24 text-center"
                              type="number"
                              min={0}
                              max={r.soldQty}
                              value={r.returnQty}
                              onChange={(e) => setQty(r.id, parseInt(e.target.value || "0", 10))}
                            />
                          </div>
                        </td>
                        <td className="p-2 text-right tabular-nums">{moneyFmt.format(r.unitPrice)}</td>
                        <td className="p-2 text-right tabular-nums">{disc > 0 ? moneyFmt.format(disc) : "—"}</td>
                        <td className="p-2 text-right tabular-nums">{moneyFmt.format(net)}</td>
                        <td className="p-2 text-right tabular-nums">{moneyFmt.format(iva)}</td>
                        <td className="p-2 text-right font-medium tabular-nums">{moneyFmt.format(total)}</td>
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
                    <span className="tabular-nums">{moneyFmt.format(totals.bruto)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descuentos</span>
                    <span className="text-destructive tabular-nums">- {moneyFmt.format(totals.descuentos)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal (s/IVA)</span>
                    <span className="tabular-nums">{moneyFmt.format(totals.net)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA (21%)</span>
                    <span className="tabular-nums">{moneyFmt.format(totals.iva)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t mt-2">
                    <span className="font-semibold">Total NC (c/IVA)</span>
                    <span className="font-semibold tabular-nums">{moneyFmt.format(totals.total)}</span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                * El total de la Nota de Crédito se aplicará en negativo sobre la venta original.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-4 sm:px-6 py-3 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            <X className="w-4 h-4 mr-1" /> Cancelar
          </Button>
          <Button onClick={save} disabled={!canSave}>
            <Save className="w-4 h-4 mr-1" /> Generar Nota de Crédito
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
