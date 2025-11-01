// src/components/modals/ReceiptDetailModal.tsx
import { useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy } from "lucide-react";
import { api } from "@/lib/api";
import { ProductsAPI } from "@/services/products.api";
import { toast } from "@/hooks/use-toast";

type SupplierLite = { id: string; name: string; alias?: string | null; cuit?: string | null };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptId: string | null;
  supplierLookup?: Map<string, SupplierLite>; // opcional
};

type DetailEnvelope = {
  header?: {
    id?: string;
    supplier_id?: string;
    created_at?: string;
    document_number?: string | null;
    notes?: string | null;
    [k: string]: any;
  } | null;
  items?: Array<{
    id?: string;
    product_id?: string;
    sku?: string;
    name?: string;
    qty?: number | string;
    base_price?: number | string;
    margin_pct?: number | string | null;
    final_price?: number | string | null;
    [k: string]: any;
  }> | null;
};

const moneyFmt = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (n: number) => moneyFmt.format(Number.isFinite(+n) ? +n : 0);
const asNum = (v: any, d = 0) => (Number.isFinite(+v) ? +v : d);
const normalizeDateString = (s: string) => s.replace(" ", "T").replace(/(\.\d{3})\d+/, "$1");
const fmtDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  const str = typeof iso === "string" ? normalizeDateString(iso) : String(iso);
  const d = new Date(str);
  return isNaN(d.getTime()) ? String(iso) : d.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
};
const initials = (name?: string) =>
  (name || "—")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");

