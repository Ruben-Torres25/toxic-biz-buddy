import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NewOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewOrderModal({ open, onOpenChange }: NewOrderModalProps) {
  const { toast } = useToast();
  const [orderItems, setOrderItems] = useState([{ product: "", quantity: 1, price: 0 }]);

  const handleAddItem = () => {
    setOrderItems([...orderItems, { product: "", quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    toast({
      title: "Pedido Creado",
      description: "El pedido ha sido registrado exitosamente.",
    });
    onOpenChange(false);
    setOrderItems([{ product: "", quantity: 1, price: 0 }]);
  };

  const total = orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo Pedido</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">Cliente</Label>
              <Select>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Juan Pérez - Av. Principal 123</SelectItem>
                  <SelectItem value="2">María García - Calle 45 #67</SelectItem>
                  <SelectItem value="3">Carlos López - Barrio Centro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Fecha de Entrega</Label>
              <Input id="date" type="date" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Productos</Label>
            {orderItems.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Select>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccionar producto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="detergente">Detergente 5L - $85.00</SelectItem>
                    <SelectItem value="lavandina">Lavandina 5L - $45.00</SelectItem>
                    <SelectItem value="jabon">Jabón Líquido 5L - $120.00</SelectItem>
                    <SelectItem value="desengrasante">Desengrasante 1L - $95.00</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Cantidad"
                  className="w-24"
                  value={item.quantity}
                  onChange={(e) => {
                    const newItems = [...orderItems];
                    newItems[index].quantity = parseInt(e.target.value) || 1;
                    setOrderItems(newItems);
                  }}
                />
                <Input
                  type="number"
                  placeholder="Precio"
                  className="w-32"
                  value={item.price}
                  onChange={(e) => {
                    const newItems = [...orderItems];
                    newItems[index].price = parseFloat(e.target.value) || 0;
                    setOrderItems(newItems);
                  }}
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
            <Button variant="outline" size="sm" onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-1" /> Agregar Producto
            </Button>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Crear Pedido</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
