// src/pages/orders/NewOrder.tsx (o donde tengas este componente)
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { Customer, Product } from "@/types/domain";
import { OrdersAPI } from "@/services/orders.api";

interface UIOrderItem {
  id: string;
  productId: string;
  productCode?: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number; // UI solo (se convierte a $ al enviar)
}

const NewOrder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Datos remotos
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Estado del form
  const [clientId, setClientId] = useState("");
  const [saleCondition, setSaleCondition] = useState("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");

  const [orderItems, setOrderItems] = useState<UIOrderItem[]>([]);

  // Form para agregar un ítem
  const [currentProductId, setCurrentProductId] = useState("");
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [currentDiscountPercent, setCurrentDiscountPercent] = useState(0);

  // Carga inicial de clientes y productos desde el backend
  useEffect(() => {
    (async () => {
      try {
        const [customersRes, productsRes] = await Promise.all([
          api.get<Customer[]>("/customers"),
          api.get<Product[]>("/products"),
        ]);
        setCustomers(customersRes);
        setProducts(productsRes);
      } catch (e: any) {
        toast({
          title: "Error cargando datos",
          description: e?.message ?? "No se pudieron cargar clientes/productos",
          variant: "destructive",
        });
      }
    })();
  }, [toast]);

  const selectedProduct = useMemo(
    () => products.find(p => p.id === currentProductId),
    [products, currentProductId]
  );

  const handleAddItem = () => {
    if (!currentProductId) {
      toast({
        title: "Falta producto",
        description: "Por favor selecciona un producto",
        variant: "destructive",
      });
      return;
    }
    if (!selectedProduct) return;

    const newItem: UIOrderItem = {
      id: crypto.randomUUID(),
      productId: selectedProduct.id,
      productCode: selectedProduct.sku,
      productName: selectedProduct.name,
      quantity: currentQuantity,
      unitPrice: Number(selectedProduct.price ?? 0),
      discountPercent: currentDiscountPercent,
    };

    setOrderItems(prev => [...prev, newItem]);

    // Reset form
    setCurrentProductId("");
    setCurrentQuantity(1);
    setCurrentDiscountPercent(0);

    toast({
      title: "Producto agregado",
      description: `${selectedProduct.name} fue agregado al pedido`,
    });
  };

  const handleRemoveItem = (id: string) => {
    setOrderItems(items => items.filter(i => i.id !== id));
  };

  // Cálculos
  const subtotal = useMemo(
    () => orderItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
    [orderItems]
  );

  const productDiscounts = useMemo(
    () => orderItems.reduce((sum, i) => {
      const line = i.quantity * i.unitPrice;
      return sum + (line * (i.discountPercent / 100));
    }, 0),
    [orderItems]
  );

  const generalDiscount = useMemo(() => {
    // si usás condición "con-descuento" aplica 10% al neto restante
    return saleCondition === "con-descuento" ? (subtotal - productDiscounts) * 0.1 : 0;
  }, [saleCondition, subtotal, productDiscounts]);

  const total = useMemo(
    () => subtotal - productDiscounts - generalDiscount,
    [subtotal, productDiscounts, generalDiscount]
  );

  const handleSubmit = async () => {
    if (!clientId) {
      toast({
        title: "Falta cliente",
        description: "Selecciona un cliente",
        variant: "destructive",
      });
      return;
    }
    if (orderItems.length === 0) {
      toast({
        title: "Pedido vacío",
        description: "Agrega al menos un producto",
        variant: "destructive",
      });
      return;
    }

    // Convertir % a monto por línea (lo que espera el backend)
    const items = orderItems.map(i => {
      const line = i.unitPrice * i.quantity;
      const discountAmount = line * (i.discountPercent / 100);
      return {
        productId: i.productId,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        discount: Number(discountAmount.toFixed(2)),
      };
    });

    try {
      const payload = {
        customerId: clientId,
        items,
        // opcional:
        // notes: deliveryDate ? `Entrega: ${deliveryDate}` : undefined,
      };

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
          <p className="text-muted-foreground">Completa los datos para crear un nuevo pedido</p>
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
                      {customers.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="condition">Condición de Venta</Label>
                  <Select value={saleCondition} onValueChange={setSaleCondition}>
                    <SelectTrigger id="condition">
                      <SelectValue placeholder="Seleccionar condición" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sin-descuento">Sin Descuento</SelectItem>
                      <SelectItem value="con-descuento">Con Descuento (10%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date">Fecha de Entrega</Label>
                  <Input
                    id="date"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Add Product Form */}
            <Card>
              <CardHeader>
                <CardTitle>Agregar Producto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="product">Producto</Label>
                    <Select value={currentProductId} onValueChange={setCurrentProductId}>
                      <SelectTrigger id="product">
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} — ${p.price.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quantity">Cantidad</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={currentQuantity}
                      onChange={(e) => setCurrentQuantity(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="discount">Descuento (%)</Label>
                    <Input
                      id="discount"
                      type="number"
                      min="0"
                      max="100"
                      value={currentDiscountPercent}
                      onChange={(e) => setCurrentDiscountPercent(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <Button className="mt-4" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-2" /> Agregar Producto
                </Button>
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
                          <th className="text-left p-2 font-medium text-muted-foreground">Código</th>
                          <th className="text-left p-2 font-medium text-muted-foreground">Nombre del Producto</th>
                          <th className="text-center p-2 font-medium text-muted-foreground">Cantidad</th>
                          <th className="text-right p-2 font-medium text-muted-foreground">Precio Unitario</th>
                          <th className="text-right p-2 font-medium text-muted-foreground">Descuento</th>
                          <th className="text-right p-2 font-medium text-muted-foreground">Precio Sumado</th>
                          <th className="text-center p-2 font-medium text-muted-foreground">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderItems.map((item) => {
                          const line = item.quantity * item.unitPrice;
                          const discountAmount = line * (item.discountPercent / 100);
                          const lineTotal = line - discountAmount;

                          return (
                            <tr key={item.id} className="border-b">
                              <td className="p-2 text-sm">{item.productCode ?? "-"}</td>
                              <td className="p-2 text-sm">{item.productName ?? "-"}</td>
                              <td className="p-2 text-center text-sm">{item.quantity}</td>
                              <td className="p-2 text-right text-sm">${item.unitPrice.toFixed(2)}</td>
                              <td className="p-2 text-right text-sm">
                                {item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}
                              </td>
                              <td className="p-2 text-right font-semibold text-sm">${lineTotal.toFixed(2)}</td>
                              <td className="p-2 text-center">
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
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
                      <span className="text-muted-foreground">Descuentos de productos:</span>
                      <span className="text-destructive">-${productDiscounts.toFixed(2)}</span>
                    </div>
                  )}
                  {generalDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Descuento general (10%):</span>
                      <span className="text-destructive">-${generalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total:</span>
                      <span className="font-semibold text-xl">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button className="w-full" onClick={handleSubmit}>
                    <Save className="w-4 h-4 mr-2" />
                    Crear Pedido
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewOrder;