export default function ReceiptDetailModal({ open, onOpenChange, receiptId, supplierLookup }: Props) {
  // Detalle del comprobante
  const { data: payload, isLoading, isError, error } = useQuery<DetailEnvelope>({
    queryKey: ["receiptDetail", receiptId],
    enabled: open && !!receiptId,
    queryFn: async () => {
      if (!receiptId) return { header: null, items: [] };
      const res = await api.get(`/goods-receipts/${receiptId}`);
      const env: any = (res as any)?.data ?? res ?? {};
      return {
        header: env.header ?? null,
        items: Array.isArray(env.items) ? env.items : [],
      };
    },
    placeholderData: { header: null, items: [] },
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  const header = payload?.header ?? {};
  const itemsRaw = Array.isArray(payload?.items) ? payload!.items! : [];

  // Encabezado
  const receiptCode = (header as any).id ?? "—";
  const createdAt = (header as any).created_at ?? null;
  const supplierId: string | undefined = (header as any).supplier_id ?? undefined;
  const supplierName = supplierId ? (supplierLookup?.get(supplierId)?.name ?? supplierId) : "—";
  const supplierAlias = supplierId ? supplierLookup?.get(supplierId)?.alias ?? null : null;
  const supplierCuit = supplierId ? supplierLookup?.get(supplierId)?.cuit ?? null : null;
  const documentNumber = (header as any).document_number ?? "No informado";
  const notes = (header as any).notes ?? null;

  // Productos – complemento con /products/:id si faltan datos
  const productIds = Array.from(
    new Set(
      itemsRaw
        .map((it: any) => it?.product_id)
        .filter(Boolean)
        .map((x: any) => String(x))
    )
  );

  const productQueries = useQueries({
    queries: productIds.map((id) => ({
      queryKey: ["productById", id],
      enabled: open && !!id,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      queryFn: async () => {
        const p = await ProductsAPI.getById(id);
        return (p as any)?.data ?? p;
      },
    })),
  });

  const productMap = useMemo(() => {
    const m = new Map<string, any>();
    productIds.forEach((id, i) => {
      const q = productQueries[i];
      if (q?.data) m.set(id, q.data);
    });
    return m;
  }, [productIds, productQueries]);

  const rows = itemsRaw.map((it: any, idx: number) => {
    const pid = String(it?.product_id ?? "");
    const fetched = pid ? productMap.get(pid) : null;

    const sku = it?.sku ?? fetched?.sku ?? "—";
    const name = it?.name ?? fetched?.name ?? "—";

    const qty = asNum(it?.qty, 0);
    const unitCost = asNum(it?.base_price, 0);
    const lineCost = qty * unitCost;

    const saleAfter = it?.final_price != null && Number.isFinite(+it.final_price) ? +it.final_price : NaN;
    const priceUpdated = Number.isFinite(saleAfter);

    return {
      key: it?.id ?? `${pid}:${idx}`,
      sku,
      name,
      qty,
      unitCost,
      lineCost,
      saleAfter,
      priceUpdated,
    };
  });

  const linesCount = rows.length;
  const totalQty = rows.reduce((s, r) => s + asNum(r.qty, 0), 0);
  const totalAmount = rows.reduce((s, r) => s + asNum(r.lineCost, 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Modal sin scroll vertical; solo scrollea la lista */}
      <DialogContent className="w-[96vw] max-w-4xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">Detalle del ingreso</DialogTitle>
        </DialogHeader>

        {!receiptId ? (
          <div className="text-sm text-muted-foreground">No hay comprobante seleccionado.</div>
        ) : isLoading ? (
          <div className="text-sm text-muted-foreground">Cargando…</div>
        ) : isError ? (
          <div className="text-sm text-destructive">Error: {String((error as any)?.message ?? "desconocido")}</div>
        ) : (
          // Cabecera fija + tabla con scroll vertical
          <div className="flex flex-col gap-5 max-h-[80vh]">
            {/* ===== Cabecera ===== */}
            <div className="rounded-2xl border border-border/70 p-4 bg-card shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                {/* Proveedor */}
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                    {initials(supplierName)}
                  </div>
                  <div className="min-w-0">
                    {/* Nombre + Alias */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground truncate">{supplierName}</span>
                      {supplierAlias ? (
                        <Badge variant="secondary" className="px-2 py-0 h-5 text-xs">
                          {supplierAlias}
                        </Badge>
                      ) : null}
                    </div>

                    {/* CUIT */}
                    {supplierCuit ? (
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="truncate">CUIT {supplierCuit}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          title="Copiar CUIT"
                          onClick={() => {
                            navigator.clipboard?.writeText(String(supplierCuit)).then(() =>
                              toast({ title: "CUIT copiado", description: "Se copió el CUIT del proveedor." })
                            );
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Datos del comprobante */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div title="Fecha y hora en que se registró el ingreso">
                    <div className="text-xs text-muted-foreground">Fecha</div>
                    <div className="font-medium">{fmtDateTime(createdAt)}</div>
                  </div>
                  <div title="Número visible en la factura/remito del proveedor">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">N° de comprobante</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Copiar número"
                        onClick={() => {
                          navigator.clipboard?.writeText(String(documentNumber)).then(() =>
                            toast({ title: "N° copiado", description: "Se copió el número de comprobante." })
                          );
                        }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="font-medium break-all">{documentNumber}</div>
                  </div>
                  <div className="sm:col-span-2" title="Identificador interno del sistema">
                    <div className="text-xs text-muted-foreground">ID del comprobante</div>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 rounded-md bg-background border text-xs text-foreground break-all">
                        {receiptCode}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => {
                          navigator.clipboard?.writeText(String(receiptCode)).then(() =>
                            toast({ title: "ID copiado", description: "Se copió el identificador del comprobante." })
                          );
                        }}
                        title="Copiar ID"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copiar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Métricas */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border bg-background/40 p-3">
                  <div className="text-xs text-muted-foreground">Líneas</div>
                  <div className="text-2xl font-semibold">{linesCount}</div>
                </div>
                <div className="rounded-lg border bg-background/40 p-3">
                  <div className="text-xs text-muted-foreground">Cantidad total</div>
                  <div className="text-2xl font-semibold tabular-nums">{totalQty}</div>
                </div>
                <div className="rounded-lg border bg-background/40 p-3">
                  <div className="text-xs text-muted-foreground">Importe total</div>
                  <div className="text-2xl font-semibold tabular-nums">${money(totalAmount)}</div>
                </div>
              </div>

              {notes ? (
                <div className="mt-4 rounded-md border bg-background/60 p-3">
                  <div className="text-xs text-muted-foreground mb-1">Notas</div>
                  <div className="text-sm whitespace-pre-wrap">{notes}</div>
                </div>
              ) : null}
            </div>

            {/* ===== Tabla (solo esta parte scrollea) ===== */}
            <div className="rounded-xl border overflow-hidden flex-1 min-h-0">
              {/* Importante: sin overflow-x para que no aparezca la franja/scrollbar horizontal */}
              <div className="h-full overflow-y-auto overflow-x-hidden">
                <table className="w-full text-sm table-fixed">
                  <colgroup>
                    <col className="w-[35%]" />
                    <col className="w-[11%]" />
                    <col className="w-[16%]" />
                    <col className="w-[16%]" />
                    <col className="w-[16%]" />
                    <col className="w-[6%]" />
                  </colgroup>
                  <thead className="sticky top-0 z-20 bg-background">
                    <tr className="border-b border-border/80">
                      <th className="text-left  py-2.5 px-3 font-semibold">Producto</th>
                      <th className="text-right py-2.5 px-3 font-semibold">Cantidad</th>
                      <th className="text-right py-2.5 px-3 font-semibold">Costo unitario</th>
                      <th className="text-right py-2.5 px-3 font-semibold">Costo total</th>
                      <th className="text-right py-2.5 px-3 font-semibold">Precio de venta</th>
                      <th className="text-center py-2.5 px-3 font-semibold">Precio actualizado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">Sin ítems.</td>
                      </tr>
                    ) : (
                      rows.map((it, idx) => (
                        <tr
                          key={it.key}
                          className={`border-b border-border/60 ${idx % 2 === 0 ? "bg-background/60" : "bg-background"} hover:bg-accent/20 transition-colors`}
                        >
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-foreground truncate" title={`${it.sku} — ${it.name}`}>
                              {it.sku} — {it.name}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums">{it.qty}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums">${money(it.unitCost)}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums">${money(it.lineCost)}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums">
                            {Number.isFinite(it.saleAfter) ? `$${money(it.saleAfter)}` : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {it.priceUpdated ? (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Sí</Badge>
                            ) : (
                              <Badge variant="secondary">No</Badge>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>

                  {/* Totales pegados abajo del área scrolleable */}
                  <tfoot className="sticky bottom-0 bg-background">
                    <tr>
                      <td colSpan={6} className="p-0">
                        <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 border-t">
                          <div className="text-sm font-semibold">Totales</div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Cantidad</span>
                              <span className="text-lg font-bold tabular-nums">{totalQty}</span>
                            </div>
                            <div className="h-5 w-px bg-border" />
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Importe</span>
                              <span className="text-lg font-bold tabular-nums">${money(totalAmount)}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-xs text-muted-foreground border-t" colSpan={6}>
                        Líneas: {linesCount}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
