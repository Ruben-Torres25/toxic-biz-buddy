import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProductsAPI } from "@/services/products.api";
import { useToast } from "@/hooks/use-toast";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ManageCategoriesModal } from "@/components/modals/ManageCategoriesModal";
import { CategoriesRepo } from "@/services/categories";
import { FolderPlus } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewProductModal({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    category: "",
    barcode: "",
    price: "",
    stock: "",
    minStock: "", // 👈 NUEVO
  });

  const [nextSku, setNextSku] = useState<string>("");
  const [catModal, setCatModal] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => CategoriesRepo.list(),
    initialData: [],
  });

  useEffect(() => {
    if ((categories?.length ?? 0) === 0) {
      CategoriesRepo.discoverFromBackend().then((cats) =>
        qc.setQueryData(["categories"], cats)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createMutation = useMutation({
    mutationFn: () => {
      const payload: any = {
        name: form.name.trim(),
        category: form.category.trim() || undefined,
        barcode: form.barcode.trim() || undefined,
        price: Number(form.price),
        stock: Number(form.stock), // stock inicial
      };
      // minStock opcional
      if (form.minStock.trim() !== "" && Number.isInteger(Number(form.minStock)) && Number(form.minStock) >= 0) {
        payload.minStock = Number(form.minStock);
      }
      return ProductsAPI.create(payload);
    },
    onSuccess: () => {
      toast({ title: "Producto agregado", description: "Se registró correctamente." });
      qc.invalidateQueries({ queryKey: ["products"] });
      onOpenChange(false);
      setForm({ name: "", category: "", barcode: "", price: "", stock: "", minStock: "" });
      setNextSku("");
    },
    onError: (e: any) => {
      toast({ title: "No se pudo crear", description: e?.message ?? "Error desconocido", variant: "destructive" });
    },
  });

  function canSave() {
    const price = Number(form.price);
    const stock = Number(form.stock);
    const minStockOk =
      form.minStock === "" ||
      (Number.isInteger(Number(form.minStock)) && Number(form.minStock) >= 0);

    return (
      form.name.trim().length > 0 &&
      Number.isFinite(price) &&
      price >= 0 &&
      Number.isInteger(stock) &&
      stock >= 0 &&
      minStockOk
    );
  }

  async function fetchNext() {
    try {
      const res = await ProductsAPI.nextSku({
        category: form.category || undefined,
        name: form.name || undefined,
      });
      setNextSku(res.next);
    } catch {
      setNextSku("");
    }
  }

  useEffect(() => {
    if (open) fetchNext();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(fetchNext, 180);
    return () => clearTimeout(t);
  }, [form.category, form.name]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Nuevo producto</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Próximo SKU sugerido: <span className="font-mono">{nextSku || "..."}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Detergente Industrial"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Categoría</Label>
              <div className="flex gap-2">
                <Select
                  value={form.category || undefined}
                  onValueChange={(val) => setForm((f) => ({ ...f, category: val }))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">Sin categorías</div>
                    ) : (
                      categories
                        .filter((c) => !!c && c.trim().length > 0)
                        .map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCatModal(true)}
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Nueva categoría
                </Button>
              </div>
            </div>
            <div>
              <Label>Código de barras (opcional)</Label>
              <Input
                value={form.barcode}
                onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                placeholder="EAN/UPC"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Precio</Label>
              <Input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="85.00"
              />
            </div>
            <div>
              <Label>Stock inicial</Label>
              <Input
                type="number"
                step="1"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                placeholder="50"
              />
            </div>
            <div>
              <Label>Stock mínimo (opcional)</Label>
              <Input
                type="number"
                step="1"
                value={form.minStock}
                onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))}
                placeholder="10"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => createMutation.mutate()} disabled={!canSave() || createMutation.isPending}>
            {createMutation.isPending ? "Guardando…" : "Agregar Producto"}
          </Button>
        </DialogFooter>

        <ManageCategoriesModal open={catModal} onOpenChange={setCatModal} />
      </DialogContent>
    </Dialog>
  );
}
