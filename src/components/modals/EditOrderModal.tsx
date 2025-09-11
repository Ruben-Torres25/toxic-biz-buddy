import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface OrderItem {
  productCode: string;
  product: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

interface Order {
  id: string;
  client: string;
  date: string;
  total: number;
  status: string;
  items: OrderItem[];
  address?: string;
  payment?: string;
}

interface EditOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onSave: (order: Order) => void;
}

export function EditOrderModal({ open, onOpenChange, order, onSave }: EditOrderModalProps) {
  const [editedOrder, setEditedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (order) {
      setEditedOrder({ ...order });
    }
  }, [order]);

  if (!order || !editedOrder) return null;

  const handleSave = () => {
    if (editedOrder) {
      const newTotal = editedOrder.items.reduce((sum, item) => sum + item.total, 0);
      const updatedOrder = { ...editedOrder, total: newTotal };
      onSave(updatedOrder);
      toast({
        title: "Pedido actualizado",
        description: `El pedido ${editedOrder.id} ha sido actualizado exitosamente.`,
      });
      onOpenChange(false);
    }
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...editedOrder.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalcular total del item
    const item = newItems[index];
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = subtotal * (item.discount / 100);
    item.total = subtotal - discountAmount;
    
    setEditedOrder({ ...editedOrder, items: newItems });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = editedOrder.items.filter((_, i) => i !== index);
    setEditedOrder({ ...editedOrder, items: newItems });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Pedido {order.id}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">Cliente</Label>
              <Input
                id="client"
                value={editedOrder.client}
                onChange={(e) => setEditedOrder({...editedOrder, client: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={editedOrder.date}
                onChange={(e) => setEditedOrder({...editedOrder, date: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Estado</Label>
              <Select
                value={editedOrder.status}
                onValueChange={(value) => setEditedOrder({...editedOrder, status: value})}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payment">Método de Pago</Label>
              <Input
                id="payment"
                value={editedOrder.payment || ""}
                onChange={(e) => setEditedOrder({...editedOrder, payment: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Dirección de Entrega</Label>
            <Input
              id="address"
              value={editedOrder.address || ""}
              onChange={(e) => setEditedOrder({...editedOrder, address: e.target.value})}
            />
          </div>

          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">Productos del Pedido</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 text-sm">Código</th>
                      <th className="text-left py-2 px-2 text-sm">Producto</th>
                      <th className="text-left py-2 px-2 text-sm">Cantidad</th>
                      <th className="text-left py-2 px-2 text-sm">P. Unitario</th>
                      <th className="text-left py-2 px-2 text-sm">Descuento %</th>
                      <th className="text-left py-2 px-2 text-sm">Total</th>
                      <th className="text-left py-2 px-2 text-sm">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editedOrder.items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 px-2">
                          <Input
                            value={item.productCode}
                            onChange={(e) => handleItemChange(index, 'productCode', e.target.value)}
                            className="h-8"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            value={item.product}
                            onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                            className="h-8"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                            className="h-8 w-20"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                            className="h-8 w-24"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <Input
                            type="number"
                            value={item.discount}
                            onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value))}
                            className="h-8 w-20"
                          />
                        </td>
                        <td className="py-2 px-2 font-semibold">
                          ${item.total.toFixed(2)}
                        </td>
                        <td className="py-2 px-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 text-right">
                <p className="text-lg font-semibold">
                  Total del Pedido: ${editedOrder.items.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}