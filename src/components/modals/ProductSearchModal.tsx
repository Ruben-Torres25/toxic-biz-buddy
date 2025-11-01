// src/components/modals/ProductSearchModal.tsx
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Minus, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { api } from "@/lib/api";
import type { Product } from "@/types/domain";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (payload: { product: Product; quantity: number; discountPercent: number }) => void;
  initialCategory?: string;
  /** Cantidades ya elegidas en el pedido (fuera del modal): { [productId]: qty } */
  inOrder?: Record<string, number>;
};

function normalizeProducts(resp: any): Product[] {
  if (Array.isArray(resp)) return resp as Product[];
  if (resp && typeof resp === "object") {
    if (Array.isArray(resp.items)) return resp.items as Product[];
    if (Array.isArray(resp.data)) return resp.data as Product[];
    if (Array.isArray(resp.results)) return resp.results as Product[];
  }
  return [];
}

function buildSkuQuery(letters: string, numbers: string) {
  const L = letters.trim().toUpperCase().replace(/[^A-Z]/g, "");
  const N = numbers.trim().replace(/[^0-9]/g, "");
  if (!L && !N) return undefined;
  if (L && N) return `${L}%${N}%`;
  if (L) return `${L}%`;
  return `%${N}%`;
}

function categoryOf(p: any): string {
  return (p?.category?.name ?? p?.category ?? "").toString().trim();
}

