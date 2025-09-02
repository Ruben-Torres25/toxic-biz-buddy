import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  id: string;
  product: string;
  productCode: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
}

const NewOrder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState("");
  const [saleCondition, setSaleCondition] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  
  // Form state for adding products
  const [currentProduct, setCurrentProduct] = useState("");
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [currentDiscount, setCurrentDiscount] = useState(0);

  const productData: { [key: string]: { price: number, code: string, name: string } } = {
    "detergente": { price: 85, code: "DET-5L", name: "Detergente 5L" },
    "lavandina": { price: 45, code: "LAV-5L", name: "Lavandina 5L" },
    "jabon": { price: 120, code: "JAB-5L", name: "Jabón Líquido 5L" },
    "desengrasante": { price: 95, code: "DES-1L", name: "Desengrasante 1L" },
  };

  const handleAddItem = () => {
    if (!currentProduct) {
      toast({
        title: "Error",
        description: "Por favor selecciona un producto",
        variant: "destructive",
      });
      return;
    }

    const product = productData[currentProduct];
    if (product) {
      const newItem: OrderItem = {
        id: Date.now().toString(),
        product: currentProduct,
        productCode: product.code,
        productName: product.name,
        quantity: currentQuantity,
        price: product.price,
        discount: currentDiscount,
      };
      
      setOrderItems([...orderItems, newItem]);
      
      // Reset form
      setCurrentProduct("");
      setCurrentQuantity(1);
      setCurrentDiscount(0);
      
      toast({
        title: "Producto agregado",
        description: `${product.name} ha sido agregado al pedido`,
      });
    }
  };

  const handleRemoveItem = (id: string) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const handleSubmit = () => {
    if (!client) {
      toast({
        title: "Error",
        description: "Por favor selecciona un cliente",
        variant: "destructive",
      });
      return;
    }

    if (!saleCondition) {
      toast({
        title: "Error",
        description: "Por favor selecciona una condición de venta",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Pedido Creado",
      description: "El pedido ha sido registrado exitosamente.",
    });
    navigate("/");
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const productDiscounts = orderItems.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.price;
    return sum + (itemSubtotal * (item.discount / 100));
  }, 0);
  const generalDiscount = saleCondition === "con-descuento" ? (subtotal - productDiscounts) * 0.1 : 0;
  const total = subtotal - productDiscounts - generalDiscount;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="mb-4"
          >
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
                  <Select value={client} onValueChange={setClient}>
                    <SelectTrigger id="client">
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Juan Pérez - Av. Principal 123</SelectItem>
                      <SelectItem value="2">María García - Calle 45 #67</SelectItem>
                      <SelectItem value="3">Carlos López - Barrio Centro</SelectItem>
                      <SelectItem value="4">Ana Rodríguez - Zona Norte</SelectItem>
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
                  <Input id="date" type="date" />
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
                    <Select value={currentProduct} onValueChange={setCurrentProduct}>
                      <SelectTrigger id="product">
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="detergente">Detergente 5L</SelectItem>
                        <SelectItem value="lavandina">Lavandina 5L</SelectItem>
                        <SelectItem value="jabon">Jabón Líquido 5L</SelectItem>
                        <SelectItem value="desengrasante">Desengrasante 1L</SelectItem>
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
                      value={currentDiscount}
                      onChange={(e) => setCurrentDiscount(parseFloat(e.target.value) || 0)}
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
                          const subtotal = item.quantity * item.price;
                          const discountAmount = subtotal * (item.discount / 100);
                          const total = subtotal - discountAmount;
                          
                          return (
                            <tr key={item.id} className="border-b">
                              <td className="p-2 text-sm">{item.productCode}</td>
                              <td className="p-2 text-sm">{item.productName}</td>
                              <td className="p-2 text-center text-sm">{item.quantity}</td>
                              <td className="p-2 text-right text-sm">${item.price.toFixed(2)}</td>
                              <td className="p-2 text-right text-sm">
                                {item.discount > 0 ? `${item.discount}%` : '-'}
                              </td>
                              <td className="p-2 text-right font-semibold text-sm">${total.toFixed(2)}</td>
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
                  <Button 
                    className="w-full" 
                    onClick={handleSubmit}
                  >
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
    </div>
  );
};

export default NewOrder;