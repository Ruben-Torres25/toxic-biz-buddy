import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Save, X } from "lucide-react";
import type { OrderDTO, OrderItemDTO, Product } from "@/types/domain";
import ProductSearchModal from "@/components/modals/ProductSearchModal";

/** ===== Tipos internos ===== */
type UIItem = {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;      // SIN IVA (solo lectura)
  quantity: number;
  discountPercent: number; // % por ítem (UI)
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: OrderDTO;
  onSave: (updated: OrderDTO) => Promise<void> | void;
};

/** ===== Configuración / helpers ===== */
const IVA_RATE = 0.21;
const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const clampPct = (n: number) => Math.min(100, Math.max(0, Number.isFinite(n) ? r2(n) : 0));

const amountToPercent = (amount: number, unitPrice: number, qty: number) => {
  const base = Number(unitPrice) * Number(qty);
  if (base <= 0) return 0;
  return clampPct((Number(amount || 0) / base) * 100);
};

const percentToAmount = (percent: number, unitPrice: number, qty: number) => {
  const base = Number(unitPrice) * Number(qty);
  return r2((base * clampPct(percent)) / 100);
};

const lineCalc = (r: UIItem) => {
  const base = r.unitPrice * r.quantity;                 // sin IVA
  const disc = percentToAmount(r.discountPercent, r.unitPrice, r.quantity); // $ por ítem
  const net = r2(base - disc);                           // Subt. s/IVA (tras desc. por ítem)
  return { base, disc, net };
};

/** Intenta leer metadata del %/monto/base global */
const extractGlobalMeta = (o?: any) => {
  const pctCands = [o?.globalDiscountPercent, o?.orderDiscountPercent, o?.discountPercentGeneral];
  const amtCands = [o?.globalDiscountAmount, o?.orderDiscountAmount];
  const baseCands = [o?.globalDiscountBase, o?.orderDiscountBase];

  const pct = clampPct(Number(pctCands.find((x: any) => typeof x === "number") || 0));
  const amountRaw = amtCands.find((x: any) => typeof x === "number");
  const amount = Number.isFinite(amountRaw) ? r2(Number(amountRaw)) : 0;
  const baseRaw = baseCands.find((x: any) => typeof x === "number");
  const base = Number.isFinite(baseRaw) ? r2(Number(baseRaw)) : 0;

  return { pct, amount, base };
};

