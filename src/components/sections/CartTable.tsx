import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CartLine } from "@/types/sales";
import { money, number } from "@/utils/format";

type Props = {
  lines: CartLine[];
  onQty: (id: string, qty: number) => void;
  onPrice: (id: string, price: number) => void;
  onDiscount: (id: string, discount: number) => void;
  onRemove: (id: string) => void;
};

export default function CartTable({ lines, onQty, onPrice, onDiscount, onRemove }: Props) {
  return (
    <div className="overflow-auto border rounded-md">
      <table className="w-full text-sm">
        <colgroup>
          <col className="w-[110px]" />
          <col />
          <col className="w-[90px]" />
          <col className="w-[130px]" />
          <col className="w-[130px]" />
          <col className="w-[140px]" />
          <col className="w-[70px]" />
        </colgroup>
        <thead className="sticky top-0 bg-muted/50 backdrop-blur z-10">
          <tr className="border-b">
            <th className="text-left px-3 py-3.5">SKU</th>
            <th className="text-left px-3 py-3.5">Producto</th>
            <th className="text-center px-3 py-3.5">Cant.</th>
            <th className="text-right px-3 py-3.5">Precio</th>
            <th className="text-right px-3 py-3.5">Desc. ($)</th>
            <th className="text-right px-3 py-3.5">Subtotal</th>
            <th className="text-right px-3 py-3.5"> </th>
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                Vacío. Escaneá o buscá productos para agregarlos.
              </td>
            </tr>
          ) : (
            lines.map((l, idx) => {
              const subtotal = l.price * l.qty - (l.discount || 0);
              return (
                <tr key={l.productId} className={cn("border-b align-middle", idx % 2 ? "bg-accent/10" : "", "hover:bg-accent/30")}>
                  <td className="px-3 py-3.5 whitespace-nowrap">
                    <Badge variant="outline" className="font-mono">{l.sku ?? "—"}</Badge>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="leading-tight">
                      <div className="font-medium">{l.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{l.productId.slice(0, 8)}…</div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <Input type="number" inputMode="numeric" className="h-8 w-[80px] text-center"
                      value={l.qty} onChange={(e) => onQty(l.productId, Number(e.target.value))}
                      onFocus={(e) => e.currentTarget.select()} min={1} />
                  </td>
                  <td className="px-3 py-3.5 text-right tabular-nums whitespace-nowrap">
                    <Input type="number" step="0.01" className="h-8 w-[120px] text-right"
                      value={l.price} onChange={(e) => onPrice(l.productId, Number(e.target.value))}
                      onFocus={(e) => e.currentTarget.select()} min={0} />
                  </td>
                  <td className="px-3 py-3.5 text-right tabular-nums whitespace-nowrap">
                    <Input type="number" step="0.01" className="h-8 w-[120px] text-right"
                      value={l.discount || 0} onChange={(e) => onDiscount(l.productId, Number(e.target.value))}
                      onFocus={(e) => e.currentTarget.select()} min={0} />
                  </td>
                  <td className="px-3 py-3.5 text-right tabular-nums whitespace-nowrap">{money(subtotal)}</td>
                  <td className="px-3 py-3.5">
                    <div className="flex justify-end">
                      <Button size="icon" variant="outline" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onRemove(l.productId)} aria-label="Quitar" title="Quitar">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
        {lines.length > 0 && (
          <tfoot>
            <tr>
              <td colSpan={7} className="px-4 py-2 text-[12px] text-muted-foreground text-right">
                {number(lines.length)} ítems
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
