import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Truck } from "lucide-react";

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
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Detalles del Proveedor
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="font-semibold">{supplier.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">RUC</p>
              <p className="font-semibold">{supplier.ruc}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Persona de Contacto</p>
            <p className="font-semibold">{supplier.contact}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Dirección</p>
            <p className="font-semibold">{supplier.address}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Teléfono</p>
              <p className="font-semibold">{supplier.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold">{supplier.email}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Productos que Suministra</p>
            <p className="font-semibold">{supplier.products}</p>
          </div>

          {supplier.paymentTerms && (
            <div>
              <p className="text-sm text-muted-foreground">Condiciones de Pago</p>
              <p className="font-semibold">{supplier.paymentTerms}</p>
            </div>
          )}

          {supplier.deliveryTime && (
            <div>
              <p className="text-sm text-muted-foreground">Tiempo de Entrega</p>
              <p className="font-semibold">{supplier.deliveryTime}</p>
            </div>
          )}

          {supplier.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Notas</p>
              <p className="font-semibold">{supplier.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}