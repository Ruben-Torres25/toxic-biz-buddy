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
  // 👇 Descuento global (condición de venta)
  const [discountGlobalPct, setDiscountGlobalPct] = useState<number>(0);

  const handleAddItem = () => {
    setOrderItems([...orderItems, { product: "", quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Si acá llamás a tu API, incluí:
    // { discountGlobalPercent: discountGlobalPct, discountGlobal: discountAmount, total: total }
    toast({
      title: "Pedido Creado",
      description: `Se registró el pedido. Descuento global: ${discountGlobalPct}%`,
    });
    onOpenChange(false);
    setOrderItems([{ product: "", quantity: 1, price: 0 }]);
    setDiscountGlobalPct(0);
  };

  const subtotal = orderItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0);
  const clampedPct = Math.min(100, Math.max(0, Number.isFinite(discountGlobalPct) ? discountGlobalPct : 0));
  const discountAmount = +(subtotal * (clampedPct / 100)).toFixed(2);
  const total = subtotal - discountAmount;

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

          {/* Condición de venta: descuento global */}
          <div>
            <Label>Condición de venta (Descuento global %)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              step="0.5"
              placeholder="0"
              value={discountGlobalPct}
              onChange={(e) => setDiscountGlobalPct(parseFloat(e.target.value || "0"))}
            />
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

          <div className="border-t pt-4 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {clampedPct > 0 && (
              <div className="flex justify-between text-sm text-destructive">
                <span>Descuento global ({clampedPct}%):</span>
                <span>- ${discountAmount.toFixed(2)}</span>
              </div>
            )}
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
