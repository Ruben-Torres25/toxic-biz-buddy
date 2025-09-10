import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  balance: number;
  orders: number;
  lastOrder: string;
  taxId?: string;
}

interface EditClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onSave: (client: Client) => void;
}

export function EditClientModal({ open, onOpenChange, client, onSave }: EditClientModalProps) {
  const [editedClient, setEditedClient] = useState<Client | null>(client);

  if (!client) return null;

  const handleSave = () => {
    if (editedClient) {
      onSave(editedClient);
      toast({
        title: "Cliente actualizado",
        description: `La información de ${editedClient.name} ha sido actualizada exitosamente.`,
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Cliente {client.id}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={editedClient?.name || ""}
              onChange={(e) => setEditedClient(prev => prev ? {...prev, name: e.target.value} : null)}
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={editedClient?.email || ""}
              onChange={(e) => setEditedClient(prev => prev ? {...prev, email: e.target.value} : null)}
            />
          </div>

          <div>
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              value={editedClient?.phone || ""}
              onChange={(e) => setEditedClient(prev => prev ? {...prev, phone: e.target.value} : null)}
            />
          </div>

          <div>
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={editedClient?.address || ""}
              onChange={(e) => setEditedClient(prev => prev ? {...prev, address: e.target.value} : null)}
            />
          </div>

          <div>
            <Label htmlFor="postalCode">Código Postal</Label>
            <Input
              id="postalCode"
              value={editedClient?.postalCode || ""}
              onChange={(e) => setEditedClient(prev => prev ? {...prev, postalCode: e.target.value} : null)}
            />
          </div>

          <div>
            <Label htmlFor="taxId">NIF/CIF</Label>
            <Input
              id="taxId"
              value={editedClient?.taxId || ""}
              onChange={(e) => setEditedClient(prev => prev ? {...prev, taxId: e.target.value} : null)}
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