// src/components/modals/ManageCategoriesModal.tsx
import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CategoriesRepo } from '@/services/categories';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, PencilLine, Check, X, FolderPlus } from 'lucide-react';

type Props = { open: boolean; onOpenChange: (v: boolean) => void; };

export function ManageCategoriesModal({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => CategoriesRepo.list(), initialData: [] });
  const [newCat, setNewCat] = React.useState('');
  const [editing, setEditing] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState('');

  const add = useMutation({
    mutationFn: (name: string) => CategoriesRepo.add(name),
    onSuccess: (cats) => { qc.setQueryData(['categories'], cats); setNewCat(''); },
  });
  const remove = useMutation({
    mutationFn: (name: string) => CategoriesRepo.remove(name),
    onSuccess: (cats) => qc.setQueryData(['categories'], cats),
  });
  const rename = useMutation({
    mutationFn: ({ prev, next }: { prev: string; next: string }) => CategoriesRepo.rename(prev, next),
    onSuccess: (cats) => { qc.setQueryData(['categories'], cats); setEditing(null); setEditValue(''); },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Categorías</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Nueva categoría…"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
            />
            <Button onClick={() => newCat.trim() && add.mutate(newCat.trim())}>
              <FolderPlus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>

          <div className="border rounded">
            {categories?.length ? (
              <ul className="divide-y">
                {categories.map((c) => (
                  <li key={c} className="flex items-center justify-between p-2">
                    {editing === c ? (
                      <div className="flex-1 flex items-center gap-2">
                        <Input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') rename.mutate({ prev: c, next: editValue.trim() });
                            if (e.key === 'Escape') { setEditing(null); setEditValue(''); }
                          }}
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => rename.mutate({ prev: c, next: editValue.trim() })}
                          disabled={!editValue.trim()}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => { setEditing(null); setEditValue(''); }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span>{c}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon" variant="outline"
                            onClick={() => { setEditing(c); setEditValue(c); }}
                          >
                            <PencilLine className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon" variant="outline"
                            className="hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => remove.mutate(c)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-sm text-muted-foreground">No hay categorías aún.</div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
