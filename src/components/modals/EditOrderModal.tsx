import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface Order {
  id: string;
  client: string;
  date: string;
  total: number;
  status: string;
  items: number;
}

interface EditOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onSave: (order: Order) => void;
}

export function EditOrderModal({ open, onOpenChange, order, onSave }: EditOrderModalProps) {
  const [editedOrder, setEditedOrder] = useState<Order | null>(order);

  if (!order) return null;

  const handleSave = () => {
    if (editedOrder) {
      onSave(editedOrder);
      toast({
        title: "Pedido actualizado",
        description: `El pedido ${editedOrder.id} ha sido actualizado exitosamente.`,
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Pedido {order.id}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="client">Cliente</Label>
            <Input
              id="client"
              value={editedOrder?.client || ""}
              onChange={(e) => setEditedOrder(prev => prev ? {...prev, client: e.target.value} : null)}
            />
          </div>

          <div>
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              value={editedOrder?.date || ""}
              onChange={(e) => setEditedOrder(prev => prev ? {...prev, date: e.target.value} : null)}
            />
          </div>

          <div>
            <Label htmlFor="status">Estado</Label>
            <Select
              value={editedOrder?.status || ""}
              onValueChange={(value) => setEditedOrder(prev => prev ? {...prev, status: value} : null)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="total">Total</Label>
            <Input
              id="total"
              type="number"
              step="0.01"
              value={editedOrder?.total || 0}
              onChange={(e) => setEditedOrder(prev => prev ? {...prev, total: parseFloat(e.target.value)} : null)}
            />
          </div>
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