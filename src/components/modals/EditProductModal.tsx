import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Product } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProductsAPI } from "@/services/products.api";
import { SuppliersAPI } from "@/services/suppliers.api";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export type EditProductModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: (Partial<Product> & {
    supplier?: string;
    lastPurchasePrice?: number;
    last_purchase_price?: number;
    lastCost?: number;
    cost?: number;
    basePrice?: number;
  }) | null;
  onSave?: (p?: any) => void;
};

type SupplierOption = { id: string; name: string };

const fmt = (v: number) =>
  (Number.isFinite(v) ? v : 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const NONE = "__none__"; // centinela para "Sin proveedor"

// elige el costo desde varias posibles propiedades
const pickCost = (pp: any): number | null => {
  const candidates = [
    pp?.lastPurchasePrice,
    pp?.last_purchase_price,
    pp?.lastCost,
    pp?.cost,
    pp?.basePrice,
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n)) return n;
  }
  return null;
};

export function EditProductModal({ open, onOpenChange, product, onSave }: EditProductModalProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const p = product ?? undefined;

  // proveedores para el select
  const { data: supRes, isLoading: suppliersLoading } = useQuery({
    queryKey: ["suppliers", { page: 1, pageSize: 1000, q: "" }],
    queryFn: async () => {
      const res = await SuppliersAPI.list("", 1, 1000);
      const items = res?.items ?? res?.data ?? res?.results ?? (Array.isArray(res) ? res : []);
      return Array.isArray(items) ? items : [];
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const supplierOptions: SupplierOption[] = useMemo(
    () =>
      (supRes ?? [])
        .map((raw: any) => ({ id: String(raw?.id ?? ""), name: String(raw?.name ?? "") }))
        .filter((x) => x.id && x.name),
    [supRes]
  );

  const [form, setForm] = useState({
    name: "",
    category: "",
    barcode: "",
    // precios solo para mostrar (no se editan ni se envían)
    salePrice: "", // precio de venta (display)
    costPrice: "", // precio costo (display)
    minStock: "",
    supplierId: "",
  });

  // hidratar cuando abre/cambia el producto
  useEffect(() => {
    if (!open) return;

    if (p) {
      // deducir supplierId; si solo hay nombre, mapear a id
      let sid = (p as any).supplierId ?? (p as any).supplier_id ?? "";
      if (!sid && (p as any).supplier && supplierOptions.length > 0) {
        const match = supplierOptions.find(
          (s) => s.name.toLowerCase() === String((p as any).supplier).toLowerCase()
        );
        if (match) sid = match.id;
      }

      const sale = Number(p.price);
      const cost = pickCost(p);

      setForm({
        name: p.name ?? "",
        category: p.category ?? "",
        barcode: p.barcode ?? "",
        salePrice: Number.isFinite(sale) ? String(sale) : "",
        costPrice: cost != null ? String(cost) : "",
        minStock: p.minStock != null ? String(p.minStock) : "",
        supplierId: String(sid ?? ""),
      });
    } else {
      setForm({
        name: "",
        category: "",
        barcode: "",
        salePrice: "",
        costPrice: "",
        minStock: "",
        supplierId: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, p?.id, supplierOptions.length]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!p?.id) return;

      // Como los precios NO se editan, no los enviamos.
      const payload: Partial<Product> & { supplierId?: string | null } = {
        name: form.name.trim(),
        category: form.category.trim() || undefined,
        barcode: form.barcode.trim() || undefined,
      };

      if (form.minStock.trim() !== "") {
        const ms = Number(form.minStock);
        payload.minStock = Number.isInteger(ms) && ms >= 0 ? ms : undefined;
      } else {
        payload.minStock = null;
      }

      payload.supplierId = form.supplierId ? form.supplierId : null;

      return ProductsAPI.update(p.id, payload);
    },
    onSuccess: (saved) => {
      toast({ title: "Producto actualizado", description: "Se guardaron los cambios." });
      qc.invalidateQueries({ queryKey: ["products"] });
      onSave?.(saved);
      onOpenChange(false);
    },
    onError: (e: any) => {
      toast({
        title: "No se pudo actualizar",
        description: e?.message ?? "Error desconocido",
        variant: "destructive",
      });
    },
  });

  const canSave = form.name.trim().length > 0 && (form.minStock === "" || Number.isInteger(Number(form.minStock)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl" aria-describedby={undefined}>
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
                  {Math.max(0, Number(p.available ?? (Number(p.stock ?? 0) - Number(p.reserved ?? 0))))}
                </Badge>
              </div>
            </div>

            <div>
              <Label>Nombre</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoría</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                />
              </div>
              <div>
                <Label>Código de barras</Label>
                <Input
                  value={form.barcode}
                  onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                />
              </div>
            </div>

            {/* Precios: solo visualización, NO editables */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Precio costo</Label>
                <Input
                  value={
                    form.costPrice === ""
                      ? ""
                      : fmt(Number(form.costPrice))
                  }
                  placeholder="—"
                  readOnly
                  disabled
                />
              </div>
              <div>
                <Label>Precio venta</Label>
                <Input
                  value={
                    form.salePrice === ""
                      ? ""
                      : fmt(Number(form.salePrice))
                  }
                  placeholder="—"
                  readOnly
                  disabled
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Stock mínimo (opcional)</Label>
                <Input
                  type="number"
                  step="1"
                  value={form.minStock}
                  onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))}
                />
              </div>
              <div>
                <Label>Proveedor (opcional)</Label>
                <Select
                  value={form.supplierId ? form.supplierId : NONE}
                  onValueChange={(v) => setForm((f) => ({ ...f, supplierId: v === NONE ? "" : v }))}
                  disabled={suppliersLoading || updateMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={suppliersLoading ? "Cargando proveedores…" : "Seleccionar proveedor"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>— Sin proveedor —</SelectItem>
                    {supplierOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={!p || !canSave || updateMutation.isPending}
          >
            {updateMutation.isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
