import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface NewClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewClientModal({ open, onOpenChange }: NewClientModalProps) {
  const { toast } = useToast();

  const handleSubmit = () => {
    toast({
      title: "Cliente Registrado",
      description: "El cliente ha sido agregado exitosamente.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Cliente</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre Completo</Label>
              <Input id="name" placeholder="Juan Pérez" />
            </div>
            <div>
              <Label htmlFor="document">Documento/RUC</Label>
              <Input id="document" placeholder="12345678" />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Dirección</Label>
            <Input id="address" placeholder="Av. Principal 123, Ciudad" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" placeholder="0981 123 456" />
            </div>
            <div>
              <Label htmlFor="email">Email (Opcional)</Label>
              <Input id="email" type="email" placeholder="cliente@email.com" />
            </div>
          </div>

          <div>
            <Label htmlFor="credit">Límite de Crédito</Label>
            <Input id="credit" type="number" placeholder="500000" />
          </div>

          <div>
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Input id="notes" placeholder="Información adicional del cliente" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Registrar Cliente</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}