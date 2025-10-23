// src/components/common/CategorySelect.tsx
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check, ChevronDown, FolderPlus } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CategoriesRepo } from '@/services/categories';
import { cn } from '@/lib/utils';

type Props = {
  value?: string;
  onChange?: (val?: string) => void;
  placeholder?: string;
  className?: string;
};

export function CategorySelect({ value, onChange, placeholder = 'Categoría', className }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => CategoriesRepo.list(),
    // al primer render, intentá descubrir desde backend si no hay LS
    // y cachealo sin bloquear la UI
    initialData: [],
  });

  React.useEffect(() => {
    if ((categories?.length ?? 0) === 0) {
      CategoriesRepo.discoverFromBackend().then((cats) =>
        qc.setQueryData(['categories'], cats)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addMutation = useMutation({
    mutationFn: (name: string) => CategoriesRepo.add(name),
    onSuccess: (cats) => {
      qc.setQueryData(['categories'], cats);
      onChange?.(search.trim());
      setOpen(false);
    },
  });

  const filtered = (categories ?? []).filter(c =>
    !search ? true : c.toLowerCase().includes(search.toLowerCase())
  );
  const showCreate = search.trim().length > 0 && !categories?.some(c => c.toLowerCase() === search.trim().toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn("w-full justify-between", className)}
        >
          {value || placeholder}
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar o crear…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>Sin resultados</CommandEmpty>
          <CommandGroup>
            {filtered.map((c) => (
              <CommandItem
                key={c}
                value={c}
                onSelect={() => {
                  onChange?.(c);
                  setOpen(false);
                }}
                className="flex items-center justify-between"
              >
                <span>{c}</span>
                {value === c && <Check className="h-4 w-4" />}
              </CommandItem>
            ))}
            {showCreate && (
              <CommandItem
                value={`__create__${search}`}
                className="text-primary"
                onSelect={() => addMutation.mutate(search.trim())}
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                Crear “{search.trim()}”
              </CommandItem>
            )}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
