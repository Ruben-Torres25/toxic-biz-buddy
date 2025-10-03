import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
import { Search, Package, X, CornerDownLeft, Type, Hash } from "lucide-react";
import clsx from "clsx";

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

const ALL = "__ALL__";
const RECENTS_KEY = "product-search:recents:v1";
const MAX_RECENTS = 8;

function normalizeProducts(resp: SearchResponse): Product[] {
  if (!resp) return [];
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp.items)) return resp.items;
  if (Array.isArray(resp.data)) return resp.data;
  if (Array.isArray(resp.results)) return resp.results;
  return [];
}

function loadRecents(): Product[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveRecent(p: Product) {
  const recents = loadRecents();
  const next = [p, ...recents.filter((r) => r.id !== p.id)].slice(0, MAX_RECENTS);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
}

export default function ProductSearchModal({
  open,
  onOpenChange,
  onPick,
  defaultCategory = null,
}: Props) {
  // filtros
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>(defaultCategory || "");
  const [codeLetters, setCodeLetters] = useState(""); // 🔤
  const [codeDigits, setCodeDigits] = useState("");   // #️⃣

  // datos
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [recents, setRecents] = useState<Product[]>([]);

  // teclado/foco
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const categoryUIValue = category ? category : ALL;

  useEffect(() => {
    if (!open) return;
    setRecents(loadRecents());
    (async () => {
      try {
        const resp = await api.get<any>("/products", {
          limit: 200,
          sortBy: "name",
          sortDir: "asc",
        });
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

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const queryParams = useMemo(() => {
    const base: Record<string, string> = {};
    if (q.trim()) base.q = q.trim();
    if (category) base.category = category;
    if (codeLetters.trim()) base.codeLetters = codeLetters.trim();
    if (codeDigits.trim()) base.codeDigits = codeDigits.trim();

    base.sortBy = "name";
    base.sortDir = "asc";
    base.limit = "20";
    return base;
  }, [q, category, codeLetters, codeDigits]);

  // búsqueda con debounce
  useEffect(() => {
    if (!open) return;

    const noFilters = !q.trim() && !category && !codeLetters.trim() && !codeDigits.trim();
    if (noFilters) {
      setResults([]);
      setLoading(false);
      setActiveIndex(-1);
      return;
    }

    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const resp = await api.get<any>("/products", queryParams);
        const items = normalizeProducts(resp);
        setResults(items);
        setActiveIndex(items.length ? 0 : -1);
      } catch {
        setResults([]);
        setActiveIndex(-1);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [open, queryParams, q, category, codeLetters, codeDigits]);

  // reset al cerrar
  useEffect(() => {
    if (!open) {
      setQ("");
      setCategory(defaultCategory || "");
      setCodeLetters("");
      setCodeDigits("");
      setResults([]);
      setLoading(false);
      setActiveIndex(-1);
    }
  }, [open, defaultCategory]);

  const selectProduct = useCallback(
    (p: Product) => {
      saveRecent(p);
      onPick(p);
      onOpenChange(false);
    },
    [onPick, onOpenChange]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
      return;
    }
    const list = results.length ? results : (!q && !category && !codeLetters && !codeDigits ? recents : []);
    if (!list.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((idx) => Math.min(idx + 1, list.length - 1));
      scrollIntoView(Math.min(activeIndex + 1, list.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((idx) => Math.max(idx - 1, 0));
      scrollIntoView(Math.max(activeIndex - 1, 0));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const pick = list[activeIndex] ?? list[0];
      if (pick) selectProduct(pick);
    }
  };

  const scrollIntoView = (index: number) => {
    const container = tableRef.current;
    if (!container) return;
    const row = container.querySelector<HTMLTableRowElement>(
      `tr[data-row="${index}"]`
    );
    if (!row) return;
    const cTop = container.scrollTop;
    const cBottom = cTop + container.clientHeight;
    const rTop = row.offsetTop;
    const rBottom = rTop + row.clientHeight;
    if (rTop < cTop) container.scrollTop = rTop - 8;
    else if (rBottom > cBottom) container.scrollTop = rBottom - container.clientHeight + 8;
  };

  const renderRows = (list: Product[]) => {
    if (loading) {
      return (
        <tr>
          <td colSpan={7} className="py-6 px-3 text-center text-muted-foreground">
            Buscando…
          </td>
        </tr>
      );
    }
    if (!list.length) {
      return (
        <tr>
          <td colSpan={7} className="py-6 px-3 text-center text-muted-foreground">
            Sin resultados con esos filtros.
          </td>
        </tr>
      );
    }
    return list.map((p, i) => {
      const price = Number(p.price ?? 0);
      const stock = Number(p.stock ?? 0);
      const reserved = Number(p.reserved ?? 0);
      const available = Math.max(0, Number(p.available ?? stock - reserved));
      const categoryText = (p as any).category ?? "-";
      const isActive = i === activeIndex;

      return (
        <tr
          key={p.id}
          data-row={i}
          className={clsx(
            "border-b transition-colors cursor-pointer",
            isActive ? "bg-accent/40" : "hover:bg-accent/30"
          )}
          onMouseEnter={() => setActiveIndex(i)}
          onClick={() => selectProduct(p)}
        >
          <td className="py-2 px-3 text-sm">{p.sku}</td>
          <td className="py-2 px-3 text-sm">{p.name}</td>
          <td className="py-2 px-3 text-sm">{categoryText}</td>
          <td className="py-2 px-3 text-right text-sm">${price.toFixed(2)}</td>
          <td className="py-2 px-3 text-center text-sm">{stock}</td>
          <td className="py-2 px-3 text-center text-sm">{available}</td>
          <td className="py-2 px-3 text-center">
            <Button size="sm" onClick={() => selectProduct(p)}>
              Seleccionar
            </Button>
          </td>
        </tr>
      );
    });
  };

  const showRecents = !q.trim() && !category && !codeLetters.trim() && !codeDigits.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw]" onKeyDown={onKeyDown}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Buscar producto
            <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
              Enter para agregar <CornerDownLeft className="w-3 h-3" />
            </span>
          </DialogTitle>
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
              ref={inputRef}
              className="mt-1"
              placeholder="Nombre, SKU, categoría, código…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActiveIndex(-1);
              }}
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
              onValueChange={(v) => {
                setCategory(v === ALL ? "" : v);
                setActiveIndex(-1);
              }}
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

          {/* código dividido: letras y números */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Letras (SKU)</span>
            </div>
            <Input
              className="mt-1"
              placeholder="Ej: ABC"
              value={codeLetters}
              onChange={(e) => {
                // Permitimos solo letras/guiones para limpiar un poco (opcional)
                const clean = e.target.value.replace(/[^a-zA-Z\-]/g, "");
                setCodeLetters(clean);
                setActiveIndex(-1);
              }}
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Números</span>
            </div>
            <Input
              className="mt-1"
              placeholder="Ej: 123"
              inputMode="numeric"
              value={codeDigits}
              onChange={(e) => {
                const clean = e.target.value.replace(/\D/g, "");
                setCodeDigits(clean);
                setActiveIndex(-1);
              }}
            />
          </div>
        </div>

        {/* Resultados */}
        <div className="border rounded-md overflow-hidden">
          <div ref={tableRef} className="max-h-[50vh] overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">SKU</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Producto</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Categoría</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">Precio</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Stock</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">Disp.</th>
                  <th className="py-2 px-3 text-xs font-semibold text-muted-foreground">Acción</th>
                </tr>
              </thead>
              <tbody>
                {(!q.trim() && !category && !codeLetters.trim() && !codeDigits.trim())
                  ? (recents.length ? renderRows(recents) : (
                    <tr>
                      <td colSpan={7} className="py-6 px-3 text-center text-muted-foreground">
                        No hay recientes. Empezá buscando arriba ↑
                      </td>
                    </tr>
                  ))
                  : renderRows(results)
                }
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
