import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
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

interface ViewSupplierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
}

export function ViewSupplierModal({ open, onOpenChange, supplier }: ViewSupplierModalProps) {
  if (!supplier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            Detalles del Proveedor
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Información Principal */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Nombre</p>
                  <p className="font-semibold">{supplier.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">RUC</p>
                  <p className="font-semibold">{supplier.ruc}</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Persona de Contacto</p>
                <p className="font-semibold">{supplier.contact}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Información de Contacto */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Dirección</p>
                <p className="font-semibold">{supplier.address}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Teléfono</p>
                  <p className="font-semibold">{supplier.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="font-semibold">{supplier.email}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Información de Productos */}
          <div className="flex items-start gap-3">
            <Package className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Productos que Suministra</p>
              <p className="font-semibold">{supplier.products}</p>
            </div>
          </div>

          {/* Información Adicional (Opcional) */}
          {(supplier.paymentTerms || supplier.deliveryTime || supplier.notes) && (
            <>
              <Separator />
              <div className="space-y-4">
                {supplier.paymentTerms && (
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Condiciones de Pago</p>
                      <p className="font-semibold">{supplier.paymentTerms}</p>
                    </div>
                  </div>
                )}

                {supplier.deliveryTime && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Tiempo de Entrega</p>
                      <p className="font-semibold">{supplier.deliveryTime}</p>
                    </div>
                  </div>
                )}

                {supplier.notes && (
                  <div className="flex items-start gap-3">
                    <StickyNote className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Notas</p>
                      <p className="font-semibold">{supplier.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}