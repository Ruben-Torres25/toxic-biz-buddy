import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface NewSupplierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewSupplierModal({ open, onOpenChange }: NewSupplierModalProps) {
  const { toast } = useToast();

  const handleSubmit = () => {
    toast({
      title: "Proveedor Registrado",
      description: "El proveedor ha sido agregado exitosamente.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Proveedor</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="supplier-name">Nombre de la Empresa</Label>
            <Input id="supplier-name" placeholder="Química Industrial S.A." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ruc">RUC</Label>
              <Input id="ruc" placeholder="80012345-6" />
            </div>
            <div>
              <Label htmlFor="contact">Persona de Contacto</Label>
              <Input id="contact" placeholder="Juan Pérez" />
            </div>
          </div>

          <div>
            <Label htmlFor="supplier-address">Dirección</Label>
            <Input id="supplier-address" placeholder="Av. Industrial 456, Ciudad" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier-phone">Teléfono</Label>
              <Input id="supplier-phone" placeholder="021 123 456" />
            </div>
            <div>
              <Label htmlFor="supplier-email">Email</Label>
              <Input id="supplier-email" type="email" placeholder="ventas@proveedor.com" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment-terms">Términos de Pago</Label>
              <Input id="payment-terms" placeholder="30 días" />
            </div>
            <div>
              <Label htmlFor="delivery-time">Tiempo de Entrega</Label>
              <Input id="delivery-time" placeholder="3-5 días" />
            </div>
          </div>

          <div>
            <Label htmlFor="products-supplied">Productos que Suministra</Label>
            <Textarea id="products-supplied" placeholder="Detergentes, Desinfectantes, Jabones..." />
          </div>

          <div>
            <Label htmlFor="supplier-notes">Notas (Opcional)</Label>
            <Textarea id="supplier-notes" placeholder="Información adicional del proveedor..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Registrar Proveedor</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
