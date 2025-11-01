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

/** ================= Helpers ================= */
type SupplierOption = { id: string; name: string; alias?: string };

const API_BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ||
  (typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_API_BASE_URL) ||
  "http://localhost:3000";

const joinUrl = (base: string, path: string) => `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

async function fetchJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}. Respuesta: ${text.slice(0, 200)}`);
  if (!contentType.includes("application/json")) throw new Error(`Respuesta no JSON (${contentType}). ${text.slice(0,200)}`);
  return JSON.parse(text);
}
function pickArray<T = any>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// helpers num/format
const num = (v: string) => {
  const n = Number((v ?? "").toString().replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};
const fmt = (v: number) =>
  (Number.isFinite(v) ? v : 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function NewProductModal({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    category: "",
    barcode: "",
    // Bloque de precios
    basePrice: "", // costo
    marginPct: "0", // % margen (default 0)
    price: "",     // precio venta (se calcula o se puede ingresar)
    // stock
    stock: "",
    minStock: "",
    // proveedor
    supplierId: "", // OBLIGATORIO
  });

  const [nextSku, setNextSku] = useState<string>("");
  const [catModal, setCatModal] = useState(false);

  // Proveedores
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // Categorías
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

  // Cargar proveedores al abrir
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setLoadingSuppliers(true);
        const res = await fetchJSON(joinUrl(API_BASE_URL, "/suppliers"));
        const list = pickArray<any>(res).map((s: any) => ({
          id: String(s.id),
          name: String(s.name ?? ""),
          alias: s.alias ? String(s.alias) : undefined,
        })) as SupplierOption[];
        setSuppliers(list.filter(s => s.id && s.name));
      } catch (e: any) {
        toast({ title: "No se pudieron cargar proveedores", description: e?.message ?? "Error desconocido", variant: "destructive" });
        setSuppliers([]);
      } finally {
        setLoadingSuppliers(false);
      }
    })();
  }, [open, toast]);

  // Reacciones entre base/margen/precio
  const onChangeBase = (v: string) => {
    const b = num(v);
    const m = num(form.marginPct);
    if (Number.isFinite(b) && b >= 0 && Number.isFinite(m) && m >= 0) {
      const sale = Math.round((b * (1 + m / 100)) * 100) / 100;
      setForm(f => ({ ...f, basePrice: v, price: String(sale) }));
    } else {
      setForm(f => ({ ...f, basePrice: v }));
    }
  };
  const onChangeMargin = (v: string) => {
    const b = num(form.basePrice);
    const m = num(v);
    if (Number.isFinite(b) && b >= 0 && Number.isFinite(m) && m >= 0) {
      const sale = Math.round((b * (1 + m / 100)) * 100) / 100;
      setForm(f => ({ ...f, marginPct: v, price: String(sale) }));
    } else {
      setForm(f => ({ ...f, marginPct: v }));
    }
  };
  const onChangeSale = (v: string) => {
    const b = num(form.basePrice);
    const s = num(v);
    if (Number.isFinite(b) && b > 0 && Number.isFinite(s) && s >= 0) {
      const pct = ((s / b) - 1) * 100;
      const rounded = Math.round(pct * 100) / 100;
      setForm(f => ({ ...f, price: v, marginPct: String(rounded) }));
    } else {
      setForm(f => ({ ...f, price: v }));
    }
  };

  // Vista previa sugerida (coherencia entre base y margen)
  const previewPrice = (() => {
    const b = num(form.basePrice);
    const m = num(form.marginPct);
    if (!Number.isFinite(b) || b < 0 || !Number.isFinite(m) || m < 0) return null;
    return Math.round((b * (1 + m / 100)) * 100) / 100;
  })();

  // Mostrar hint solo si base>0, margen>0 y el sugerido difiere del ingresado
  const showPreviewHint = (() => {
    const b = num(form.basePrice);
    const m = num(form.marginPct);
    if (!Number.isFinite(b) || b <= 0) return false;
    if (!Number.isFinite(m) || m <= 0) return false;
    if (previewPrice == null || previewPrice <= 0) return false;
    const pv = Number(previewPrice);
    const entered = num(form.price);
    if (!Number.isFinite(entered)) return true;
    return Math.abs(pv - entered) > 0.005;
  })();

  const createMutation = useMutation({
    mutationFn: () => {
      const priceNum = num(form.price);
      const stockNum = Number(form.stock);
      const minStockNum = Number(form.minStock);
      const baseNum = num(form.basePrice);

      // Validaciones mínimas
      if (!form.supplierId) {
        throw new Error("Seleccioná un proveedor.");
      }
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        throw new Error("Precio de venta inválido.");
      }
      if (!Number.isInteger(stockNum) || stockNum < 0) {
        throw new Error("Stock inicial inválido.");
      }
      if (form.minStock.trim() !== "" && (!Number.isInteger(minStockNum) || minStockNum < 0)) {
        throw new Error("Stock mínimo inválido.");
      }

      const payload: any = {
        name: form.name.trim(),
        category: form.category.trim() || undefined,
        barcode: form.barcode.trim() || undefined,
        price: priceNum,     // Precio venta
        stock: stockNum,     // Stock inicial
        supplierId: form.supplierId, // VINCULACIÓN OBLIGATORIA
      };

      // minStock opcional
      if (form.minStock.trim() !== "" && Number.isInteger(minStockNum) && minStockNum >= 0) {
        payload.minStock = minStockNum;
      }

      // Costo base → lastPurchasePrice (si tu backend lo soporta)
      if (Number.isFinite(baseNum) && baseNum >= 0) {
        payload.lastPurchasePrice = baseNum;
      }

      return ProductsAPI.create(payload);
    },
    onSuccess: () => {
      toast({ title: "Producto agregado", description: "Se registró correctamente." });
      qc.invalidateQueries({ queryKey: ["products"] });
      onOpenChange(false);
      setForm({
        name: "",
        category: "",
        barcode: "",
        basePrice: "",
        marginPct: "0",
        price: "",
        stock: "",
        minStock: "",
        supplierId: "",
      });
      setNextSku("");
    },
    onError: (e: any) => {
      toast({ title: "No se pudo crear", description: e?.message ?? "Error desconocido", variant: "destructive" });
    },
  });

  function canSave() {
    const price = num(form.price);
    const stock = Number(form.stock);
    const minStockOk =
      form.minStock === "" ||
      (Number.isInteger(Number(form.minStock)) && Number(form.minStock) >= 0);

    return (
      form.name.trim().length > 0 &&
      !!form.supplierId &&
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
      <DialogContent className="max-w-xl" aria-describedby={undefined}>
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

          {/* Proveedor (OBLIGATORIO) */}
          <div>
            <Label>Proveedor</Label>
            <Select
              value={form.supplierId || undefined}
              onValueChange={(val) => setForm(f => ({ ...f, supplierId: val }))}
              disabled={loadingSuppliers}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loadingSuppliers ? "Cargando..." : "Seleccionar proveedor"} />
              </SelectTrigger>
              <SelectContent className="max-h-56 overflow-y-auto">
                {suppliers.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Sin proveedores</div>
                ) : (
                  suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}{s.alias ? ` (${s.alias})` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Categoría + botón */}
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
                {/* scroll si hay muchas */}
                <SelectContent className="max-h-56 overflow-y-auto">
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

          {/* Código de barras debajo de categoría */}
          <div>
            <Label>Código de barras</Label>
            <Input
              value={form.barcode}
              onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
              placeholder="EAN/UPC"
            />
          </div>

          {/* Bloque de costos/margen/precio */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Precio base (costo)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.basePrice}
                onChange={(e) => onChangeBase(e.target.value)}
                placeholder="1000.00"
              />
            </div>
            <div>
              <Label>% margen</Label>
              <Input
                type="number"
                step="0.5"
                min={0}
                value={form.marginPct}
                onChange={(e) => onChangeMargin(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Precio venta</Label>
              <Input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => onChangeSale(e.target.value)}
                placeholder="1000.00"
              />
              {showPreviewHint && previewPrice != null && previewPrice > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  Sugerido: <b>${fmt(previewPrice)}</b>
                </div>
              )}
            </div>
          </div>

          {/* Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
