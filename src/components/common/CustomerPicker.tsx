// src/components/common/CustomerPicker.tsx
import * as React from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Check, User2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomersAPI } from "@/services/customers.api";

export type CustomerOption = { id: string; name: string };

type Props = {
  value?: CustomerOption | null;
  onChange: (v: CustomerOption | null) => void;
  placeholder?: string;
};

function dedupeAndSort(list: CustomerOption[]): CustomerOption[] {
  // 1) Dedupe por ID (último en ganar por si hay nombres distintos)
  const map = new Map<string, CustomerOption>();
  for (const it of list) {
    if (!it?.id) continue;
    const name = (it.name || "").trim();
    map.set(it.id, { id: it.id, name: name || it.id });
  }
  // 2) Orden alfabético, acento-insensible
  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "es", { sensitivity: "base" })
  );
}

export function CustomerPicker({ value, onChange, placeholder = "Buscar cliente..." }: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [items, setItems] = React.useState<CustomerOption[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const ls = await CustomersAPI.list();
        if (!mounted) return;
        const raw = (ls ?? []).map((c: any) => ({
          id: String(c.id),
          name: String(c.name || c.code || c.document || c.id || "").trim(),
        }));
        setItems(dedupeAndSort(raw));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = React.useMemo(() => {
    if (!query) return items;
    const q = query.toLowerCase().trim();
    return items.filter((it) => it.name.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-[320px] justify-between">
          <span className="flex items-center gap-2 truncate">
            <User2 className="w-4 h-4 text-muted-foreground" />
            {value ? value.name : "Todos los clientes"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={placeholder}
          />
          <CommandList>
            {loading && <CommandEmpty>Cargando…</CommandEmpty>}
            {!loading && filtered.length === 0 && <CommandEmpty>Sin resultados</CommandEmpty>}
            <CommandGroup heading="Resultados">
              <CommandItem
                key="__all__"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <span className="flex-1">Todos los clientes</span>
                <Check className={cn("h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
              </CommandItem>

              {filtered.map((it) => (
                <CommandItem
                  key={it.id}
                  value={it.name}
                  onSelect={() => {
                    onChange(it);
                    setOpen(false);
                  }}
                >
                  <span className="flex-1 truncate">{it.name}</span>
                  <Check className={cn("h-4 w-4", value?.id === it.id ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
