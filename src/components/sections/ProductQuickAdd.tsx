import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductsAPI } from "@/services/products.api";
import type { Product } from "@/types/domain";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { money } from "@/utils/format";

export type ProductQuickAddHandle = {
  focus: () => void;
  pickFirst: () => void;
  pickHighlighted: () => void;
  hasResults: () => boolean;
  openHint: () => void;
};

type Props = {
  onPick: (product: Product) => void;
  autoFocus?: boolean;
  placeholder?: string;
  minChars?: number;
};

const ProductQuickAdd = forwardRef<ProductQuickAddHandle, Props>(
  (
    {
      onPick,
      autoFocus = true,
      placeholder = "Escaneá / escribí nombre o SKU…",
      minChars = 1,
    },
    ref
  ) => {
    const [q, setQ] = useState("");
    const [highlight, setHighlight] = useState<number>(0);
    const [forceHint, setForceHint] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (autoFocus) inputRef.current?.focus();
    }, [autoFocus]);

    const enabled = q.trim().length >= minChars;

    const { data, isFetching } = useQuery({
      queryKey: ["quick-products", q],
      queryFn: () =>
        ProductsAPI.search({
          q,
          page: 1,
          limit: 8,
          sortBy: "name",
          sortDir: "asc",
        }),
      enabled,
      staleTime: 5_000,
    });

    const items: Product[] = useMemo(() => data?.items ?? [], [data]);

    // apertura del popover
    const open = forceHint || (enabled && (isFetching || items.length > 0));

    useEffect(() => {
      setHighlight(0);
      if (q.trim().length > 0 && forceHint) setForceHint(false);
    }, [q, items.length]);

    function pick(idx: number) {
      const p = items[idx];
      if (!p) return;
      onPick(p);
      setQ("");
      setForceHint(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      pickFirst: () => pick(0),
      pickHighlighted: () => pick(highlight),
      hasResults: () => items.length > 0,
      openHint: () => {
        setForceHint(true);
        requestAnimationFrame(() => inputRef.current?.focus());
      },
    }));

    return (
      <Popover open={open} onOpenChange={(o) => !o && setForceHint(false)}>
        <PopoverTrigger asChild>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholder}
              className="pl-10"
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlight((h) => Math.min(h + 1, Math.max(0, items.length - 1)));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlight((h) => Math.max(0, h - 1));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (items.length > 0) pick(highlight);
                } else if (e.key === "Escape") {
                  setForceHint(false);
                }
              }}
            />
          </div>
        </PopoverTrigger>

        <PopoverContent align="start" className="p-0 w-[min(680px,95vw)]">
          <div className="max-h-[320px] overflow-auto">
            {!enabled && !isFetching && !items.length ? (
              <div className="p-3 text-sm text-muted-foreground">
                Escribí al menos {minChars} carácter{minChars > 1 ? "es" : ""} para buscar.
              </div>
            ) : isFetching ? (
              <div className="p-3 text-sm text-muted-foreground">Buscando…</div>
            ) : !items.length ? (
              <div className="p-3 text-sm text-muted-foreground">Sin resultados</div>
            ) : (
              items.map((p, idx) => (
                <button
                  key={p.id}
                  onMouseEnter={() => setHighlight(idx)}
                  onClick={() => pick(idx)}
                  className={cn(
                    "w-full text-left px-3 py-2 border-b last:border-b-0",
                    "hover:bg-accent/40 transition-colors",
                    idx === highlight && "bg-accent/30"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">{p.sku}</Badge>
                        <span className="font-medium truncate">{p.name}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {p.category || "—"} · {p.id.slice(0, 8)}…
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-sm text-muted-foreground">Stock: {p.stock ?? 0}</span>
                      <span className="tabular-nums">{money(p.price)}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

export default ProductQuickAdd;
