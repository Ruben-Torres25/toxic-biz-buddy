import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Mail, Phone, DollarSign, Package, Calendar, Hash } from "lucide-react";

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
  registrationDate?: string;
  taxId?: string;
}

interface ViewClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export function ViewClientModal({ open, onOpenChange, client }: ViewClientModalProps) {
  if (!client) return null;

  const getBalanceBadge = (balance: number) => {
    if (balance > 0) {
      return <Badge className="bg-success/10 text-success border-success/20">+€{balance.toFixed(2)}</Badge>;
    } else if (balance < 0) {
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">€{balance.toFixed(2)}</Badge>;
    } else {
      return <Badge className="bg-muted/10 text-muted-foreground border-muted/20">€0.00</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Información del Cliente</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Código Cliente</p>
              <p className="text-lg font-semibold">{client.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="text-lg font-semibold">{client.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">NIF/CIF</p>
              <p className="text-lg font-semibold">{client.taxId || "No registrado"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha de Registro</p>
              <p className="text-lg font-semibold">{client.registrationDate || "2024-01-01"}</p>
            </div>
          </div>

          <Separator />

          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Información de Contacto</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{client.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Teléfono</p>
                  <p className="text-sm text-muted-foreground">{client.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Dirección</p>
                  <p className="text-sm text-muted-foreground">{client.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Hash className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Código Postal</p>
                  <p className="text-sm text-muted-foreground">{client.postalCode}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Account Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Información de Cuenta</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <DollarSign className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Saldo Actual</p>
                  <div className="mt-1">{getBalanceBadge(client.balance)}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total de Pedidos</p>
                  <p className="text-lg font-semibold text-primary">{client.orders}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Último Pedido</p>
                  <p className="text-sm text-muted-foreground">{client.lastOrder}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
