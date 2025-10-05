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
  unitPrice: number;
  quantity: number;
  discountPercent: number;
};

export default function EditOrderModal({ open, onOpenChange, order, onSave }: Props) {
  const [items, setItems] = useState<UIItem[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [searchOpen, setSearchOpen] = useState(false);

  const amountToPercent = (amount: number, unitPrice: number, qty: number) => {
    const base = Number(unitPrice) * Number(qty);
    if (base <= 0) return 0;
    const pct = (Number(amount || 0) / base) * 100;
    return Math.min(100, Math.max(0, Number.isFinite(pct) ? Math.round(pct * 100) / 100 : 0));
  };

  const percentToAmount = (percent: number, unitPrice: number, qty: number) => {
    const base = Number(unitPrice) * Number(qty);
    const pct = Math.min(100, Math.max(0, Number(percent || 0)));
    return Math.round((base * pct) / 100 * 100) / 100;
  };

  useEffect(() => {
    if (open && order) {
      const mapped: UIItem[] = (order.items ?? []).map((it, idx) => ({
        id: `${idx}-${it.productId}`,
        productId: it.productId,
        productName: it.productName,
        unitPrice: Number(it.unitPrice ?? 0),
        quantity: Number(it.quantity ?? 1),
        discountPercent: amountToPercent(
          Number(it.discount ?? 0),
          Number(it.unitPrice ?? 0),
          Number(it.quantity ?? 1),
        ),
      }));
      setItems(mapped);
      setNotes(order.notes ?? "");
    }
  }, [open, order]);

  const total = useMemo(() => {
    return items.reduce((acc, it) => {
      const discAmount = percentToAmount(it.discountPercent, it.unitPrice, it.quantity);
      const line = it.unitPrice * it.quantity - discAmount;
      return acc + line;
    }, 0);
  }, [items]);

  const handleRemove = (rowId: string) => {
    setItems((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleAddFromPicker = (payload: { product: Product; quantity: number; discountPercent: number }) => {
    const { product: p, quantity, discountPercent } = payload;
    const newRow: UIItem = {
      id: crypto.randomUUID(),
      productId: p.id,
      productName: p.name,
      unitPrice: Number(p.price ?? 0),
      quantity: Math.max(1, quantity || 1),
      discountPercent: Math.min(100, Math.max(0, discountPercent || 0)),
    };
    setItems((prev) => [...prev, newRow]);
    setSearchOpen(false);
  };

  const setQty = (rowId: string, v: number) => {
    setItems((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, quantity: Math.max(1, Math.floor(v || 1)) } : r)),
    );
  };

  const setPrice = (rowId: string, v: number) => {
    setItems((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, unitPrice: Math.max(0, Number.isFinite(v) ? v : 0) } : r)),
    );
  };

  const setDiscPct = (rowId: string, v: number) => {
    setItems((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? { ...r, discountPercent: Math.min(100, Math.max(0, Number.isFinite(v) ? v : 0)) }
          : r,
      ),
    );
  };

  const save = async () => {
    if (!order) return;
    const dtoItems: OrderItemDTO[] = items.map((it) => ({
      productId: it.productId,
      productName: it.productName,
      unitPrice: it.unitPrice,
      quantity: it.quantity,
      discount: percentToAmount(it.discountPercent, it.unitPrice, it.quantity),
    }));

    const updated: OrderDTO = {
      ...order,
      items: dtoItems,
      notes,
      total: dtoItems.reduce(
        (acc, it) => acc + it.unitPrice * it.quantity - Number(it.discount ?? 0),
        0,
      ),
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

            <ScrollArea className="max-h-[48vh] md:max-h-[60vh]">
              <table className="w-full text-sm table-fixed">
                <thead className="sticky top-0 bg-muted/50 backdrop-blur z-10">
                  <tr className="border-b">
                    <th className="text-left px-3 py-2 align-middle">Producto</th>
                    <th className="text-center px-3 py-2 align-middle w-[14%]">Cant.</th>
                    <th className="text-right px-3 py-2 align-middle w-[16%]">Precio</th>
                    <th className="text-right px-3 py-2 align-middle w-[14%]">Desc. %</th>
                    <th className="text-right px-3 py-2 align-middle w-[16%]">Total</th>
                    <th className="text-center px-3 py-2 align-middle w-[10%]">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => {
                    const discAmount = percentToAmount(r.discountPercent, r.unitPrice, r.quantity);
                    const line = r.unitPrice * r.quantity - discAmount;
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

                        <td className="px-3 py-2 align-middle text-right font-semibold">
                          ${line.toFixed(2)}
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
                      <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                        Todavía no hay productos en este pedido.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </ScrollArea>

            <div className="flex items-center justify-between p-3 border-t">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-semibold">${total.toFixed(2)}</span>
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
