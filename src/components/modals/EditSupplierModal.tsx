import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface Supplier {
  id: string;
  name: string;
  ruc: string;
  contact: string;
  address: string;
  phone: string;
  email: string;
  products: string;
  paymentTerms?: string;
  deliveryTime?: string;
  notes?: string;
}

interface EditSupplierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  onSave: (supplier: Supplier) => void;
}

export function EditSupplierModal({ open, onOpenChange, supplier, onSave }: EditSupplierModalProps) {
  const [editedSupplier, setEditedSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    if (supplier) {
      setEditedSupplier({ ...supplier });
    }
  }, [supplier]);

  if (!supplier || !editedSupplier) return null;

  const handleSave = () => {
    if (editedSupplier) {
      onSave(editedSupplier);
      toast({
        title: "Proveedor actualizado",
        description: `El proveedor ${editedSupplier.name} ha sido actualizado exitosamente.`,
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Proveedor</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre del Proveedor</Label>
            <Input
              id="name"
              value={editedSupplier.name}
              onChange={(e) => setEditedSupplier({...editedSupplier, name: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="ruc">RUC</Label>
            <Input
              id="ruc"
              value={editedSupplier.ruc}
              onChange={(e) => setEditedSupplier({...editedSupplier, ruc: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="contact">Persona de Contacto</Label>
            <Input
              id="contact"
              value={editedSupplier.contact}
              onChange={(e) => setEditedSupplier({...editedSupplier, contact: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={editedSupplier.address}
              onChange={(e) => setEditedSupplier({...editedSupplier, address: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={editedSupplier.phone}
                onChange={(e) => setEditedSupplier({...editedSupplier, phone: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editedSupplier.email}
                onChange={(e) => setEditedSupplier({...editedSupplier, email: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="products">Productos que Suministra</Label>
            <Textarea
              id="products"
              value={editedSupplier.products}
              onChange={(e) => setEditedSupplier({...editedSupplier, products: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="paymentTerms">Condiciones de Pago</Label>
            <Input
              id="paymentTerms"
              value={editedSupplier.paymentTerms || ""}
              onChange={(e) => setEditedSupplier({...editedSupplier, paymentTerms: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="deliveryTime">Tiempo de Entrega</Label>
            <Input
              id="deliveryTime"
              value={editedSupplier.deliveryTime || ""}
              onChange={(e) => setEditedSupplier({...editedSupplier, deliveryTime: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={editedSupplier.notes || ""}
              onChange={(e) => setEditedSupplier({...editedSupplier, notes: e.target.value})}
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