import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types/domain";

export type ViewProductModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: (Partial<Product> & { minStock?: number; supplier?: string }) | null;
};

export function ViewProductModal({ open, onOpenChange, product }: ViewProductModalProps) {
  const p = product ?? undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Detalle de producto</DialogTitle>
        </DialogHeader>

        {!p ? (
          <div className="text-sm text-muted-foreground">No hay producto seleccionado.</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">SKU</Label>
                <div className="font-mono">{p.sku ?? "-"}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">ID</Label>
                <div className="text-xs text-muted-foreground break-all font-mono">{p.id}</div>
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Nombre</Label>
                <div className="font-medium">{p.name ?? "-"}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Categoría</Label>
                <div>{p.category ? <Badge variant="outline">{p.category}</Badge> : "—"}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Código de barras</Label>
                <div className="font-mono">{p.barcode ?? "—"}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Precio</Label>
                <div>${Number(p.price ?? 0).toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Stock</Label>
                <div>{p.stock ?? 0}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Disponible</Label>
                <div>{Math.max(0, Number(p.available ?? ((p.stock ?? 0) - (p.reserved ?? 0))))}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Stock mínimo (opcional)</Label>
                <div>{p.minStock ?? "—"}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Proveedor (opcional)</Label>
                <div>{p.supplier ?? "—"}</div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
