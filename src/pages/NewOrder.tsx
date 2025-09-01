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
  product: string;
  quantity: number;
  price: number;
}

const NewOrder = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState("");
  const [saleCondition, setSaleCondition] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([{ product: "", quantity: 1, price: 0 }]);

  const handleAddItem = () => {
    setOrderItems([...orderItems, { product: "", quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...orderItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setOrderItems(newItems);
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
  const discount = saleCondition === "con-descuento" ? subtotal * 0.1 : 0;
  const total = subtotal - discount;

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

            {/* Products */}
            <Card>
              <CardHeader>
                <CardTitle>Productos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {orderItems.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Select
                      value={item.product}
                      onValueChange={(value) => {
                        handleUpdateItem(index, "product", value);
                        // Auto-fill price based on product
                        const prices: { [key: string]: number } = {
                          "detergente": 85,
                          "lavandina": 45,
                          "jabon": 120,
                          "desengrasante": 95,
                        };
                        if (prices[value]) {
                          handleUpdateItem(index, "price", prices[value]);
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="detergente">Detergente 5L</SelectItem>
                        <SelectItem value="lavandina">Lavandina 5L</SelectItem>
                        <SelectItem value="jabon">Jabón Líquido 5L</SelectItem>
                        <SelectItem value="desengrasante">Desengrasante 1L</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Cantidad"
                      className="w-24"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(index, "quantity", parseInt(e.target.value) || 1)}
                    />
                    <Input
                      type="number"
                      placeholder="Precio"
                      className="w-32"
                      value={item.price}
                      onChange={(e) => handleUpdateItem(index, "price", parseFloat(e.target.value) || 0)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                      disabled={orderItems.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-2" /> Agregar Producto
                </Button>
              </CardContent>
            </Card>
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
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Descuento (10%):</span>
                      <span className="text-success">-${discount.toFixed(2)}</span>
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