export default function EditOrderModal({ open, onOpenChange, order, onSave }: Props) {
  const [items, setItems] = useState<UIItem[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [searchOpen, setSearchOpen] = useState(false);

  /** % descuento global (solo este campo queda visible) */
  const [globalDiscountPercent, setGlobalDiscountPercent] = useState<number>(0);

  /** Cargar pedido en el estado de edición */
  useEffect(() => {
    if (open && order) {
      const mapped: UIItem[] = (order.items ?? []).map((it, idx) => {
        const unitPrice = Number(it.unitPrice ?? 0); // SIN IVA — solo lectura
        const quantity = Number(it.quantity ?? 1);
        // Aproximamos % por ítem a partir del descuento en $ (si no se guardó explícito)
        const discountPercent = amountToPercent(Number(it.discount ?? 0), unitPrice, quantity);
        return {
          id: `${idx}-${it.productId}-${crypto.randomUUID()}`,
          productId: String(it.productId),
          productName: it.productName,
          unitPrice,
          quantity,
          discountPercent,
        };
      });
      setItems(mapped);
      setNotes(order.notes ?? "");

      const meta = extractGlobalMeta(order as any);
      setGlobalDiscountPercent(meta.pct); // ← precarga el % que se usó al crear
    }
  }, [open, order]);

  /** Totales en vivo con “no apila” (global solo a líneas sin desc. por ítem) */
  const computed = useMemo(() => {
    const per = items.map((r) => lineCalc(r)); // net = base - descPorItem
    const base = r2(per.reduce((a, x) => a + x.base, 0));
    const discItems = r2(per.reduce((a, x) => a + x.disc, 0));
    const netAfterItem = per.map((x) => x.net);

    // Elegibles = líneas con % por ítem === 0
    const eligibleMask = items.map((r) => (r.discountPercent || 0) === 0);
    const eligibleNet = r2(netAfterItem.reduce((a, x, idx) => a + (eligibleMask[idx] ? x : 0), 0));

    const gPct = clampPct(globalDiscountPercent);
    const gAmt = r2(eligibleNet * gPct / 100);

    const subtotal = r2(base - discItems - gAmt);
    const iva = r2(subtotal * IVA_RATE);
    const total = r2(subtotal + iva);

    return { base, discItems, eligibleNet, gPct, gAmt, subtotal, iva, total, eligibleMask, netAfterItem };
  }, [items, globalDiscountPercent]);

  /** Mapa con cantidades ya en el pedido, para pasar al ProductSearchModal */
  const inOrderMap = useMemo<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    for (const r of items) m[r.productId] = (m[r.productId] ?? 0) + Number(r.quantity || 0);
    return m;
  }, [items]);

  /** Mutadores permitidos (solo cantidad y descuento por ítem) */
  const setQty = (rowId: string, v: number) => {
    setItems(prev => prev.map(r => r.id === rowId ? { ...r, quantity: Math.max(1, Math.floor(v || 1)) } : r));
  };
  const setDiscPct = (rowId: string, v: number) => {
    setItems(prev => prev.map(r => r.id === rowId ? { ...r, discountPercent: clampPct(v) } : r));
  };
  const handleRemove = (rowId: string) => setItems(prev => prev.filter(r => r.id !== rowId));

  /** Agregar producto (precio viene del producto y NO se edita) */
  const handleAddFromPicker = (payload: { product: Product; quantity: number; discountPercent: number }) => {
    const { product: p, quantity, discountPercent } = payload;
    const newRow: UIItem = {
      id: crypto.randomUUID(),
      productId: String(p.id),
      productName: p.name,
      unitPrice: Number(p.price ?? 0), // SIN IVA — solo lectura
      quantity: Math.max(1, Math.floor(quantity || 1)),
      discountPercent: clampPct(discountPercent || 0),
    };
    setItems(prev => [...prev, newRow]);
  };

  /** Guardar con prorrateo global SOLO en elegibles y total CON IVA */
  const save = async () => {
    if (!order) return;

    const per = items.map((r) => lineCalc(r));
    const itemOwnDisc = per.map((x) => x.base - x.net); // = desc por ítem ($)
    const eligibleMask = items.map((r) => (r.discountPercent || 0) === 0);
    const netAfterItem = per.map((x) => x.net);
    const eligibleNet = r2(netAfterItem.reduce((a, x, idx) => a + (eligibleMask[idx] ? x : 0), 0));

    const gPct = clampPct(globalDiscountPercent);
    const gAmt = r2(eligibleNet * gPct / 100);

    const share = eligibleNet > 0
      ? netAfterItem.map((net, idx) => (eligibleMask[idx] ? net / eligibleNet : 0))
      : items.map(() => 0);

    const generalPerLine = share.map((s) => r2(s * gAmt));

    const dtoItems: OrderItemDTO[] = items.map((it, i) => ({
      productId: it.productId,
      productName: it.productName,
      unitPrice: it.unitPrice, // SIN IVA
      quantity: it.quantity,
      discount: r2(itemOwnDisc[i] + generalPerLine[i]),
    }));

    // Totales del pedido (CON IVA)
    const orderNet = dtoItems.reduce(
      (acc, it) => acc + it.unitPrice * it.quantity - Number(it.discount ?? 0),
      0
    );
    const tax = r2(orderNet * IVA_RATE);
    const gross = r2(orderNet + tax);

    const updated: OrderDTO = {
      ...order,
      items: dtoItems,
      notes,
      // metadata para “Ver pedido”
      globalDiscountPercent: gPct,
      globalDiscountAmount: gAmt,
      globalDiscountBase: eligibleNet,

      // Totales normalizados
      subtotal: r2(orderNet), // s/IVA
      tax,                    // IVA
      total: gross,           // c/IVA (para Historial)
    } as any;

    await onSave(updated);
  };

  if (!order) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[96vw] sm:max-w-4xl md:max-w-5xl p-0 max-h-[90vh] h-[90vh] flex flex-col" aria-describedby={undefined}>
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Editar pedido {order.code ?? "—"}</DialogTitle>
          </DialogHeader>

          {/* Cabecera: Notas + % descuento general (eliminado el campo de texto) */}
          <div className="px-6 pb-3 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <Label className="mb-1 block">Notas</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas del pedido…" />
              </div>

              <div className="space-y-2">
                <Label className="mb-1 block">% descuento general</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step={0.5}
                  placeholder="0"
                  value={String(globalDiscountPercent || "")}
                  onChange={(e) => setGlobalDiscountPercent(clampPct(parseFloat(e.target.value || "0")))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Items ({items.length})</span>
              <Button size="sm" onClick={() => setSearchOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Agregar producto
              </Button>
            </div>
          </div>

          {/* Tabla scrollable */}
          <div className="px-6 pb-6 flex-1 min-h-0">
            <div className="border rounded-md h-full flex flex-col">
              <div className="min-h-0 flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="min-w-[820px]">
                    <table className="w-full text-sm table-fixed">
                      <thead className="sticky top-0 bg-muted/50 backdrop-blur z-10">
                        <tr className="border-b">
                          <th className="text-left  px-3 py-2">Producto</th>
                          <th className="text-center px-3 py-2 w-[12%]">Cant.</th>
                          <th className="text-right  px-3 py-2 w-[14%]">Precio (s/IVA)</th>
                          <th className="text-right  px-3 py-2 w-[12%]">Desc. %</th>
                          <th className="text-right  px-3 py-2 w-[16%]">Subt. s/IVA</th>
                          <th className="text-center px-3 py-2 w-[9%]">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((r) => {
                          const { net } = lineCalc(r);
                          return (
                            <tr key={r.id} className="border-b">
                              <td className="px-3 py-2">{r.productName}</td>

                              <td className="px-3 py-2">
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

                              {/* Precio solo lectura */}
                              <td className="px-3 py-2 text-right tabular-nums">
                                ${r.unitPrice.toFixed(2)}
                              </td>

                              <td className="px-3 py-2">
                                <div className="flex items-center justify-end">
                                  <Input
                                    className="w-24 text-right"
                                    type="number"
                                    min={0}
                                    max={100}
                                    step={0.5}
                                    value={r.discountPercent}
                                    onChange={(e) => setDiscPct(r.id, parseFloat(e.target.value || "0"))}
                                  />
                                </div>
                              </td>

                              <td className="px-3 py-2 text-right tabular-nums">${net.toFixed(2)}</td>

                              <td className="px-3 py-2 text-center">
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
                  </div>
                </ScrollArea>
              </div>

              {/* Totales */}
              <div className="p-3 border-t">
                <div className="w-full md:w-[460px] ml-auto space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bruto (s/IVA)</span>
                    <span>${computed.base.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descuentos por ítem</span>
                    <span className="text-destructive">- ${computed.discItems.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Condición de venta ({computed.gPct}%)</span>
                    <span className="text-destructive">- ${computed.gAmt.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal (s/IVA)</span>
                    <span>${computed.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA (21%)</span>
                    <span>${computed.iva.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold pt-2 border-t mt-2">
                    <span>Total (c/IVA)</span>
                    <span>${computed.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4 mr-1" /> Cancelar
            </Button>
            <Button onClick={save}>
              <Save className="w-4 h-4 mr-1" /> Guardar cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Buscador */}
      <ProductSearchModal
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onPick={handleAddFromPicker}
        inOrder={inOrderMap}
      />
    </>
  );
}

export { EditOrderModal };
