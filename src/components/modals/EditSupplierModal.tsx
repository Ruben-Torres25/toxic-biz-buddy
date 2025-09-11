import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Truck, Building2, User, MapPin, Phone, Mail, Package, CreditCard, Clock, StickyNote } from "lucide-react";

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
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            Editar Proveedor
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Información Principal */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                Nombre del Proveedor
              </Label>
              <Input
                id="name"
                value={editedSupplier.name}
                onChange={(e) => setEditedSupplier({...editedSupplier, name: e.target.value})}
                className="bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ruc" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  RUC
                </Label>
                <Input
                  id="ruc"
                  value={editedSupplier.ruc}
                  onChange={(e) => setEditedSupplier({...editedSupplier, ruc: e.target.value})}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Persona de Contacto
                </Label>
                <Input
                  id="contact"
                  value={editedSupplier.contact}
                  onChange={(e) => setEditedSupplier({...editedSupplier, contact: e.target.value})}
                  className="bg-background"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Información de Contacto */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Dirección
              </Label>
              <Input
                id="address"
                value={editedSupplier.address}
                onChange={(e) => setEditedSupplier({...editedSupplier, address: e.target.value})}
                className="bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  value={editedSupplier.phone}
                  onChange={(e) => setEditedSupplier({...editedSupplier, phone: e.target.value})}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={editedSupplier.email}
                  onChange={(e) => setEditedSupplier({...editedSupplier, email: e.target.value})}
                  className="bg-background"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Productos */}
          <div className="space-y-2">
            <Label htmlFor="products" className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              Productos que Suministra
            </Label>
            <Textarea
              id="products"
              value={editedSupplier.products}
              onChange={(e) => setEditedSupplier({...editedSupplier, products: e.target.value})}
              className="bg-background min-h-[80px]"
            />
          </div>

          <Separator />

          {/* Información Adicional */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentTerms" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  Condiciones de Pago
                </Label>
                <Input
                  id="paymentTerms"
                  value={editedSupplier.paymentTerms || ""}
                  onChange={(e) => setEditedSupplier({...editedSupplier, paymentTerms: e.target.value})}
                  className="bg-background"
                  placeholder="Opcional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryTime" className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Tiempo de Entrega
                </Label>
                <Input
                  id="deliveryTime"
                  value={editedSupplier.deliveryTime || ""}
                  onChange={(e) => setEditedSupplier({...editedSupplier, deliveryTime: e.target.value})}
                  className="bg-background"
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-muted-foreground" />
                Notas
              </Label>
              <Textarea
                id="notes"
                value={editedSupplier.notes || ""}
                onChange={(e) => setEditedSupplier({...editedSupplier, notes: e.target.value})}
                className="bg-background min-h-[60px]"
                placeholder="Opcional"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
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