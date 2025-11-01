// src/components/modals/ViewProductModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types/domain";
import { Building2, Barcode, Package2, Hash, DollarSign, PercentCircle, Boxes, Clipboard, ClipboardCheck } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export type ViewProductModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: (Partial<Product> & {
    supplier?: string;
    supplierName?: string;
    supplier_name?: string;
    supplierAlias?: string;
    supplier_alias?: string;
    lastPurchasePrice?: number;
    last_purchase_price?: number;
    minStock?: number | null;
    reserved?: number;
    available?: number;
  }) | null;
};

const money = (n: any) =>
  (Number(n) || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Item visual reutilizable */
function Field({
  label,
  icon,
  children,
  mono = false,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1 min-w-0">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
        <Label className="text-xs text-muted-foreground">{label}</Label>
      </div>
      <div className={`text-sm ${mono ? "font-mono break-all" : ""}`}>{children}</div>
    </div>
  );
}

export function ViewProductModal({ open, onOpenChange, product }: ViewProductModalProps) {
  const p = product ?? undefined;
  const { toast } = useToast();
  const [copied, setCopied] = useState<string>("");

  const price = Number(p?.price ?? 0);
  const stock = Number(p?.stock ?? 0);
  const reserved = Number((p as any)?.reserved ?? 0);
  const available = Math.max(0, Number(p?.available ?? (stock - reserved)));
  const minStock = (p as any)?.minStock ?? null;

  const lastPurchasePrice =
    (p as any)?.lastPurchasePrice ??
    (p as any)?.last_purchase_price ??
    null;

  // Proveedor con alias si existe
  const supplierLabel = (() => {
    const name =
      (p as any)?.supplier ??
      (p as any)?.supplierName ??
      (p as any)?.supplier_name ??
      null;
    const alias =
      (p as any)?.supplierAlias ??
      (p as any)?.supplier_alias ??
      null;
    if (!name) return "—";
    return alias ? `${name} (${alias})` : name;
  })();

  // Márgen calculado contra último costo
  const rawMarginPct =
    lastPurchasePrice != null && Number(lastPurchasePrice) > 0
      ? ((price / Number(lastPurchasePrice)) - 1) * 100
      : null;
  const marginPct = rawMarginPct == null ? null : Math.round(rawMarginPct * 100) / 100;
  const marginLabel = marginPct == null ? "—" : `${marginPct >= 0 ? "+" : ""}${marginPct.toFixed(2)}%`;
  const marginBadgeVariant = marginPct == null ? "secondary" : (marginPct < 0 ? "destructive" : "default");

  // Estado de stock
  const isOut = available <= 0;
  const isLow = !isOut && minStock != null && available <= Number(minStock);

  // Copy helpers
  const onCopy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      toast({ title: "Copiado", description: value, duration: 1200 });
      setTimeout(() => setCopied(""), 1200);
    } catch {
      toast({ title: "No se pudo copiar", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-2xl p-0 overflow-hidden" aria-describedby={undefined}>
        <div className="px-6 pt-5">
          <DialogHeader className="items-start">
            <DialogTitle className="text-xl">Detalle de producto</DialogTitle>
            <DialogDescription className="sr-only">Información completa del producto seleccionado.</DialogDescription>
          </DialogHeader>
        </div>

        {!p ? (
          <div className="px-6 pb-6 text-sm text-muted-foreground">No hay producto seleccionado.</div>
        ) : (
          <div className="px-6 pb-6 space-y-6">
            {/* Header compacto con nombre y estado */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-base font-semibold truncate">{p.name ?? "-"}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {p.category ? <Badge variant="outline">{p.category}</Badge> : "Sin categoría"}
                  </div>
                </div>
                <div>
                  {isOut ? (
                    <Badge variant="destructive">Sin stock</Badge>
                  ) : isLow ? (
                    <Badge variant="secondary">Bajo stock</Badge>
                  ) : (
                    <Badge>OK</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">SKU</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm truncate max-w-[180px]" title={p.sku ?? "-"}>{p.sku ?? "-"}</span>
                    <button
                      className="text-muted-foreground hover:text-foreground transition"
                      onClick={() => p.sku && onCopy(p.sku, "sku")}
                      title="Copiar SKU"
                    >
                      {copied === "sku" ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">ID</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] truncate max-w-[180px]" title={String(p.id)}>{p.id}</span>
                    <button
                      className="text-muted-foreground hover:text-foreground transition"
                      onClick={() => p.id && onCopy(String(p.id), "id")}
                      title="Copiar ID"
                    >
                      {copied === "id" ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjetas: Identificación / Comercial / Inventario */}
            <div className="grid grid-cols-1 gap-4">
              {/* Identificación */}
              <section className="rounded-lg border bg-background/60 p-4">
                <div className="mb-3 text-xs font-semibold text-muted-foreground tracking-wide">Identificación</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Código de barras" icon={<Barcode className="h-4 w-4" />} mono>
                    {p.barcode ?? "—"}
                  </Field>
                  <Field label="Categoría" icon={<Package2 className="h-4 w-4" />}>
                    {p.category ? <Badge variant="outline">{p.category}</Badge> : "—"}
                  </Field>
                  <Field label="Estado" icon={<Boxes className="h-4 w-4" />}>
                    {isOut ? (
                      <Badge variant="destructive">Sin stock</Badge>
                    ) : isLow ? (
                      <Badge variant="secondary">Bajo stock</Badge>
                    ) : (
                      <Badge>OK</Badge>
                    )}
                  </Field>
                </div>
              </section>

              {/* Comercial */}
              <section className="rounded-lg border bg-background/60 p-4">
                <div className="mb-3 text-xs font-semibold text-muted-foreground tracking-wide">Comercial</div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <Field label="Proveedor" icon={<Building2 className="h-4 w-4" />}>
                    <span className="truncate">{supplierLabel}</span>
                  </Field>
                  <Field label="Costo (último)" icon={<DollarSign className="h-4 w-4" />}>
                    {lastPurchasePrice != null ? `$${money(lastPurchasePrice)}` : "—"}
                  </Field>
                  <Field label="Margen" icon={<PercentCircle className="h-4 w-4" />}>
                    {marginPct == null ? "—" : <Badge variant={marginBadgeVariant}>{marginLabel}</Badge>}
                  </Field>
                  <Field label="Precio venta" icon={<DollarSign className="h-4 w-4" />}>
                    <span className="font-semibold tabular-nums">${money(price)}</span>
                  </Field>
                </div>
              </section>

              {/* Inventario */}
              <section className="rounded-lg border bg-background/60 p-4">
                <div className="mb-3 text-xs font-semibold text-muted-foreground tracking-wide">Inventario</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Field label="Stock total">
                    <span className="tabular-nums">{stock}</span>
                  </Field>
                  <Field label="Reservado">
                    <span className="tabular-nums">{reserved}</span>
                  </Field>
                  <Field label="Disponible">
                    <span className="tabular-nums">{available}</span>
                  </Field>
                  <Field label="Stock mínimo (opcional)">
                    <span className="tabular-nums">{minStock ?? "—"}</span>
                  </Field>
                </div>
              </section>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
