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
  unitPrice: number;   // nunca undefined
  quantity: number;    // nunca undefined
  discount: number;    // monto absoluto; nunca undefined
  lineTotal?: number;  // solo visual
};

const money = (n: unknown) => `$${Number(n ?? 0).toFixed(2)}`;

export function EditOrderModal({ open, onOpenChange, order, onSave }: Props) {
  // Normalizar items del pedido a un estado seguro
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
      const discount = Number(it?.discount ?? 0);
      const lineTotal = unitPrice * quantity - discount;

      return {
        id: it?.id,
        productId: String(it?.productId ?? ""),
        productName: it?.productName ?? "",
        unitPrice,
        quantity,
        discount,
        lineTotal,
      };
    });

    setItems(normalized);
    setNotes(String((order as any)?.notes ?? ""));
  }, [order]);

  // Totales seguros
  const subtotal = useMemo(
    () =>
      items.reduce((acc, it) => acc + Number(it.unitPrice) * Number(it.quantity), 0),
    [items]
  );
  const discounts = useMemo(
    () => items.reduce((acc, it) => acc + Number(it.discount ?? 0), 0),
    [items]
  );
  const total = useMemo(() => subtotal - discounts, [subtotal, discounts]);

  const updateItem = (idx: number, patch: Partial<UIItem>) => {
    setItems((prev) => {
      const clone = [...prev];
      const cur = clone[idx];
      const next: UIItem = {
        ...cur,
        ...patch,
      };
      // recalcular lineTotal derivado
      const u = Number(next.unitPrice ?? 0);
      const q = Number(next.quantity ?? 0);
      const d = Number(next.discount ?? 0);
      next.lineTotal = u * q - d;
      clone[idx] = next;
      return clone;
    });
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!order) return;

    // preparar payload con defensas
    const safeItems: OrderItemDTO[] = items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      unitPrice: Number(i.unitPrice ?? 0),
      quantity: Number(i.quantity ?? 0),
      discount: Number(i.discount ?? 0),
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
      <DialogContent
        // Si preferís no mostrar descripción, usa aria-describedby={undefined} en vez de <DialogDescription/>
        // aria-describedby={undefined}
        className="max-w-3xl"
      >
        <DialogHeader>
          <DialogTitle>
            Editar pedido {order?.code ?? order?.id ?? ""}
          </DialogTitle>
          <DialogDescription>
            Modificá cantidades, precios o descuentos. Los totales se recalculan automáticamente.
          </DialogDescription>
        </DialogHeader>

        {/* Items */}
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 text-sm text-muted-foreground">Producto</th>
                  <th className="text-right p-2 text-sm text-muted-foreground">Precio</th>
                  <th className="text-center p-2 text-sm text-muted-foreground">Cantidad</th>
                  <th className="text-right p-2 text-sm text-muted-foreground">Descuento ($)</th>
                  <th className="text-right p-2 text-sm text-muted-foreground">Total línea</th>
                  <th className="text-center p-2 text-sm text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={it.id ?? `${it.productId}-${idx}`} className="border-b">
                    <td className="p-2 text-sm">
                      {it.productName || it.productId || "-"}
                    </td>
                    <td className="p-2 text-right text-sm">
                      <Input
                        type="number"
                        inputMode="decimal"
                        className="text-right"
                        value={String(it.unitPrice ?? 0)}
                        onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value || 0) })}
                      />
                    </td>
                    <td className="p-2 text-center text-sm">
                      <Input
                        type="number"
                        inputMode="numeric"
                        className="text-center"
                        min={0}
                        value={String(it.quantity ?? 0)}
                        onChange={(e) => updateItem(idx, { quantity: Number(e.target.value || 0) })}
                      />
                    </td>
                    <td className="p-2 text-right text-sm">
                      <Input
                        type="number"
                        inputMode="decimal"
                        className="text-right"
                        min={0}
                        value={String(it.discount ?? 0)}
                        onChange={(e) => updateItem(idx, { discount: Number(e.target.value || 0) })}
                      />
                    </td>
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
                    <td className="p-4 text-center text-sm text-muted-foreground" colSpan={6}>
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
              <span className="text-destructive">-{money(discounts)}</span>
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
