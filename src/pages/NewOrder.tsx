import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, ArrowLeft, Save, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { Customer, Product, OrderItemDTO, CreateOrderDTO } from "@/types/domain";
import { OrdersAPI } from "@/services/orders.api";
import ProductSearchModal from "@/components/modals/ProductSearchModal";

interface UIOrderItem {
  id: string;
  productId: string;
  productCode?: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number; // % por ítem (UI)
}

const clampPct = (n: number) =>
  Math.min(100, Math.max(0, Number.isFinite(n) ? n : 0));
const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const IVA_RATE = 0.21;

const NewOrder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Datos remotos
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Estado del form
  const [clientId, setClientId] = useState("");
  const [saleDiscountPct, setSaleDiscountPct] = useState<number>(0); // ← % manual (condición de venta)

  const [orderItems, setOrderItems] = useState<UIOrderItem[]>([]);

  // Modal products
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // ====== Modo avanzado (SKU directo) ======
  const [advSku, setAdvSku] = useState("");
  const [advQty, setAdvQty] = useState(1);
  const [advDiscPct, setAdvDiscPct] = useState(0);
  const [advLoading, setAdvLoading] = useState(false);

  // Carga inicial de clientes
  useEffect(() => {
    (async () => {
      try {
        const customersRes = await api.get<Customer[]>("/customers");
        setCustomers(Array.isArray(customersRes) ? customersRes : []);
      } catch (e: any) {
        toast({
          title: "Error cargando datos",
          description: e?.message ?? "No se pudieron cargar clientes",
          variant: "destructive",
        });
      }
    })();
  }, [toast]);

  // Cantidades ya elegidas (para el modal)
  const inOrderMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const it of orderItems) {
      m[it.productId] = (m[it.productId] ?? 0) + it.quantity;
    }
    return m;
  }, [orderItems]);

  // Helpers
  const mergeOrPushItem = (payload: {
    product: Product;
    quantity: number;
    discountPercent: number;
  }) => {
    const { product, quantity, discountPercent } = payload;

    setOrderItems((prev) => {
      // Apilar si mismo producto y mismo %descuento
      const idx = prev.findIndex(
        (r) => r.productId === product.id && r.discountPercent === discountPercent
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          quantity: next[idx].quantity + quantity,
        };
        return next;
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          productId: product.id,
          productCode: product.sku,
          productName: product.name,
          quantity,
          unitPrice: Number(product.price ?? 0),
          discountPercent,
        },
      ];
    });

    toast({
      title: "Producto agregado",
      description: `${product.name} x${quantity}`,
    });
  };

  // Agregar desde modal
  const handlePickFromModal = (p: { product: Product; quantity: number; discountPercent: number }) => {
    mergeOrPushItem(p);
  };

  // Agregar desde modo avanzado
  const handleAddAdvanced = async () => {
    const sku = advSku.trim();
    const qty = Math.max(1, Math.floor(advQty || 1));
    const disc = Math.min(100, Math.max(0, Number.isFinite(advDiscPct) ? advDiscPct : 0));

    if (!sku) {
      toast({ title: "Ingresá un SKU", variant: "destructive" });
      return;
    }

    try {
      setAdvLoading(true);

      // Buscamos por SKU exacto, y si no hay exacto, intentamos por patrón
      let prod: Product | null = null;

      try {
        const exact = await api.get<any>("/products", { sku });
        const list = Array.isArray(exact) ? exact : (exact?.items ?? exact?.data ?? exact?.results ?? []);
        if (Array.isArray(list) && list.length > 0) {
          const found = list.find((p: any) => String(p.sku).toUpperCase() === sku.toUpperCase());
          if (found) prod = found as Product;
          else if (list.length === 1) prod = list[0] as Product;
        }
      } catch {}

      if (!prod) {
        const alt = await api.get<any>("/products", { sku: `${sku}%` });
        const list = Array.isArray(alt) ? alt : (alt?.items ?? alt?.data ?? alt?.results ?? []);
        if (Array.isArray(list) && list.length > 0) {
          prod = list[0] as Product;
        }
      }

      if (!prod) {
        toast({ title: "SKU no encontrado", description: sku, variant: "destructive" });
        return;
      }

      // Clampear por disponibilidad visible
      const baseAvail =
        (typeof prod.available === "number"
          ? prod.available
          : Math.max(0, Number(prod.stock ?? 0) - Number(prod.reserved ?? 0))) || 0;
      const already = inOrderMap[prod.id] ?? 0;
      const disp = Math.max(0, baseAvail - already);
      if (disp <= 0) {
        toast({ title: "Sin disponibilidad", description: `${prod.name}`, variant: "destructive" });
        return;
      }
      const finalQty = Math.min(qty, disp);

      mergeOrPushItem({ product: prod, quantity: finalQty, discountPercent: disc });

      // Reset avanzado
      setAdvSku("");
      setAdvQty(1);
      setAdvDiscPct(0);
    } catch (e: any) {
      toast({
        title: "No se pudo agregar",
        description: e?.message ?? "Error al buscar/agregar por SKU",
        variant: "destructive",
      });
    } finally {
      setAdvLoading(false);
    }
  };

  const handleRemoveItem = (id: string) => {
    setOrderItems((items) => items.filter((i) => i.id !== id));
  };

  // ========= Cálculos =========
  const subtotal = useMemo(
    () => orderItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
    [orderItems]
  );

  const basePerLine = useMemo(
    () => orderItems.map((i) => i.quantity * i.unitPrice),
    [orderItems]
  );

  const itemDiscPerLine = useMemo(
    () => orderItems.map((i, idx) => basePerLine[idx] * (i.discountPercent / 100)),
    [orderItems, basePerLine]
  );

  const productDiscounts = useMemo(
    () => r2(itemDiscPerLine.reduce((a, n) => a + n, 0)),
    [itemDiscPerLine]
  );

  // "No apila": aplicar global SOLO a líneas sin descuento por ítem
  const netAfterItemPerLine = useMemo(
    () => basePerLine.map((b, idx) => r2(b - itemDiscPerLine[idx])),
    [basePerLine, itemDiscPerLine]
  );

  const eligibleMask = useMemo(
    () => orderItems.map((i) => (i.discountPercent || 0) === 0),
    [orderItems]
  );

  const eligibleNetAfterItem = useMemo(
    () => r2(netAfterItemPerLine.reduce((a, x, idx) => a + (eligibleMask[idx] ? x : 0), 0)),
    [netAfterItemPerLine, eligibleMask]
  );

  const generalPct = clampPct(saleDiscountPct); // % manual ingresado
  const generalAmount = useMemo(
    () => r2(eligibleNetAfterItem * (generalPct / 100)),
    [eligibleNetAfterItem, generalPct]
  );

  // Neto s/IVA
  const total = useMemo(
    () => r2(subtotal - productDiscounts - generalAmount),
    [subtotal, productDiscounts, generalAmount]
  );

  const handleSubmit = async () => {
    if (!clientId) {
      toast({
        title: "Falta cliente",
        description: "Seleccioná un cliente",
        variant: "destructive",
      });
      return;
    }
    if (orderItems.length === 0) {
      toast({
        title: "Pedido vacío",
        description: "Agregá al menos un producto",
        variant: "destructive",
      });
      return;
    }

    // ===== DTO: prorratear general SÓLO entre elegibles =====
    const share = eligibleNetAfterItem > 0
      ? netAfterItemPerLine.map((net, idx) => (eligibleMask[idx] ? net / eligibleNetAfterItem : 0))
      : orderItems.map(() => 0);

    const generalPerLine = share.map((s) => r2(s * generalAmount));

    const items: OrderItemDTO[] = orderItems.map((i, idx) => {
      const discountOwn = itemDiscPerLine[idx];
      const discountTotalLine = r2(discountOwn + generalPerLine[idx]);
      return {
        productId: i.productId,
        productName: i.productName ?? "",
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        discount: discountTotalLine,
      };
    });

    // ✅ Guardar total CON IVA
    const netNoIVA = r2(total);
    const tax = r2(netNoIVA * IVA_RATE);
    const gross = r2(netNoIVA + tax);

    const payload: CreateOrderDTO & {
      globalDiscountPercent?: number;
      globalDiscountAmount?: number;
      globalDiscountBase?: number;
      subtotal?: number;
      tax?: number;
      total?: number;
    } = {
      customerId: clientId,
      items,
      globalDiscountPercent: generalPct,
      globalDiscountAmount: generalAmount,
      globalDiscountBase: eligibleNetAfterItem,
      // 👇 nuevos campos para que el Historial tenga el total con IVA
      subtotal: netNoIVA, // s/IVA
      tax,                // IVA
      total: gross,       // c/IVA
    };

    try {
      await OrdersAPI.create(payload);
      toast({
        title: "Pedido creado",
        description: "El pedido fue registrado exitosamente.",
      });
      navigate("/");
    } catch (e: any) {
      toast({
        title: "Error al crear",
        description: e?.message ?? "No se pudo registrar el pedido",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Nuevo Pedido</h1>
          <p className="text-muted-foreground">
            Completá los datos para crear un nuevo pedido
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client and Sale Condition */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="client">Cliente</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger id="client">
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Campo numérico para % de descuento manual */}
                <div>
                  <Label htmlFor="conditionPct">Condición de Venta (Descuento %)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="conditionPct"
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      placeholder="0"
                      value={String(saleDiscountPct ?? "")}
                      onChange={(e) => setSaleDiscountPct(clampPct(parseFloat(e.target.value || "0")))}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Se aplica solo a los ítems sin descuento por ítem.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Agregar Productos */}
            <Card>
              <CardHeader>
                <CardTitle>Agregar Productos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Flujo principal: Modal de búsqueda */}
                <div className="rounded-md border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      Usá el buscador para filtrar, ver disponibilidad y agregar con cantidad y descuento.
                    </div>
                    <Button type="button" onClick={() => setIsProductModalOpen(true)}>
                      <Search className="w-4 h-4 mr-2" />
                      Buscar / Filtrar productos
                    </Button>
                  </div>
                </div>

                {/* Modo Avanzado (SKU directo) */}
                <div className="rounded-md border p-4 space-y-3">
                  <div className="font-medium">Modo avanzado · Agregar por SKU</div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="col-span-1">
                      <Label htmlFor="advSku">SKU</Label>
                      <Input
                        id="advSku"
                        placeholder="ABC123"
                        value={advSku}
                        onChange={(e) => setAdvSku(e.target.value)}
                      />
                    </div>
                    <div className="col-span-1">
                      <Label htmlFor="advQty">Cantidad</Label>
                      <Input
                        id="advQty"
                        type="number"
                        min={1}
                        value={advQty}
                        onChange={(e) => {
                          const v = parseInt(e.target.value || "1", 10);
                          setAdvQty(Number.isFinite(v) && v > 0 ? v : 1);
                        }}
                      />
                    </div>
                    <div className="col-span-1">
                      <Label htmlFor="advDisc">Desc. (%)</Label>
                      <Input
                        id="advDisc"
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={advDiscPct}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          const clamped = Math.min(100, Math.max(0, Number.isFinite(v) ? v : 0));
                          setAdvDiscPct(clamped);
                        }}
                      />
                    </div>
                    <div className="col-span-1 flex items-end">
                      <Button className="w-full" onClick={handleAddAdvanced} disabled={advLoading}>
                        Agregar
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sugerencia: el sistema controla stock disponible (stock - reservado - ya en el pedido).
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Products Table */}
            {orderItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Productos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium text-muted-foreground">
                            Código
                          </th>
                          <th className="text-left p-2 font-medium text-muted-foreground">
                            Nombre del Producto
                          </th>
                          <th className="text-center p-2 font-medium text-muted-foreground">
                            Cantidad
                          </th>
                          <th className="text-right p-2 font-medium text-muted-foreground">
                            Precio Unitario
                          </th>
                          <th className="text-right p-2 font-medium text-muted-foreground">
                            Descuento
                          </th>
                          <th className="text-right p-2 font-medium text-muted-foreground">
                            Precio Sumado
                          </th>
                          <th className="text-center p-2 font-medium text-muted-foreground">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderItems.map((item, idx) => {
                          const line = basePerLine[idx];
                          const discountAmount = itemDiscPerLine[idx];
                          const lineTotal = r2(line - discountAmount);

                          return (
                            <tr key={item.id} className="border-b">
                              <td className="p-2 text-sm">{item.productCode ?? "-"}</td>
                              <td className="p-2 text-sm">{item.productName ?? "-"}</td>
                              <td className="p-2 text-center text-sm">{item.quantity}</td>
                              <td className="p-2 text-right text-sm">
                                ${item.unitPrice.toFixed(2)}
                              </td>
                              <td className="p-2 text-right text-sm">
                                {item.discountPercent > 0
                                  ? `${item.discountPercent}%`
                                  : "-"}
                              </td>
                              <td className="p-2 text-right font-semibold text-sm">
                                ${lineTotal.toFixed(2)}
                              </td>
                              <td className="p-2 text-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveItem(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {productDiscounts > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Descuentos por ítem:
                      </span>
                      <span className="text-destructive">
                        -${productDiscounts.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {generalPct > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Condición de venta ({generalPct}%):
                      </span>
                      <span className="text-destructive">
                        -${generalAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total:</span>
                      <span className="font-semibold text-xl">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button className="w-full" onClick={handleSubmit}>
                    <Save className="w-4 h-4 mr-2" />
                    Crear Pedido
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/")}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* MODAL: búsqueda avanzada de productos */}
      <ProductSearchModal
        open={isProductModalOpen}
        onOpenChange={setIsProductModalOpen}
        onPick={handlePickFromModal}
        inOrder={inOrderMap}
      />
    </div>
  );
};

export default NewOrder;
