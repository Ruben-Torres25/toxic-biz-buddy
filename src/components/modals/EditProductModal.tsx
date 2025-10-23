import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Product } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductsAPI } from "@/services/products.api";
import { Badge } from "@/components/ui/badge";

export type EditProductModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: (Partial<Product> & { supplier?: string }) | null;
  onSave?: (p?: any) => void;
};

export function EditProductModal({ open, onOpenChange, product, onSave }: EditProductModalProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const p = product ?? undefined;

  const [form, setForm] = useState({
    name: "",
    category: "",
    barcode: "",
    price: "",
    // stock: NO editable
    minStock: "",
    supplier: "",
  });

  useEffect(() => {
    if (open && p) {
      setForm({
        name: p.name ?? "",
        category: p.category ?? "",
        barcode: p.barcode ?? "",
        price: p.price != null ? String(p.price) : "",
        minStock: p.minStock != null ? String(p.minStock) : "",
        supplier: (p as any).supplier ?? "",
      });
    }
    if (open && !p) {
      setForm({ name: "", category: "", barcode: "", price: "", minStock: "", supplier: "" });
    }
  }, [open, p?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!p?.id) return;
      const payload: Partial<Product> = {
        name: form.name.trim(),
        category: form.category.trim() || undefined,
        barcode: form.barcode.trim() || undefined,
        price: form.price !== "" ? Number(form.price) : undefined,
      };
      if (form.minStock.trim() !== "") {
        payload.minStock = Number.isNaN(Number(form.minStock))
          ? undefined
          : Math.max(0, Math.trunc(Number(form.minStock)));
      } else {
        payload.minStock = null; // limpiar si lo vacían
      }
      return ProductsAPI.update(p.id, payload);
    },
    onSuccess: (saved) => {
      toast({ title: "Producto actualizado", description: "Se guardaron los cambios." });
      qc.invalidateQueries({ queryKey: ["products"] });
      onSave?.(saved);
      onOpenChange(false);
    },
    onError: (e: any) => {
      toast({ title: "No se pudo actualizar", description: e?.message ?? "Error desconocido", variant: "destructive" });
    },
  });

  const canSave =
    form.name.trim().length > 0 &&
    (form.price === "" || (!Number.isNaN(Number(form.price)) && Number(form.price) >= 0)) &&
    (form.minStock === "" || (Number.isInteger(Number(form.minStock)) && Number(form.minStock) >= 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar producto</DialogTitle>
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
              <div>
                <Label className="text-xs text-muted-foreground">Disponible</Label>
                <Badge variant="secondary">
                  {Math.max(0, Number(p.available ?? ((Number(p.stock ?? 0)) - (Number(p.reserved ?? 0)))))}
                </Badge>
              </div>
            </div>

            <div>
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoría</Label>
                <Input value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} />
              </div>
              <div>
                <Label>Código de barras</Label>
                <Input value={form.barcode} onChange={(e) => setForm(f => ({ ...f, barcode: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Precio</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                />
              </div>

              <div>
                <Label>Stock mínimo (opcional)</Label>
                <Input
                  type="number"
                  step="1"
                  value={form.minStock}
                  onChange={(e) => setForm(f => ({ ...f, minStock: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Proveedor (opcional)</Label>
                <Input value={form.supplier} onChange={(e) => setForm(f => ({ ...f, supplier: e.target.value }))} />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => updateMutation.mutate()} disabled={!p || !canSave || updateMutation.isPending}>
            {updateMutation.isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