export default function ProductSearchModal({
  open,
  onOpenChange,
  onPick,
  initialCategory,
  inOrder = {},
}: Props) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(initialCategory ?? "all");
  const [codeLetters, setCodeLetters] = useState("");
  const [codeNumbers, setCodeNumbers] = useState("");

  // Categorías dinámicas
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  // Ordenamiento
  type SortBy = "name" | "price" | "stock" | "sku";
  type SortDir = "asc" | "desc";
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Estados por fila (placeholders invisibles: qty→"1", disc→"0")
  const [rowQty, setRowQty] = useState<Record<string, number | undefined>>({});
  const [rowDisc, setRowDisc] = useState<Record<string, number | undefined>>({});

  // key para “debounce”
  const debouncedKey = useMemo(
    () => JSON.stringify({ q, category, codeLetters, codeNumbers, open, sortBy, sortDir }),
    [q, category, codeLetters, codeNumbers, open, sortBy, sortDir]
  );

  // Carga de categorías al abrir
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const resp = await api.get<any>("/products", {
          limit: "1000",
          sortBy: "category",
          sortDir: "asc",
        });
        const all = normalizeProducts(resp);
        const setCats = new Set<string>();
        for (const p of all) {
          const c = categoryOf(p);
          if (c) setCats.add(c);
        }
        const cats = Array.from(setCats).sort((a, b) => a.localeCompare(b));
        setCategoryOptions(cats);
        if (initialCategory && cats.includes(initialCategory)) {
          setCategory(initialCategory);
        }
      } catch {
        setCategoryOptions((prev) => (prev.length ? prev : []));
      }
    })();
  }, [open, initialCategory]);

  // Carga productos (debounced)
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, string> = {};
        const free = q.trim();
        const cat = category !== "all" ? category.trim() : "";
        const skuQuery = buildSkuQuery(codeLetters, codeNumbers);

        if (free) params.q = free;
        if (cat) params.category = cat;
        if (skuQuery) params.sku = skuQuery;
        params.limit = "25";
        params.sortBy = sortBy;
        params.sortDir = sortDir;

        const resp = await api.get<any>("/products", params);
        const list = normalizeProducts(resp);

        const sorted = sortProducts(list, sortBy, sortDir);
        setResults(sorted);

        setRowQty((prev) => {
          const next: Record<string, number | undefined> = { ...prev };
          for (const p of sorted) if (!(p.id in next)) next[p.id] = undefined; // placeholder "1"
          return next;
        });
        setRowDisc((prev) => {
          const next: Record<string, number | undefined> = { ...prev };
          for (const p of sorted) if (!(p.id in next)) next[p.id] = undefined; // placeholder "0"
          return next;
        });
      } catch (e: any) {
        setError(e?.message ?? "No se pudo buscar productos");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [debouncedKey]);

  // ==== Stock / disponibilidad ====
  const availableBase = (p: Product) =>
    (typeof p.available === "number"
      ? p.available
      : Math.max(0, Number(p.stock ?? 0) - Number(p.reserved ?? 0))) || 0;

  const visibleAvailable = (p: Product) => {
    const base = availableBase(p);
    const alreadyInOrder = inOrder[p.id] ?? 0;
    return Math.max(0, base - alreadyInOrder);
  };

  // Clamp helpers por fila
  const clampQtyForProduct = (p: Product, value: number) => {
    const disp = visibleAvailable(p);
    const min = 1;
    const max = Math.max(1, disp);
    return Math.min(max, Math.max(min, Math.floor(value || 1)));
  };

  const setQtyForProduct = (p: Product, v: number | undefined) => {
    if (v === undefined || Number.isNaN(v)) {
      setRowQty((m) => ({ ...m, [p.id]: undefined })); // placeholder "1"
      return;
    }
    setRowQty((m) => ({ ...m, [p.id]: clampQtyForProduct(p, v) }));
  };

  const setDiscForProduct = (p: Product, v: number | undefined) => {
    if (v === undefined || Number.isNaN(v)) {
      setRowDisc((m) => ({ ...m, [p.id]: undefined })); // placeholder "0"
      return;
    }
    const clamped = Math.min(100, Math.max(0, v));
    setRowDisc((m) => ({ ...m, [p.id]: clamped }));
  };

  const incQtyForProduct = (p: Product, step = 1) => {
    setRowQty((m) => {
      const current = m[p.id] ?? 1;
      return { ...m, [p.id]: clampQtyForProduct(p, current + step) };
    });
  };

  const decQtyForProduct = (p: Product, step = 1) => {
    setRowQty((m) => {
      const current = m[p.id] ?? 1;
      return { ...m, [p.id]: clampQtyForProduct(p, current - step) };
    });
  };

  // Agregar al pedido
  const add = (p: Product) => {
    const disp = visibleAvailable(p);
    if (disp <= 0) return;

    const rawQty = rowQty[p.id];
    const qty = clampQtyForProduct(p, rawQty ?? 1); // si está vacío, usa 1

    const rawDisc = rowDisc[p.id];
    const disc = Math.min(100, Math.max(0, rawDisc ?? 0)); // si está vacío, usa 0

    if (qty <= 0) return;

    onPick({ product: p, quantity: qty, discountPercent: disc });

    // Reset fila: cantidad y descuento vacíos (placeholders)
    setRowQty((m) => ({ ...m, [p.id]: undefined }));
    setRowDisc((m) => ({ ...m, [p.id]: undefined }));
  };

  // Toggle minimalista para dirección —> junto a “Ordenar por”
  const toggleDir = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[96vw] sm:max-w-4xl md:max-w-5xl p-0 max-h-[90vh] overflow-hidden"
        aria-describedby={undefined}
      >
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Buscar productos</DialogTitle>
        </DialogHeader>

        {/* Filtros */}
        <div className="px-6 pb-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="col-span-1">
              <Label htmlFor="free">Búsqueda libre</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="free"
                  className="pl-8"
                  placeholder="Nombre, código, categoría..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            </div>

            {/* Categoría (sin botón de dirección aquí) */}
            <div className="col-span-1">
              <Label htmlFor="category">Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                  {initialCategory && !categoryOptions.includes(initialCategory) && (
                    <SelectItem value={initialCategory}>{initialCategory}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Código (letras + números) */}
            <div className="col-span-1">
              <Label>Código (letras + números)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="ABC"
                  value={codeLetters}
                  onChange={(e) => setCodeLetters(e.target.value.toUpperCase())}
                  maxLength={6}
                />
                <Input
                  placeholder="123"
                  value={codeNumbers}
                  onChange={(e) => setCodeNumbers(e.target.value.replace(/[^0-9]/g, ""))}
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Combinamos ambos para buscar por SKU (ej. ABC%123%).
              </p>
            </div>
          </div>

          {/* Ordenar por + Dirección (flecha) — alineados en la misma fila */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-1">
              <Label htmlFor="sortBy">Ordenar por</Label>
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                  <SelectTrigger id="sortBy" className="flex-1">
                    <SelectValue placeholder="Campo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nombre</SelectItem>
                    <SelectItem value="price">Precio</SelectItem>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="sku">SKU</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 border border-border rounded-md"
                  onClick={toggleDir}
                  title={sortDir === "asc" ? "Ascendente" : "Descendente"}
                  aria-label={sortDir === "asc" ? "Ascendente" : "Descendente"}
                >
                  {sortDir === "asc" ? <ArrowUp className="h-5 w-5" /> : <ArrowDown className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="px-6 pb-6">
          <div className="border rounded-md">
            <div className="flex items-center justify-between p-3 text-sm text-muted-foreground">
              <span>{loading ? "Buscando…" : `Resultados: ${results.length}`}</span>
              {error && <span className="text-destructive">{error}</span>}
            </div>

            {/* Área scrolleable fija */}
            <ScrollArea className="h-[56vh] md:h-[60vh]">
              <table className="w-full text-sm table-fixed">
                <thead className="sticky top-0 bg-muted/50 backdrop-blur z-10">
                  <tr className="border-b">
                    <th className="text-left px-3 py-2 align-middle w-[18%]">SKU</th>
                    <th className="text-left px-3 py-2 align-middle">Producto</th>
                    <th className="text-right px-3 py-2 align-middle w-[12%]">Precio</th>
                    <th className="text-center px-3 py-2 align-middle w-[10%]">Disp.</th>
                    <th className="text-center px-3 py-2 align-middle w-[18%]">Cant.</th>
                    <th className="text-center px-3 py-2 align-middle w-[14%]">Desc. %</th>
                    <th className="text-center px-3 py-2 align-middle w-[12%]">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((p) => {
                    const disp = visibleAvailable(p);
                    const rawQty = rowQty[p.id];
                    const qty = clampQtyForProduct(p, (rawQty ?? 1));
                    const rawDisc = rowDisc[p.id];
                    const disc = Math.min(100, Math.max(0, rawDisc ?? 0));
                    const disableAdd = disp <= 0 || qty <= 0;

                    return (
                      <tr key={p.id} className="border-b hover:bg-accent/30">
                        <td className="px-3 py-2 align-middle">{(p as any).sku}</td>
                        <td className="px-3 py-2 align-middle">{(p as any).name}</td>
                        <td className="px-3 py-2 align-middle text-right">
                          ${Number((p as any).price ?? 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 align-middle text-center tabular-nums">
                          {disp}
                        </td>

                        {/* Cantidad con placeholder "1" */}
                        <td className="px-3 py-2 align-middle">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => decQtyForProduct(p)}
                              disabled={(rowQty[p.id] ?? 1) <= 1}
                              title="−1"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              className="w-16 text-center"
                              type="number"
                              min={1}
                              placeholder="1"
                              value={rawQty === undefined ? "" : String(rawQty)}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "") {
                                  setQtyForProduct(p, undefined);
                                } else {
                                  const n = parseInt(val, 10);
                                  setQtyForProduct(p, Number.isNaN(n) ? undefined : n);
                                }
                              }}
                              onBlur={(e) => {
                                if (e.currentTarget.value.trim() === "") {
                                  setQtyForProduct(p, undefined);
                                }
                              }}
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => incQtyForProduct(p)}
                              disabled={qty >= disp}
                              title="+1"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          {(rowQty[p.id] ?? 1) > disp && (
                            <div className="text-[11px] text-destructive mt-1 text-center">
                              Máximo disponible: {disp}
                            </div>
                          )}
                        </td>

                        {/* Descuento con placeholder "0" */}
                        <td className="px-3 py-2 align-middle">
                          <div className="flex items-center justify-center">
                            <Input
                              className="w-20 text-center"
                              type="number"
                              min={0}
                              max={100}
                              step="0.5"
                              placeholder="0"
                              value={rawDisc === undefined ? "" : String(rawDisc)}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "") {
                                  setDiscForProduct(p, undefined);
                                } else {
                                  const x = parseFloat(val);
                                  setDiscForProduct(p, Number.isNaN(x) ? undefined : x);
                                }
                              }}
                              onBlur={(e) => {
                                if (e.currentTarget.value.trim() === "") {
                                  setDiscForProduct(p, undefined);
                                }
                              }}
                            />
                          </div>
                        </td>

                        <td className="px-3 py-2 align-middle text-center">
                          <Button size="sm" onClick={() => add(p)} disabled={disableAdd}>
                            Agregar
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && results.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                        No hay productos que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function sortProducts(list: Product[], sortBy: "name" | "price" | "stock" | "sku", sortDir: "asc" | "desc"): Product[] {
  const dir = sortDir === "asc" ? 1 : -1;

  const getStock = (p: any) => {
    const stock = Number(p?.stock ?? 0);
    const reserved = Number(p?.reserved ?? 0);
    const available = Number.isFinite(stock - reserved) ? stock - reserved : stock;
    return Number.isFinite(p?.available) ? Number(p.available) : Math.max(0, available);
  };

  const cmp = (a: any, b: any) => {
    switch (sortBy) {
      case "price":
        return (Number(a?.price ?? 0) - Number(b?.price ?? 0)) * dir;
      case "stock":
        return (getStock(a) - getStock(b)) * dir;
      case "sku":
        return String(a?.sku ?? "").localeCompare(String(b?.sku ?? "")) * dir;
      case "name":
      default:
        return String(a?.name ?? "").localeCompare(String(b?.name ?? "")) * dir;
    }
  };

  return [...list].sort((a, b) => {
    const r = cmp(a, b);
    if (r !== 0) return r;
    return String((a as any).name ?? "").localeCompare(String((b as any).name ?? ""));
  });
}

export { ProductSearchModal };
