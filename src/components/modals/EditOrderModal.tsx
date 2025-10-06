import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Save, X } from "lucide-react";
import type { OrderDTO, OrderItemDTO, Product } from "@/types/domain";
import ProductSearchModal from "@/components/modals/ProductSearchModal";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: OrderDTO;
  onSave: (updated: OrderDTO) => Promise<void> | void;
};

type UIItem = {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;      // PRECIO SIN IVA
  quantity: number;
  discountPercent: number;
};

/* ============================================
   Configuración de IVA (Argentina)
   Cambiá este valor si usás otra alícuota.
   ============================================ */
const IVA_RATE = 0.21; // 21%

/* ============================================
   Helpers de descuento e importes
   ============================================ */

// $ a %
const amountToPercent = (amount: number, unitPrice: number, qty: number) => {
  const base = Number(unitPrice) * Number(qty);
  if (base <= 0) return 0;
  const pct = (Number(amount || 0) / base) * 100;
  return clampPct(pct);
};

// % a $
const percentToAmount = (percent: number, unitPrice: number, qty: number) => {
  const base = Number(unitPrice) * Number(qty);
  const pct = clampPct(percent);
  return round2((base * pct) / 100);
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const clampPct = (n: number) => Math.min(100, Math.max(0, Number.isFinite(n) ? round2(n) : 0));

/** Cálculo por línea (sin IVA / IVA / con IVA) */
const lineCalc = (r: UIItem) => {
  const base = r.unitPrice * r.quantity;                 // sin IVA
  const disc = percentToAmount(r.discountPercent, r.unitPrice, r.quantity);
  const net = round2(base - disc);                       // Subt. s/IVA
  const iva = round2(net * IVA_RATE);                    // IVA
  const gross = round2(net + iva);                       // Total c/IVA
  return { base, disc, net, iva, gross };
};

/**
 * Fusiona UIItems idénticos: mismo productId + mismo unitPrice + mismo discountPercent.
 * Suma cantidades y mantiene nombres. Redondea a 2 decimales para claves estables.
 */
const mergeUIItems = (items: UIItem[]): UIItem[] => {
  if (!Array.isArray(items) || items.length === 0) return [];
  const map = new Map<string, UIItem>();

  for (const it of items) {
    const pid = String(it.productId);
    const price = Number(it.unitPrice ?? 0);
    const pct = clampPct(it.discountPercent ?? 0);
    const key = [pid, price.toFixed(2), pct.toFixed(2)].join("|");

    if (!map.has(key)) {
      map.set(key, {
        ...it,
        productId: pid,
        unitPrice: price,
        discountPercent: pct,
        quantity: Math.max(1, Math.floor(Number(it.quantity || 1))),
      });
    } else {
      const acc = map.get(key)!;
      map.set(key, {
        ...acc,
        quantity: Math.max(1, Math.floor(acc.quantity + Math.floor(Number(it.quantity || 1)))),
      });
    }
  }

  // devolvemos array con ids nuevos para evitar claves repetidas en el render
  return Array.from(map.values()).map((r) => ({
    ...r,
    id: crypto.randomUUID(),
  }));
};

export default function EditOrderModal({ open, onOpenChange, order, onSave }: Props) {
  const [items, setItems] = useState<UIItem[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (open && order) {
      const mapped: UIItem[] = (order.items ?? []).map((it, idx) => {
        const unitPrice = Number(it.unitPrice ?? 0); // asumimos SIN IVA
        const quantity = Number(it.quantity ?? 1);
        const discountPercent = amountToPercent(Number(it.discount ?? 0), unitPrice, quantity);
        return {
          id: `${idx}-${it.productId}-${crypto.randomUUID()}`,
          productId: it.productId,
          productName: it.productName,
          unitPrice,
          quantity,
          discountPercent,
        };
      });

      // Merge inicial para mostrar todo consolidado
      setItems(mergeUIItems(mapped));
      setNotes(order.notes ?? "");
    }
  }, [open, order]);

  // Totales del pedido
  const totals = useMemo(() => {
    return items.reduce(
      (acc, r) => {
        const { net, iva, gross } = lineCalc(r);
        acc.subtotal += net; // sin IVA
        acc.iva += iva;
        acc.total += gross;  // con IVA
        return acc;
      },
      { subtotal: 0, iva: 0, total: 0 }
    );
  }, [items]);

  const handleRemove = (rowId: string) => {
    setItems((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleAddFromPicker = (payload: { product: Product; quantity: number; discountPercent: number }) => {
    const { product: p, quantity, discountPercent } = payload;
    const newRow: UIItem = {
      id: crypto.randomUUID(),
      productId: String(p.id),
      productName: p.name,
      unitPrice: Number(p.price ?? 0),                 // asumimos que p.price es sin IVA
      quantity: Math.max(1, Math.floor(quantity || 1)),
      discountPercent: clampPct(discountPercent || 0),
    };
    setItems((prev) => mergeUIItems([...prev, newRow])); // merge al agregar
    setSearchOpen(false);
  };

  const setQty = (rowId: string, v: number) => {
    setItems((prev) => {
      const next = prev.map((r) => (r.id === rowId ? { ...r, quantity: Math.max(1, Math.floor(v || 1)) } : r));
      return mergeUIItems(next); // merge al cambiar cantidad
    });
  };

  const setPrice = (rowId: string, v: number) => {
    setItems((prev) => {
      const next = prev.map((r) =>
        r.id === rowId ? { ...r, unitPrice: Math.max(0, Number.isFinite(v) ? round2(v) : 0) } : r
      );
      return mergeUIItems(next); // merge al cambiar precio
    });
  };

  const setDiscPct = (rowId: string, v: number) => {
    setItems((prev) => {
      const next = prev.map((r) =>
        r.id === rowId ? { ...r, discountPercent: clampPct(v) } : r
      );
      return mergeUIItems(next); // merge al cambiar % desc
    });
  };

  const save = async () => {
    if (!order) return;

    // Seguridad extra: merge justo antes de construir el DTO
    const merged = mergeUIItems(items);

    // Map a tu DTO (nota: discount es $ sin IVA, como ya usabas)
    const dtoItems: OrderItemDTO[] = merged.map((it) => {
      const { net } = lineCalc(it); // net = (precio*sin IVA * qty) - descuento
      const discountAbs = percentToAmount(it.discountPercent, it.unitPrice, it.quantity);
      return {
        productId: it.productId,
        productName: it.productName,
        unitPrice: it.unitPrice,        // SIN IVA
        quantity: it.quantity,
        discount: discountAbs,          // $ de descuento (como antes)
        // si más adelante querés guardar IVA por línea, podríamos agregar campos si tu DTO los admite
      };
    });

    // ⚠️ Mantengo el total como lo tenías: sumatoria SIN IVA (para no romper backend).
    // Si querés que 'total' sea CON IVA, reemplazá 'orderTotal' por 'orderTotalWithIva' abajo.
    const orderTotal = dtoItems.reduce(
      (acc, it) => acc + it.unitPrice * it.quantity - Number(it.discount ?? 0),
      0
    );

    // Alternativa con IVA (si en algún momento querés):
    // const orderTotalWithIva = totals.total;

    const updated: OrderDTO = {
      ...order,
      items: dtoItems,
      notes,
      total: round2(orderTotal),          // 👈 mantener SIN IVA
      // total: round2(orderTotalWithIva), // 👈 usar esta línea si querés guardar CON IVA
    };

    await onSave(updated);
  };

  if (!order) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[96vw] sm:max-w-4xl md:max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Editar pedido {order.code ?? "—"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Label>Notas</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas del pedido…" />
          </div>

          <div className="border rounded-md">
            <div className="flex items-center justify-between p-3">
              <span className="text-sm text-muted-foreground">Items ({items.length})</span>
              <Button size="sm" onClick={() => setSearchOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar producto
              </Button>
            </div>

            <ScrollArea className="max-h=[48vh] md:max-h-[60vh]">
              <table className="w-full text-sm table-fixed">
                <thead className="sticky top-0 bg-muted/50 backdrop-blur z-10">
                  <tr className="border-b">
                    <th className="text-left  px-3 py-2 align-middle">Producto</th>
                    <th className="text-center px-3 py-2 align-middle w-[12%]">Cant.</th>
                    <th className="text-right  px-3 py-2 align-middle w-[14%]">Precio (s/IVA)</th>
                    <th className="text-right  px-3 py-2 align-middle w-[12%]">Desc. %</th>
                    <th className="text-right  px-3 py-2 align-middle w-[16%]">Subt. s/IVA</th>
                    <th className="text-right  px-3 py-2 align-middle w-[16%]">Total c/IVA</th>
                    <th className="text-center px-3 py-2 align-middle w-[9%]">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => {
                    const { net, gross } = lineCalc(r);
                    return (
                      <tr key={r.id} className="border-b">
                        <td className="px-3 py-2 align-middle">{r.productName}</td>

                        <td className="px-3 py-2 align-middle">
                          <div className="flex items-center justify-center">
                            <Input
                              className="w-20 text-center"
                              type="number"
                              min={1}
                              value={r.quantity}
                              onChange={(e) => setQty(r.id, parseInt(e.target.value || "1", 10))}
                            />
                          </div>
                        </td>

                        <td className="px-3 py-2 align-middle">
                          <div className="flex items-center justify-end">
                            <Input
                              className="w-28 text-right"
                              type="number"
                              min={0}
                              step="0.01"
                              value={r.unitPrice}
                              onChange={(e) => setPrice(r.id, parseFloat(e.target.value || "0"))}
                            />
                          </div>
                        </td>

                        <td className="px-3 py-2 align-middle">
                          <div className="flex items-center justify-end">
                            <Input
                              className="w-24 text-right"
                              type="number"
                              min={0}
                              max={100}
                              step="0.5"
                              value={r.discountPercent}
                              onChange={(e) => setDiscPct(r.id, parseFloat(e.target.value || "0"))}
                            />
                          </div>
                        </td>

                        <td className="px-3 py-2 align-middle text-right">
                          ${net.toFixed(2)}
                        </td>

                        <td className="px-3 py-2 align-middle text-right font-semibold">
                          ${gross.toFixed(2)}
                        </td>

                        <td className="px-3 py-2 align-middle text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleRemove(r.id)}
                            title="Quitar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                        Todavía no hay productos en este pedido.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </ScrollArea>

            <div className="p-3 border-t">
              <div className="w-full md:w-[420px] ml-auto space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal (s/IVA)</span>
                  <span>${round2(totals.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA (21%)</span>
                  <span>${round2(totals.iva).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold pt-2 border-t mt-2">
                  <span>Total (c/IVA)</span>
                  <span>${round2(totals.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
            <Button onClick={save}>
              <Save className="w-4 h-4 mr-1" />
              Guardar cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProductSearchModal
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onPick={handleAddFromPicker}
      />
    </>
  );
}

export { EditOrderModal };
