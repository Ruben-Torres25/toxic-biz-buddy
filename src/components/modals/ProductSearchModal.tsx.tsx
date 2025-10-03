// src/components/modals/ProductSearchModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Product } from "@/types/domain";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Barcode, Package, X } from "lucide-react";

type CodeMode =
  | "sku-contains"
  | "sku-exact"
  | "sku-starts"
  | "barcode-exact"
  | "barcode-contains";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (p: Product) => void;
  defaultCategory?: string | null;
};

type SearchResponse =
  | Product[]
  | { items?: Product[]; data?: Product[]; results?: Product[] }
  | undefined;

function normalizeProducts(resp: SearchResponse): Product[] {
  if (!resp) return [];
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp.items)) return resp.items;
  if (Array.isArray(resp.data)) return resp.data;
  if (Array.isArray(resp.results)) return resp.results;
  return [];
}

function buildCodeFilter(codeMode: CodeMode, codeValue: string) {
  const v = codeValue.trim();
  if (!v) return {};
  switch (codeMode) {
    case "sku-exact":
      return { sku: v };
    case "sku-starts":
      return { sku_starts: v }; // backend: ILIKE 'v%'
    case "sku-contains":
      return { sku_contains: v }; // backend: ILIKE '%v%'
    case "barcode-exact":
      return { barcode: v };
    case "barcode-contains":
      return { barcode_contains: v }; // backend: ILIKE '%v%'
    default:
      return {};
  }
}

export default function ProductSearchModal({
  open,
  onOpenChange,
  onPick,
  defaultCategory = null,
}: Props) {
  // estado filtros
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>(defaultCategory || "");
  const [codeMode, setCodeMode] = useState<CodeMode>("sku-contains");
  const [codeValue, setCodeValue] = useState("");

  // datos
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  // debounce
  const timerRef = useRef<number | null>(null);

  // sentinel para “Todas”
  const ALL = "__ALL__";
  const categoryUIValue = category ? category : ALL;

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const resp = await api.get<any>("/products", { limit: 200 });
        const items = normalizeProducts(resp);
        const cats = Array.from(
          new Set(
            items
              .map((p) => (p as any).category as string | undefined)
              .filter((c): c is string => !!c && c.trim().length > 0)
          )
        ).sort((a, b) => a.localeCompare(b));
        setCategories(cats);
      } catch {
        setCategories([]);
      }
    })();
  }, [open]);

  const queryParams = useMemo(() => {
    const base: Record<string, string> = {};
    if (q.trim()) base.q = q.trim();
    if (category) base.category = category;

    const code = buildCodeFilter(codeMode, codeValue);
    Object.entries(code).forEach(([k, v]) => (base[k] = String(v)));

    base.sortBy = "name";
    base.sortDir = "asc";
    base.limit = "20";
    return base;
  }, [q, category, codeMode, codeValue]);

  useEffect(() => {
    if (!open) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const resp = await api.get<any>("/products", queryParams);
        setResults(normalizeProducts(resp));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [open, queryParams]);

  useEffect(() => {
    if (!open) {
      setQ("");
      setCategory(defaultCategory || "");
      setCodeMode("sku-contains");
      setCodeValue("");
      setResults([]);
      setLoading(false);
    }
  }, [open, defaultCategory]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw]">
        <DialogHeader>
          <DialogTitle>Buscar producto</DialogTitle>
        </DialogHeader>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* libre */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Buscar</span>
            </div>
            <Input
              className="mt-1"
              placeholder="Nombre, SKU, categoría, código…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {/* categoría */}
          <div className="md:col-span-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Categoría</span>
            </div>
            <Select
              value={categoryUIValue}
              onValueChange={(v) => setCategory(v === ALL ? "" : v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* código */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-2">
              <Barcode className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Código</span>
            </div>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <Select
                value={codeMode}
                onValueChange={(v) => setCodeMode(v as CodeMode)}
              >
                <SelectTrigger className="whitespace-nowrap">
                  <SelectValue placeholder="Modo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sku-contains">SKU contiene</SelectItem>
                  <SelectItem value="sku-starts">SKU empieza</SelectItem>
                  <SelectItem value="sku-exact">SKU exacto</SelectItem>
                  <SelectItem value="barcode-contains">
                    Barras contiene
                  </SelectItem>
                  <SelectItem value="barcode-exact">Barras exacto</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder={
                  codeMode.startsWith("sku") ? "Ej: ABC123" : "Ej: 7791234567890"
                }
                value={codeValue}
                onChange={(e) => setCodeValue(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="border rounded-md overflow-hidden">
          <div className="max-h-[50vh] overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">
                    SKU
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">
                    Producto
                  </th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">
                    Categoría
                  </th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">
                    Precio
                  </th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">
                    Stock
                  </th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">
                    Disp.
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold text-muted-foreground">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-6 px-3 text-center text-muted-foreground">
                      Buscando…
                    </td>
                  </tr>
                ) : results.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 px-3 text-center text-muted-foreground">
                      Sin resultados con esos filtros.
                    </td>
                  </tr>
                ) : (
                  results.map((p) => {
                    const price = Number(p.price ?? 0);
                    const stock = Number(p.stock ?? 0);
                    const reserved = Number(p.reserved ?? 0);
                    const available = Math.max(
                      0,
                      Number(p.available ?? stock - reserved)
                    );
                    const category = (p as any).category ?? "-";
                    return (
                      <tr key={p.id} className="border-b hover:bg-accent/30 transition-colors">
                        <td className="py-2 px-3 text-sm">{p.sku}</td>
                        <td className="py-2 px-3 text-sm">{p.name}</td>
                        <td className="py-2 px-3 text-sm">{category}</td>
                        <td className="py-2 px-3 text-right text-sm">${price.toFixed(2)}</td>
                        <td className="py-2 px-3 text-center text-sm">{stock}</td>
                        <td className="py-2 px-3 text-center text-sm">{available}</td>
                        <td className="py-2 px-3 text-center">
                          <Button
                            size="sm"
                            onClick={() => {
                              onPick(p);
                              onOpenChange(false);
                            }}
                          >
                            Seleccionar
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2">
            <X className="w-4 h-4" />
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
