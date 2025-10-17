import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { ProductsAPI } from "@/services/products.api";
import type { Product } from "@/types/domain";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus, Search, RefreshCcw, Eye, Edit, Trash2, ChevronDown, Package, DollarSign, FolderPlus, Copy
} from "lucide-react";
import { NewProductModal } from "@/components/modals/NewProductModal";
import { ViewProductModal } from "@/components/modals/ViewProductModal";
import { EditProductModal } from "@/components/modals/EditProductModal";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { ManageCategoriesModal } from "@/components/modals/ManageCategoriesModal";

import { CategoriesRepo } from "@/services/categories";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { money, number } from "@/utils/format";

type Paged<T> = { items: T[]; total?: number; page?: number; pages?: number; limit?: number };

function StockPill({ value, min = 0 }: { value: number; min?: number }) {
  const level = value <= Math.max(1, Math.floor(min / 2)) ? "crit" : value <= min ? "low" : "ok";
  const map = {
    crit: "bg-destructive/10 text-destructive border-destructive/20",
    low: "bg-warning/10 text-warning border-warning/20",
    ok: "bg-success/10 text-success border-success/20",
  } as const;
  return <Badge className={cn("border tabular-nums")}>{number(value)}</Badge>;
}

export const ProductsSection = () => {
  const qc = useQueryClient();
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Gestión de categorías desde la lista
  const [manageCatsOpen, setManageCatsOpen] = useState(false);

  // filtros/paginación/orden (con sincronización en URL)
  const sp = new URLSearchParams(location.search);
  const initialQ = sp.get("q") ?? "";
  const initialCat = sp.get("category") ?? "";
  const initialPage = Number(sp.get("page") ?? 1) || 1;
  const initialSortBy = (sp.get("sortBy") as 'name' | 'sku' | 'price' | 'stock' | 'createdAt') || 'name';
  const initialSortDir = (sp.get("sortDir") as 'asc' | 'desc') || 'asc';

  const [qInput, setQInput] = useState(initialQ); // input inmediato
  const [q, setQ] = useState(initialQ); // valor con debounce
  const [category, setCategory] = useState(initialCat);
  const [page, setPage] = useState(initialPage);
  const [sortBy, setSortBy] = useState<'name' | 'sku' | 'price' | 'stock' | 'createdAt'>(initialSortBy);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(initialSortDir);

  // Debounce búsqueda
  useEffect(() => {
    const t = setTimeout(() => setQ(qInput), 250);
    return () => clearTimeout(t);
  }, [qInput]);

  // Sincronizar URL
  useEffect(() => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (category) next.set("category", category);
    if (page > 1) next.set("page", String(page));
    if (sortBy !== "name") next.set("sortBy", sortBy);
    if (sortDir !== "asc") next.set("sortDir", sortDir);
    const qs = next.toString();
    const href = qs ? `?${qs}` : location.pathname;
    window.history.replaceState({}, "", href);
  }, [q, category, page, sortBy, sortDir]);

  // Categorías (solo seleccionar existentes)
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => CategoriesRepo.list(),
    initialData: [],
  });

  // Descubrir inicial si no hay
  useEffect(() => {
    if ((categories?.length ?? 0) === 0) {
      CategoriesRepo.discoverFromBackend().then((cats) =>
        qc.setQueryData(["categories"], cats)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories?.length]);

  const { data, isLoading, isError, refetch } = useQuery<Paged<Product>, Error>({
    queryKey: ["products", { q, category, page, sortBy, sortDir }],
    queryFn: () => ProductsAPI.search({ q, category, page, limit: 20, sortBy, sortDir }),
    placeholderData: keepPreviousData,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  const removeMutation = useMutation({
    mutationFn: (id: string) => ProductsAPI.delete(id),
    onSuccess: () => {
      toast({ title: "Producto eliminado", description: "Se eliminó correctamente." });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e: any) => {
      toast({ title: "No se pudo eliminar", description: e?.message ?? "Error desconocido", variant: "destructive" });
    },
  });

  const handleView = (p: Product) => {
    setSelectedProduct(p);
    setIsViewModalOpen(true);
  };

  const handleEdit = (p: Product) => {
    setSelectedProduct(p);
    setIsEditModalOpen(true);
  };

  const handleCopySku = async (sku?: string) => {
    if (!sku) return;
    try {
      await navigator.clipboard.writeText(sku);
      toast({ title: "SKU copiado", description: sku });
    } catch {
      toast({ title: "No se pudo copiar", variant: "destructive" });
    }
  };

  const valorInventario = useMemo(
    () => items.reduce((acc, p) => acc + Number(p.price ?? 0) * Number(p.stock ?? 0), 0),
    [items]
  );

  return (
    <div className="space-y-6">
      {/* Header superior */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Productos</h1>
          <p className="text-muted-foreground">Controlá inventario, precios y disponibilidad</p>
        </div>
        <Button
          onClick={() => setIsNewProductOpen(true)}
          className="bg-gradient-to-r from-primary to-primary/80"
          title="Agregar producto"
          aria-label="Agregar producto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar producto
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-card to-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de productos</p>
                <p className="text-2xl font-bold text-foreground">{number(total)}</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor de inventario</p>
                <p className="text-2xl font-bold text-success">{money(valorInventario)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar de filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, SKU, categoría o código…"
                className="pl-10"
                value={qInput}
                onChange={(e) => { setQInput(e.target.value); setPage(1); }}
                aria-label="Buscar"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Categoría */}
              <div className="min-w-[220px]">
                <Select
                  value={category ? category : "__ALL__"}
                  onValueChange={(v) => { setCategory(v === "__ALL__" ? "" : v); setPage(1); }}
                >
                  <SelectTrigger aria-label="Filtrar por categoría">
                    <SelectValue placeholder="Filtrar por categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__ALL__">Todas</SelectItem>
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
              </div>

              {/* Crear/gestionar categorías */}
              <Button
                variant="outline"
                onClick={() => setManageCatsOpen(true)}
                aria-label="Nueva categoría"
                title="Nueva categoría"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                Nueva categoría
              </Button>

              {/* Orden */}
              <div className="flex items-center gap-2">
                <Select
                  value={sortBy}
                  onValueChange={(v: any) => { setSortBy(v); setPage(1); }}
                >
                  <SelectTrigger className="w-[160px]" aria-label="Ordenar por">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nombre</SelectItem>
                    <SelectItem value="sku">SKU</SelectItem>
                    <SelectItem value="price">Precio</SelectItem>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="createdAt">Creado</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                  title={sortDir === "asc" ? "Ascendente" : "Descendente"}
                  aria-label={sortDir === "asc" ? "Ascendente" : "Descendente"}
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", sortDir === "asc" ? "rotate-180" : "")} />
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={() => { setQInput(""); setQ(""); setCategory(""); setPage(1); }}
                title="Limpiar filtros"
                aria-label="Limpiar filtros"
              >
                <RefreshCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla con resultados */}
      <Card>
        <CardHeader className="py-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Listado</CardTitle>
          <Badge variant="secondary">{number(total)} total</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 w-full animate-pulse rounded bg-muted/50" />
                ))}
              </div>
            </div>
          ) : isError ? (
            <div className="p-4 text-sm text-destructive">No se pudieron cargar los productos.</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <div className="text-4xl mb-2">🗂️</div>
              No hay resultados. Probá ajustando los filtros o creando un producto nuevo.
              <div className="mt-3">
                <Button onClick={() => setIsNewProductOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar producto
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                {/* FIX: colgroup sin nodos de texto (render desde array) */}
                <colgroup>
                  {[
                    { key: 'sku', w: 140 },
                    { key: 'name' },              // flexible
                    { key: 'cat', w: 180 },
                    { key: 'price', w: 140 },
                    { key: 'stock', w: 110 },
                    { key: 'avail', w: 110 },
                    { key: 'actions', w: 160 },
                  ].map(({ key, w }) => (
                    <col key={key} style={w ? { width: `${w}px` } : undefined} />
                  ))}
                </colgroup>

                <thead className="sticky top-0 bg-muted/50 backdrop-blur z-10">
                  <tr className="border-b">
                    <th className="text-left px-4 py-3.5 font-medium text-foreground">SKU</th>
                    <th className="text-left px-4 py-3.5 font-medium text-foreground">Producto</th>
                    <th className="text-left px-4 py-3.5 font-medium text-foreground">Categoría</th>
                    <th className="text-right px-4 py-3.5 font-medium text-foreground">Precio</th>
                    <th className="text-center px-4 py-3.5 font-medium text-foreground">Stock</th>
                    <th className="text-center px-4 py-3.5 font-medium text-foreground">Disp.</th>
                    <th className="text-right px-4 py-3.5 font-medium text-foreground">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((p, idx) => (
                    <tr
                      key={p.id}
                      className={cn(
                        "border-b transition-colors align-middle",
                        idx % 2 === 1 ? "bg-accent/10" : "bg-transparent",
                        "hover:bg-accent/30"
                      )}
                    >
                      {/* SKU */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col leading-tight">
                            <span className="font-mono">{p.sku}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{p.id.slice(0, 8)}…</span>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            aria-label="Copiar SKU"
                            title="Copiar SKU"
                            onClick={() => handleCopySku(p.sku)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>

                      {/* Producto */}
                      <td className="px-4 py-3.5">
                        <span className="font-medium">{p.name}</span>
                      </td>

                      {/* Categoría */}
                      <td className="px-4 py-3.5">
                        {p.category ? <Badge variant="outline">{p.category}</Badge> : <span className="text-muted-foreground">—</span>}
                      </td>

                      {/* Precio */}
                      <td className="px-4 py-3.5 text-right tabular-nums whitespace-nowrap">
                        {money(p.price)}
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3.5 text-center">
                        <StockPill value={Number(p.stock ?? 0)} min={0} />
                      </td>

                      {/* Disponible */}
                      <td className="px-4 py-3.5 text-center tabular-nums">
                        <Badge variant="secondary">
                          {number(Math.max(0, Number(p.available ?? (p.stock - (p.reserved ?? 0)))))}
                        </Badge>
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleView(p)} aria-label="Ver" title="Ver">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleEdit(p)} aria-label="Editar" title="Editar">
                            <Edit className="w-4 h-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                aria-label="Eliminar"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar este producto?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará <b>{p.name}</b> (SKU {p.sku}).
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => removeMutation.mutate(p.id)}
                                >
                                  Sí, eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Paginación */}
              <div className="flex items-center justify-between p-3 text-sm">
                <span className="text-muted-foreground">Página {number(page)} de {number(pages)}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modales */}
      <NewProductModal
        open={isNewProductOpen}
        onOpenChange={(v) => {
          setIsNewProductOpen(v);
          if (!v) refetch();
        }}
      />
      <ViewProductModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        product={selectedProduct ?? undefined}
      />
      <EditProductModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        product={selectedProduct ?? undefined}
        onSave={() => qc.invalidateQueries({ queryKey: ["products"] })}
      />

      {/* Gestión de categorías desde la sección */}
      <ManageCategoriesModal open={manageCatsOpen} onOpenChange={setManageCatsOpen} />
    </div>
  );
};
