import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  Truck,
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  Package,
  CreditCard,
  Clock,
  StickyNote,
  Copy,
  Hash,
  Search,
  Layers,
} from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  ruc?: string | null;
  cuit?: string | null;
  alias?: string | null;
  contact?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  paymentTerms?: string | null;
  deliveryTime?: string | null;
  notes?: string | null;
}

type Product = {
  id: string;
  sku?: string | null;
  name: string;
  category?: string | null;
  price?: number | string | null;
  stock?: number | null;
  reserved?: number | null;
};

interface ViewSupplierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
}

const val = (v?: string | null) => (v && String(v).trim() ? String(v) : "—");
const money = (n?: number | string | null) => {
  if (n === null || n === undefined || n === "") return "—";
  const x = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(x as number)) return "—";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(x as number);
};

export function ViewSupplierModal({ open, onOpenChange, supplier }: ViewSupplierModalProps) {
  // 👇 Hooks SIEMPRE al tope, sin returns antes
  const { toast } = useToast();
  const sid = supplier?.id ?? null;
  const cuite = supplier?.ruc ?? supplier?.cuit ?? null;

  const [filter, setFilter] = useState("");

  // Traer productos del proveedor (no se ejecuta si no hay proveedor/está cerrado)
  const { data: productsData, isLoading: productsLoading, isError: productsError } = useQuery({
    queryKey: ["supplier-products", sid],
    enabled: open && !!sid,
    queryFn: async () => {
      const r = await api.get("/products", { params: { supplierId: sid, limit: 100 } });
      const items = r.data?.items ?? r.data?.data ?? r.data?.results ?? (Array.isArray(r.data) ? r.data : []);
      return (Array.isArray(items) ? items : []) as Product[];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const filteredProducts = useMemo(() => {
    const arr = productsData ?? [];
    const s = filter.trim().toLowerCase();
    if (!s) return arr;
    return arr.filter(p =>
      [p.sku, p.name, p.category].filter(Boolean).join(" ").toLowerCase().includes(s)
    );
  }, [productsData, filter]);

  const copy = async (label: string, text?: string | null) => {
    if (!text || !text.toString().trim()) return;
    try {
      await navigator.clipboard.writeText(text.toString());
      toast({ title: "Copiado", description: `${label} copiado al portapapeles`, duration: 1200 });
    } catch {
      toast({ title: "No se pudo copiar", description: "Intentá nuevamente", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-foreground">
                  {supplier ? val(supplier.name) : "Proveedor"}
                </DialogTitle>
                {supplier && (
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {supplier.alias ? (
                      <Badge variant="secondary" className="text-xs">Alias: {supplier.alias}</Badge>
                    ) : null}
                    <Badge variant="outline" className="text-xs gap-1">
                      <Hash className="w-3 h-3" />
                      {val(supplier.id)}
                    </Badge>
                    {cuite ? (
                      <Badge variant="outline" className="text-xs gap-1">
                        <CreditCard className="w-3 h-3" />
                        {cuite}
                      </Badge>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            {supplier && cuite ? (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="h-8" onClick={() => copy("CUIT/RUC", cuite)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar CUIT/RUC
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Body */}
        {!supplier ? (
          <div className="p-6">
            <p className="text-sm text-muted-foreground">
              Seleccioná un proveedor para ver los detalles.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Info Empresa / Contacto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border bg-card/50 p-4">
                <div className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Nombre</p>
                    <p className="font-medium text-foreground break-words">{val(supplier.name)}</p>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="flex items-start gap-3">
                  <CreditCard className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">CUIT / RUC</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-foreground">{val(cuite)}</p>
                      <Button size="icon" variant="ghost" className="h-8 w-8"
                        onClick={() => copy("CUIT/RUC", cuite)} disabled={!cuite}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                {supplier.alias ? (
                  <>
                    <Separator className="my-3" />
                    <div className="flex items-start gap-3">
                      <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Alias</p>
                        <p className="font-medium text-foreground">{val(supplier.alias)}</p>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>

              <div className="rounded-xl border bg-card/50 p-4">
                <div className="flex items-start gap-3 mb-3">
                  <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Persona de contacto</p>
                    <p className="font-medium text-foreground">{val(supplier.contact)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Teléfono</p>
                      <div className="flex items-center justify-between gap-2">
                        {supplier.phone ? (
                          <a href={`tel:${supplier.phone}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                            {supplier.phone}
                          </a>
                        ) : (
                          <p className="font-medium text-foreground">—</p>
                        )}
                        <Button size="icon" variant="ghost" className="h-8 w-8"
                          onClick={() => copy("Teléfono", supplier.phone)} disabled={!supplier.phone}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">Email</p>
                      <div className="flex items-center justify-between gap-2">
                        {supplier.email ? (
                          <a href={`mailto:${supplier.email}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                            {supplier.email}
                          </a>
                        ) : (
                          <p className="font-medium text-foreground">—</p>
                        )}
                        <Button size="icon" variant="ghost" className="h-8 w-8"
                          onClick={() => copy("Email", supplier.email)} disabled={!supplier.email}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Dirección</p>
                    <div className="flex items-center justify-between gap-2">
                      {supplier.address ? (
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(supplier.address)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-foreground underline-offset-4 hover:underline break-words"
                        >
                          {supplier.address}
                        </a>
                      ) : (
                        <p className="font-medium text-foreground">—</p>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8"
                        onClick={() => copy("Dirección", supplier.address)} disabled={!supplier.address}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Productos del proveedor */}
            <div className="rounded-xl border bg-card/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Productos que suministra</p>
                  <Badge variant="outline" className="ml-1">
                    {productsLoading ? "…" : (productsData?.length ?? 0)}
                  </Badge>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por SKU, nombre o categoría…"
                    className="pl-10"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </div>
              </div>

              {productsError ? (
                <p className="text-destructive text-sm">Error al cargar productos.</p>
              ) : productsLoading ? (
                <p className="text-sm text-muted-foreground">Cargando productos…</p>
              ) : (filteredProducts?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">Este proveedor no tiene productos asociados.</p>
              ) : (
                <div className="max-h-72 overflow-auto pr-1">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-3 font-medium text-muted-foreground">SKU</th>
                        <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Producto</th>
                        <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Categoría</th>
                        <th className="text-right py-2 pl-3 font-medium text-muted-foreground">Stock</th>
                        <th className="text-right py-2 pl-3 font-medium text-muted-foreground">Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts!.map((p) => {
                        const stockTxt =
                          p.stock === null || p.stock === undefined
                            ? "—"
                            : p.reserved
                              ? `${p.stock} (res ${p.reserved})`
                              : String(p.stock);
                        return (
                          <tr key={p.id} className="border-b border-border/60 hover:bg-accent/30">
                            <td className="py-2 pr-3 font-mono text-xs">{p.sku ?? "—"}</td>
                            <td className="py-2 pr-3">{p.name}</td>
                            <td className="py-2 pr-3">
                              {p.category ? (
                                <Badge variant="secondary" className="rounded-full">
                                  <Layers className="w-3 h-3 mr-1" />
                                  {p.category}
                                </Badge>
                              ) : "—"}
                            </td>
                            <td className="py-2 pl-3 text-right">{stockTxt}</td>
                            <td className="py-2 pl-3 text-right">{money(p.price)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {(supplier.paymentTerms || supplier.deliveryTime || supplier.notes) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {supplier.paymentTerms && (
                  <div className="rounded-xl border bg-card/50 p-4">
                    <div className="flex items-start gap-3">
                      <CreditCard className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Condiciones de pago</p>
                        <p className="font-medium text-foreground">{val(supplier.paymentTerms)}</p>
                      </div>
                    </div>
                  </div>
                )}
                {supplier.deliveryTime && (
                  <div className="rounded-xl border bg-card/50 p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Tiempo de entrega</p>
                        <p className="font-medium text-foreground">{val(supplier.deliveryTime)}</p>
                      </div>
                    </div>
                  </div>
                )}
                {supplier.notes && (
                  <div className="rounded-xl border bg-card/50 p-4 md:col-span-1 md:col-start-auto">
                    <div className="flex items-start gap-3">
                      <StickyNote className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Notas</p>
                        <p className="font-medium text-foreground whitespace-pre-line">{val(supplier.notes)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="p-4 border-t bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="w-full flex items-center justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
