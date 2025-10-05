import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Minus, Plus } from "lucide-react";
import { api } from "@/lib/api";
import type { Product } from "@/types/domain";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (payload: { product: Product; quantity: number; discountPercent: number }) => void;
  initialCategory?: string;
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

export default function ProductSearchModal({ open, onOpenChange, onPick, initialCategory }: Props) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(initialCategory ?? "all");
  const [codeLetters, setCodeLetters] = useState("");
  const [codeNumbers, setCodeNumbers] = useState("");

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [rowQty, setRowQty] = useState<Record<string, number>>({});
  const [rowDisc, setRowDisc] = useState<Record<string, number>>({});

  const setQty = (id: string, v: number) =>
    setRowQty((m) => ({ ...m, [id]: Math.max(1, Math.floor(v || 1)) }));
  const incQty = (id: string, step = 1) =>
    setRowQty((m) => ({ ...m, [id]: Math.max(1, Math.floor((m[id] ?? 1) + step)) }));
  const decQty = (id: string, step = 1) =>
    setRowQty((m) => ({ ...m, [id]: Math.max(1, Math.floor((m[id] ?? 1) - step)) }));

  const setDisc = (id: string, v: number) =>
    setRowDisc((m) => ({
      ...m,
      [id]: Math.min(100, Math.max(0, isFinite(v) ? v : 0)),
    }));

  const debouncedKey = useMemo(
    () => JSON.stringify({ q, category, codeLetters, codeNumbers, open }),
    [q, category, codeLetters, codeNumbers, open]
  );

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
        params.sortBy = "name";
        params.sortDir = "asc";

        const resp = await api.get<any>("/products", params);
        const list = normalizeProducts(resp);
        setResults(list);

        setRowQty((prev) => {
          const next = { ...prev };
          for (const p of list) if (!next[p.id]) next[p.id] = 1;
          return next;
        });
        setRowDisc((prev) => {
          const next = { ...prev };
          for (const p of list) if (typeof next[p.id] !== "number") next[p.id] = 0;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* ✅ no sobresale y es responsive */}
      <DialogContent className="w-[96vw] sm:max-w-4xl md:max-w-5xl p-0 max-h-[90vh] overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Buscar productos</DialogTitle>
        </DialogHeader>

        {/* Filtros */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="col-span-1">
              <Label htmlFor="category">Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="remeras">Remeras</SelectItem>
                  <SelectItem value="pantalones">Pantalones</SelectItem>
                  <SelectItem value="zapatillas">Zapatillas</SelectItem>
                  <SelectItem value="accesorios">Accesorios</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                  onChange={(e) =>
                    setCodeNumbers(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  maxLength={6}
                  inputMode="numeric"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Combinamos ambos para buscar por SKU (ej. ABC%123%).
              </p>
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

            {/* ✅ altura controlada, sin overflow del modal */}
            <ScrollArea className="max-h-[48vh] md:max-h-[60vh]">
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
                    const qty = rowQty[p.id] ?? 1;
                    const disc = rowDisc[p.id] ?? 0;
                    return (
                      <tr key={p.id} className="border-b hover:bg-accent/30">
                        <td className="px-3 py-2 align-middle">{p.sku}</td>
                        <td className="px-3 py-2 align-middle">{p.name}</td>
                        <td className="px-3 py-2 align-middle text-right">
                          ${Number(p.price ?? 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 align-middle text-center">
                          {Math.max(0, Number(p.stock ?? 0) - Number(p.reserved ?? 0))}
                        </td>

                        <td className="px-3 py-2 align-middle">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => decQty(p.id)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              className="w-16 text-center"
                              type="number"
                              min={1}
                              value={qty}
                              onChange={(e) => setQty(p.id, parseInt(e.target.value || "1", 10))}
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => incQty(p.id)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>

                        <td className="px-3 py-2 align-middle">
                          <div className="flex items-center justify-center">
                            <Input
                              className="w-20 text-center"
                              type="number"
                              min={0}
                              max={100}
                              step="0.5"
                              value={disc}
                              onChange={(e) =>
                                setDisc(p.id, Math.min(100, Math.max(0, parseFloat(e.target.value || "0"))))
                              }
                            />
                          </div>
                        </td>

                        <td className="px-3 py-2 align-middle text-center">
                          <Button
                            size="sm"
                            onClick={() =>
                              onPick({
                                product: p,
                                quantity: qty,
                                discountPercent: disc,
                              })
                            }
                          >
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

export { ProductSearchModal };
