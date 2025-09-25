// src/components/modals/EditOrderModal.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Save } from "lucide-react";
import { OrderDTO as Order, OrderItemDTO } from "@/types/domain";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onSave: (updated: Partial<Order>) => Promise<void> | void;
};

type UIItem = {
  id?: string;
  productId: string;
  productName?: string;
  unitPrice: number;     // read-only
  quantity: number;
  discountPct: number;   // UI en porcentaje (0-100)
  discountAmount: number; // derivado para mostrar el $ (unitPrice*qty*%/100)
  lineTotal: number;     // derivado
};

const money = (n: unknown) => `$${Number(n ?? 0).toFixed(2)}`;

export function EditOrderModal({ open, onOpenChange, order, onSave }: Props) {
  const [items, setItems] = useState<UIItem[]>([]);
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (!order) {
      setItems([]);
      setNotes("");
      return;
    }

    const normalized: UIItem[] = (order.items ?? []).map((it: any) => {
      const unitPrice = Number(it?.unitPrice ?? 0);
      const quantity = Number(it?.quantity ?? 0);
      const discountAmount = Number(it?.discount ?? 0);
      const base = unitPrice * quantity;
      // convertir $ a % seguro (0..100)
      const discountPct = base > 0 ? Math.min(100, Math.max(0, (discountAmount / base) * 100)) : 0;
      const lineTotal = base - discountAmount;

      return {
        id: it?.id,
        productId: String(it?.productId ?? ""),
        productName: it?.productName ?? "",
        unitPrice,
        quantity,
        discountPct: Number(discountPct.toFixed(2)),
        discountAmount,
        lineTotal,
      };
    });

    setItems(normalized);
    setNotes(String((order as any)?.notes ?? ""));
  }, [order]);

  const subtotal = useMemo(
    () => items.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0),
    [items]
  );
  const discountTotal = useMemo(
    () => items.reduce((acc, it) => acc + it.discountAmount, 0),
    [items]
  );
  const total = useMemo(() => subtotal - discountTotal, [subtotal, discountTotal]);

  const recalc = (raw: Omit<UIItem, "discountAmount" | "lineTotal">): UIItem => {
    const base = raw.unitPrice * raw.quantity;
    const discountAmount = base * (Math.min(100, Math.max(0, raw.discountPct)) / 100);
    const lineTotal = base - discountAmount;
    return {
      ...raw,
      discountAmount,
      lineTotal,
    };
    };

  const updateItem = (idx: number, patch: Partial<UIItem>) => {
    setItems((prev) => {
      const clone = [...prev];
      const cur = clone[idx];
      const next = recalc({ ...cur, ...patch });
      clone[idx] = next;
      return clone;
    });
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!order) return;

    // Convertimos % → monto ($) para el backend
    const safeItems: OrderItemDTO[] = items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      unitPrice: Number(i.unitPrice),
      quantity: Number(i.quantity),
      discount: Number(i.discountAmount), // ← el back espera monto
    }));

    await onSave({
      id: order.id,
      items: safeItems,
      notes,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar pedido {order?.code ?? order?.id ?? ""}</DialogTitle>
          <DialogDescription>
            Modificá <strong>cantidades</strong> y <strong>descuento (%)</strong>. El precio se gestiona en <strong>Productos</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 text-sm text-muted-foreground">Producto</th>
                  <th className="text-right p-2 text-sm text-muted-foreground">Precio</th>
                  <th className="text-center p-2 text-sm text-muted-foreground">Cantidad</th>
                  <th className="text-right p-2 text-sm text-muted-foreground">Desc. (%)</th>
                  <th className="text-right p-2 text-sm text-muted-foreground">Desc. ($)</th>
                  <th className="text-right p-2 text-sm text-muted-foreground">Total línea</th>
                  <th className="text-center p-2 text-sm text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={it.id ?? `${it.productId}-${idx}`} className="border-b">
                    <td className="p-2 text-sm">{it.productName || it.productId || "-"}</td>

                    {/* PRECIO SOLO LECTURA */}
                    <td className="p-2 text-right text-sm">
                      <Input
                        type="number"
                        inputMode="decimal"
                        className="text-right opacity-70 cursor-not-allowed"
                        value={String(it.unitPrice)}
                        readOnly
                        disabled
                        title="El precio se modifica desde la sección Productos"
                      />
                    </td>

                    {/* CANTIDAD */}
                    <td className="p-2 text-center text-sm">
                      <Input
                        type="number"
                        inputMode="numeric"
                        className="text-center"
                        min={0}
                        value={String(it.quantity)}
                        onChange={(e) =>
                          updateItem(idx, { quantity: Number(e.target.value || 0) })
                        }
                      />
                    </td>

                    {/* DESCUENTO % */}
                    <td className="p-2 text-right text-sm">
                      <Input
                        type="number"
                        inputMode="decimal"
                        className="text-right"
                        min={0}
                        max={100}
                        step="0.01"
                        value={String(it.discountPct)}
                        onChange={(e) =>
                          updateItem(idx, { discountPct: Number(e.target.value || 0) })
                        }
                      />
                    </td>

                    {/* DESCUENTO $ (solo lectura, derivado) */}
                    <td className="p-2 text-right text-sm">
                      {money(it.discountAmount)}
                    </td>

                    {/* TOTAL LÍNEA */}
                    <td className="p-2 text-right font-semibold text-sm">
                      {money(it.lineTotal)}
                    </td>

                    <td className="p-2 text-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem(idx)}
                        title="Quitar ítem"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td className="p-4 text-center text-sm text-muted-foreground" colSpan={7}>
                      Este pedido no tiene ítems.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <Label htmlFor="notes">Notas</Label>
            <Input
              id="notes"
              placeholder="Notas del pedido (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Resumen */}
          <div className="ml-auto max-w-sm space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Descuentos</span>
              <span className="text-destructive">-{money(discountTotal)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-semibold text-xl">{money(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditOrderModal;
