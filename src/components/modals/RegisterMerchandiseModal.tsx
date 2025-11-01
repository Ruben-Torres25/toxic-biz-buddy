// src/components/modals/RegisterMerchandiseModal.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Eraser } from "lucide-react";
import { api } from "@/lib/api";

export interface RegisterMerchandiseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSupplierId?: string;
  onRegistered?: (result: any) => void;
}

type SupplierOption = { id: string; name: string; alias?: string; cuit?: string };
type ProductOption  = {
  id: string;
  sku: string;
  name: string;
  category?: string;
  salePrice?: number;
  lastPurchasePrice?: number;
};

type ItemDraft = {
  productId: string;
  quantity: number;
  unitPrice: number; // costo
};

const API_BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ||
  (typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_API_BASE_URL) ||
  "http://localhost:3000";

const joinUrl = (base: string, path: string) => `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

async function fetchJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}. Respuesta: ${text.slice(0, 200)}`);
  if (!contentType.includes("application/json")) throw new Error(`Respuesta no JSON (${contentType}). ${text.slice(0,200)}`);
  return JSON.parse(text);
}
function pickArray<T = any>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}
const money = (n: number) => (Number(n) || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const clampInt = (v: any, min = 1) => Math.max(min, Number.isFinite(+v) ? Math.trunc(+v) : min);
const clampDec = (v: any, min = 0) => Math.max(min, Number.isFinite(+v) ? +(+v).toFixed(2) : min);

// Sentinel para evitar value="" en Radix Select
const ALL_CATS = "__all__";

// —— helpers robustos para la respuesta del backend ——
function unwrap<T = any>(x: any): T {
  return (x?.data ?? x?.result ?? x) as T;
}
function getNumber(...vals: any[]) {
  for (const v of vals) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}
function getArray<T = any>(...vals: any[]): T[] | undefined {
  for (const v of vals) if (Array.isArray(v)) return v as T[];
  return undefined;
}

export function RegisterMerchandiseModal({
  open,
  onOpenChange,
  defaultSupplierId,
  onRegistered,
}: RegisterMerchandiseModalProps) {
  // Cabecera
  const [supplierId, setSupplierId] = useState<string>("");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");

  // % Remarque global
  const [remarkPct, setRemarkPct] = useState<number>(0);

  // Listas
  const [supplierOptions, setSupplierOptions] = useState<SupplierOption[]>([]);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Filtro de categoría
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  // Buscador + dropdown
  const [productQuery, setProductQuery] = useState<string>("");
  const [suggestOpen, setSuggestOpen] = useState<boolean>(false);
  const [highlightIndex, setHighlightIndex] = useState<number>(0);

  // Ítems (no editables luego de agregados)
  const [items, setItems] = useState<ItemDraft[]>([]);
  const [currentItem, setCurrentItem] = useState<ItemDraft>({
    productId: "",
    quantity: 1,
    unitPrice: 0,
  });

  const [submitting, setSubmitting] = useState(false);

  // Cálculos
  const previewSalePrice = useCallback(
    (cost: number) => clampDec(cost * (1 + (Number(remarkPct) || 0) / 100)),
    [remarkPct]
  );
  const totalCostAmount = useMemo(
    () => items.reduce((s, it) => s + (Number(it.quantity || 0) * Number(it.unitPrice || 0)), 0),
    [items]
  );
  const totalSaleAmount = useMemo(
    () => items.reduce((s, it) => s + (it.quantity * previewSalePrice(it.unitPrice)), 0),
    [items, previewSalePrice]
  );

  // Cargas
  useEffect(() => {
    if (!open) return;

    (async () => {
      try {
        setLoadingSuppliers(true);
        const sup = await fetchJSON(joinUrl(API_BASE_URL, "/suppliers"));
        setSupplierOptions(pickArray<SupplierOption>(sup));
      } catch (err: any) {
        toast({ title: "Error", description: err?.message || "No se pudieron cargar proveedores.", variant: "destructive" });
      } finally {
        setLoadingSuppliers(false);
      }

      try {
        setLoadingProducts(true);
        const prods = await fetchJSON(joinUrl(API_BASE_URL, "/products?limit=500"));
        const list = pickArray<any>(prods).map((p: any) => ({
          id: String(p.id),
          sku: String(p.sku ?? ""),
          name: String(p.name ?? ""),
          category: typeof p?.category === "string" ? p.category : undefined,
          salePrice: Number.isFinite(+p?.price) ? +p.price : undefined,
          lastPurchasePrice: Number.isFinite(+p?.last_purchase_price) ? +p.last_purchase_price : undefined,
        })) as ProductOption[];
        setProductOptions(list);
      } catch (err: any) {
        toast({ title: "Error", description: err?.message || "No se pudieron cargar productos.", variant: "destructive" });
      } finally {
        setLoadingProducts(false);
      }
    })();
  }, [open]);

  // Preselección proveedor
  useEffect(() => {
    if (open && defaultSupplierId && supplierOptions.length) setSupplierId(defaultSupplierId);
  }, [open, defaultSupplierId, supplierOptions]);

  const resetForm = () => {
    setSupplierId("");
    setDate(new Date().toISOString().slice(0, 10));
    setInvoiceNumber("");
    setNotes("");
    setRemarkPct(0);
    setItems([]);
    setCurrentItem({ productId: "", quantity: 1, unitPrice: 0 });
    setProductQuery("");
    setSuggestOpen(false);
    setHighlightIndex(0);
    setCategoryFilter("");
  };

  // Opciones de categoría (deducidas)
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of productOptions) {
      const c = (p.category || "").trim();
      if (c) set.add(c);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [productOptions]);

  // Filtrado productos (query + categoría)
  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    return productOptions
      .filter((p) => {
        const matchQuery = !q || `${p.sku} ${p.name}`.toLowerCase().includes(q);
        const matchCat =
          !categoryFilter ||
          (p.category || "").toLowerCase() === categoryFilter.toLowerCase();
        return matchQuery && matchCat;
      })
      .slice(0, 100);
  }, [productQuery, productOptions, categoryFilter]);

  const selectedProduct = useMemo(
    () => (currentItem.productId ? productOptions.find((x) => x.id === currentItem.productId) : undefined),
    [currentItem.productId, productOptions]
  );

  // Selección
  const handleSelectProduct = (p: ProductOption) => {
    const preferredCost = clampDec(
      p?.lastPurchasePrice != null ? p.lastPurchasePrice : p?.salePrice != null ? p.salePrice : 0
    );
    setCurrentItem((prev) => ({
      ...prev,
      productId: p.id,
      unitPrice: prev.unitPrice > 0 ? clampDec(prev.unitPrice) : preferredCost,
    }));
    setProductQuery(`${p.sku} — ${p.name}`);
    setSuggestOpen(false);
  };

  const addOrMergeItem = (draft: ItemDraft) => {
    setItems((prev) => {
      const same = prev.findIndex((i) => i.productId === draft.productId && Number(i.unitPrice) === Number(draft.unitPrice));
      if (same >= 0) {
        const copy = [...prev];
        copy[same] = { ...copy[same], quantity: copy[same].quantity + draft.quantity };
        return copy;
      }
      return [...prev, draft];
    });
  };

  const handleAddItem = () => {
    const pid = currentItem.productId.trim();
    const exists = productOptions.some((p) => p.id === pid);
    const qty = clampInt(currentItem.quantity, 1);
    const cost = clampDec(currentItem.unitPrice, 0);

    if (!pid || !exists) {
      toast({ title: "Producto inválido", description: "Seleccioná un producto existente desde el buscador.", variant: "destructive" });
      return;
    }
    addOrMergeItem({ productId: pid, quantity: qty, unitPrice: cost });
    setCurrentItem({ productId: "", quantity: 1, unitPrice: 0 });
    setProductQuery("");
    setSuggestOpen(false);
    setHighlightIndex(0);
  };

  const handleRemoveItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const handleClearAll  = () => setItems([]);

  const handleSubmit = async () => {
    if (!supplierId) {
      toast({ title: "Proveedor requerido", description: "Seleccioná un proveedor.", variant: "destructive" });
      return;
    }
    if (!items.length) {
      toast({ title: "Sin ítems", description: "Agregá al menos un producto.", variant: "destructive" });
      return;
    }

    const pct = clampDec(remarkPct, 0);
    const applyRemark = pct > 0;

    try {
      setSubmitting(true);

      // Enviamos duplicando snake_case por compat, por si el backend lo espera así
      const payload = {
        supplierId,
        supplier_id: supplierId,
        date,
        documentNumber: invoiceNumber || null,
        document_number: invoiceNumber || null,
        notes: notes || null,
        applyRemark,
        apply_remark: applyRemark,
        defaultRemarkPct: applyRemark ? pct : null,
        default_remark_pct: applyRemark ? pct : null,
        items: items.map((it) => ({
          productId: it.productId,
          product_id: it.productId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          unit_price: it.unitPrice,
        })),
        user: null,
      };

      const resp = await api.post("/goods-receipts", payload);
      const raw = unwrap<any>(resp?.data);
      const data = unwrap<any>(raw);

      // Totales (tolera varias formas)
      const totalValue =
        getNumber(data?.total, data?.total_amount, data?.receipt?.total) ?? totalCostAmount;
      const itemsCount =
        getNumber(
          data?.items,
          data?.itemsCount,
          data?.items_count,
          data?.receipt?.items?.length
        ) ?? items.length;

      toast({
        title: "Mercadería registrada",
        description: `Comprobante #${data?.id ?? data?.receipt?.id ?? ""} | Ítems: ${itemsCount} | Total $${money(totalValue)}`,
      });

      // Detección robusta de "price updates"
      const arr =
        getArray(
          data?.priceUpdates,
          data?.price_updates,
          data?.updatedPrices,
          data?.updated_prices,
          data?.data?.priceUpdates,
          data?.result?.priceUpdates
        ) ?? [];

      const updatesCount =
        arr.length ||
        getNumber(
          data?.priceUpdatesCount,
          data?.price_updates_count,
          data?.updatedPricesCount,
          data?.updated_prices_count,
          data?.data?.priceUpdatesCount,
          data?.result?.priceUpdatesCount
        ) || 0;

      if (applyRemark) {
        toast({
          title: "Remarque aplicado",
          description: Number(updatesCount) > 0 ? `Precios actualizados: ${updatesCount}` : "No hubo precios para actualizar.",
        });
      }

      // Notificamos al padre y forzamos a centrar el historial en este proveedor
      onRegistered?.({ ...data, supplierId });

      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error al registrar",
        description: err?.message || "No se pudo registrar el ingreso.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const newSaleForCurrent = previewSalePrice(currentItem.unitPrice);

  // Autocomplete handlers
  const onSearchFocus = () => { setSuggestOpen(true); setHighlightIndex(0); };
  const onSearchBlur = () => { setTimeout(() => setSuggestOpen(false), 120); };
  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const max = filteredProducts.length;
    if (!max) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSuggestOpen(true); setHighlightIndex((i) => (i + 1) % max); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSuggestOpen(true); setHighlightIndex((i) => (i - 1 + max) % max); }
    else if (e.key === "Enter") { e.preventDefault(); const p = filteredProducts[highlightIndex]; if (p) handleSelectProduct(p); }
    else if (e.key === "Escape") { setSuggestOpen(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="w-[95vw] max-w-4xl sm:max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Mercadería</DialogTitle>
          <DialogDescription>
            Asociá el ingreso a un proveedor y agregá productos existentes desde el buscador.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* CABECERA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="supplier">Proveedor</Label>
              <Select value={supplierId} onValueChange={setSupplierId} disabled={loadingSuppliers || submitting}>
                <SelectTrigger id="supplier" aria-label="Seleccionar proveedor">
                  <SelectValue placeholder={loadingSuppliers ? "Cargando..." : "Seleccionar proveedor"} />
                </SelectTrigger>
                <SelectContent>
                  {supplierOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}{s.alias ? ` (${s.alias})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={submitting} />
            </div>
            <div>
              <Label htmlFor="invoice">N° Comprobante</Label>
              <Input
                id="invoice"
                placeholder="Ej: FAC-001234"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* AGREGAR PRODUCTO */}
          <div id="add-product-block" className="border border-border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Agregar Producto</h3>
            </div>

            {/* Fila: Categoría + Buscador + % remarque */}
            <div className="flex flex-col md:flex-row md:items-end gap-3">
              {/* Filtro por categoría */}
              <div className="w-full md:w-56">
                <Label htmlFor="categoryFilter" className="text-sm">Categoría</Label>
                <Select
                  value={categoryFilter === "" ? ALL_CATS : categoryFilter}
                  onValueChange={(val) => setCategoryFilter(val === ALL_CATS ? "" : val)}
                  disabled={loadingProducts || submitting}
                >
                  <SelectTrigger id="categoryFilter" className="mt-1">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_CATS}>Todas</SelectItem>
                    {categoryOptions.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Buscador */}
              <div className="relative w-full md:flex-1 min-w-0">
                <Label htmlFor="productSearch" className="text-sm">Buscar por SKU o nombre</Label>
                <Input
                  id="productSearch"
                  placeholder="Ej: PRD101 o Shampoo"
                  value={productQuery}
                  onChange={(e) => {
                    setProductQuery(e.target.value);
                    setSuggestOpen(true);
                    setHighlightIndex(0);
                    if (!e.target.value) setCurrentItem((prev) => ({ ...prev, productId: "" }));
                  }}
                  onFocus={onSearchFocus}
                  onBlur={onSearchBlur}
                  onKeyDown={onSearchKeyDown}
                  disabled={loadingProducts || submitting}
                  className="mt-1"
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-expanded={suggestOpen}
                  aria-controls="product-suggest-list"
                />

                {suggestOpen && filteredProducts.length > 0 && (
                  <div
                    id="product-suggest-list"
                    role="listbox"
                    className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg max-h-64 overflow-auto"
                  >
                    {filteredProducts.map((p, idx) => {
                      const isActive = idx === highlightIndex;
                      return (
                        <button
                          type="button"
                          key={p.id}
                          role="option"
                          aria-selected={isActive}
                          className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-3 hover:bg-accent ${isActive ? "bg-accent" : ""}`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelectProduct(p)}
                          onMouseEnter={() => setHighlightIndex(idx)}
                          title={`${p.sku} — ${p.name}`}
                        >
                          <span className="truncate">
                            <span className="font-medium">{p.sku}</span> — {p.name}
                            {p.category ? <span className="text-muted-foreground"> · {p.category}</span> : null}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-3">
                            <span>
                              Costo prev: {p.lastPurchasePrice != null ? `$${money(p.lastPurchasePrice)}` : "—"}
                            </span>
                            <span>
                              Venta: {p.salePrice != null ? `$${money(p.salePrice)}` : "—"}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* % remarque */}
              <div className="w-full md:w-36">
                <Label htmlFor="remarkPct" className="text-sm">% remarque</Label>
                <Input
                  id="remarkPct"
                  type="number"
                  min={0}
                  step={1}
                  value={remarkPct}
                  onChange={(e) => setRemarkPct(clampInt(e.target.value, 0))}
                  disabled={submitting}
                  className="mt-1 text-right"
                />
              </div>
            </div>

            {/* Resumen + Cantidad / Costo / Venta */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <Label>Producto seleccionado</Label>
                <div className="h-10 px-3 flex items-center rounded-md border border-border bg-muted/40 text-sm">
                  {selectedProduct ? (
                    <span className="truncate">{selectedProduct.sku} — {selectedProduct.name}</span>
                  ) : (
                    <span className="text-muted-foreground">Elegí un producto desde el buscador</span>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  value={currentItem.quantity}
                  onChange={(e) => setCurrentItem((prev) => ({ ...prev, quantity: clampInt(e.target.value, 1) }))}
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="unitPrice">Precio unitario</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  min={0}
                  value={currentItem.unitPrice}
                  onChange={(e) => setCurrentItem((prev) => ({ ...prev, unitPrice: clampDec(e.target.value, 0) }))}
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="salePreview">Precio venta</Label>
                <Input
                  id="salePreview"
                  value={Number.isFinite(newSaleForCurrent) ? newSaleForCurrent.toFixed(2) : ""}
                  disabled
                />
              </div>
            </div>

            {/* Ayudas del producto */}
            {selectedProduct && (
              <div className="text-xs text-muted-foreground flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Costo previo:</span>
                  <span>
                    {selectedProduct.lastPurchasePrice != null ? `$${money(selectedProduct.lastPurchasePrice)}` : "—"}
                  </span>
                  {selectedProduct.lastPurchasePrice != null && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-6 px-1"
                      onClick={() =>
                        setCurrentItem((prev) => ({ ...prev, unitPrice: clampDec(selectedProduct.lastPurchasePrice!, 0) }))
                      }
                    >
                      Usar
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium">Precio venta actual:</span>
                  <span>{selectedProduct.salePrice != null ? `$${money(selectedProduct.salePrice)}` : "—"}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClearAll} disabled={submitting || items.length === 0}>
                <Eraser className="w-4 h-4 mr-2" />
                Vaciar ítems
              </Button>
              <Button onClick={handleAddItem} disabled={submitting || !currentItem.productId}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar
              </Button>
            </div>
          </div>

          {/* ÍTEMS DEL INGRESO (no editables) */}
          {items.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
                <div>Ítems del ingreso</div>
                <div>% remarque: <b>{Math.max(0, Number(remarkPct) || 0)}%</b></div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px]">
                  <thead className="bg-accent/50">
                    <tr>
                      <th className="text-left  py-2 px-4 text-sm font-semibold">Producto</th>
                      <th className="text-center py-2 px-4 text-sm font-semibold">Cantidad</th>
                      <th className="text-right py-2 px-4 text-sm font-semibold">Precio unitario</th>
                      <th className="text-right py-2 px-4 text-sm font-semibold">% remarque</th>
                      <th className="text-right py-2 px-4 text-sm font-semibold">Precio venta</th>
                      <th className="text-right py-2 px-4 text-sm font-semibold">Total costo</th>
                      <th className="text-center py-2 px-4 text-sm font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => {
                      const p = productOptions.find((x) => x.id === it.productId);
                      const unitSale = previewSalePrice(it.unitPrice);
                      const lineCostTotal = Number(it.quantity || 0) * Number(it.unitPrice || 0);
                      return (
                        <tr key={idx} className="border-t border-border">
                          <td className="py-2 px-4 text-sm">{p ? `${p.sku} — ${p.name}` : it.productId}</td>
                          <td className="py-2 px-4 text-sm text-center tabular-nums">{it.quantity}</td>
                          <td className="py-2 px-4 text-sm text-right tabular-nums">${money(it.unitPrice)}</td>
                          <td className="py-2 px-4 text-sm text-right">{Math.max(0, Number(remarkPct) || 0)}%</td>
                          <td className="py-2 px-4 text-sm text-right tabular-nums">${money(unitSale)}</td>
                          <td className="py-2 px-4 text-sm text-right font-semibold tabular-nums">${money(lineCostTotal)}</td>
                          <td className="py-2 px-4 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleRemoveItem(idx)}
                              disabled={submitting}
                              aria-label="Eliminar ítem"
                              title="Eliminar ítem"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-border bg-accent/30">
                    <tr>
                      <td colSpan={5} className="py-3 px-4 text-right font-semibold">Total costo:</td>
                      <td className="py-3 px-4 text-right font-bold text-primary tabular-nums">${money(totalCostAmount)}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan={5} className="py-2 px-4 text-right font-semibold">Total venta (con remarque):</td>
                      <td className="py-2 px-4 text-right font-bold tabular-nums">${money(totalSaleAmount)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Observaciones adicionales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={submitting}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !supplierId || items.length === 0}>
            {submitting ? "Guardando..." : "Registrar Mercadería"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
