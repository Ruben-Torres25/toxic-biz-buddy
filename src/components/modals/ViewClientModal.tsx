import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Mail, Phone, DollarSign, Package, Calendar, Hash } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CustomersAPI } from "@/services/customers.api";

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  phone2?: string;
  address?: string;
  postalCode?: string;
  balance: number;
  orders?: number;
  lastOrder?: string;
  registrationDate?: string;
  taxId?: string;
  notes?: string;
}

interface ViewClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export function ViewClientModal({ open, onOpenChange, client }: ViewClientModalProps) {
  const statsQuery = useQuery({
    queryKey: ["customer-stats", client?.id],
    queryFn: () => CustomersAPI.getStats(client!.id),
    enabled: open && !!client?.id,
    staleTime: 15_000,
  });

  if (!client) return null;

  const getBalanceBadge = (balance: number) => {
    if (balance > 0) {
      return <Badge className="bg-success/10 text-success border-success/20">+${balance.toFixed(2)}</Badge>;
    } else if (balance < 0) {
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">${balance.toFixed(2)}</Badge>;
    } else {
      return <Badge className="bg-muted/10 text-muted-foreground border-muted/20">$0.00</Badge>;
    }
  };

  const orderCount = statsQuery.data?.orderCount ?? client.orders ?? 0;
  const lastOrder = statsQuery.data?.lastOrderDate ?? client.lastOrder ?? "-";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Información del Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Básico */}
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

          {/* Notas */}
          {client.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Notas</p>
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                  {client.notes}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Contacto */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Información de Contacto</h3>
            <div className="space-y-2">
              {client.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground break-words">{client.email}</p>
                  </div>
                </div>
              )}
              {(client.phone || client.phone2) && (
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Teléfono(s)</p>
                    <p className="text-sm text-muted-foreground break-words">
                      {[client.phone, client.phone2].filter(Boolean).join(" / ")}
                    </p>
                  </div>
                </div>
              )}
              {(client.address || client.postalCode) && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Dirección</p>
                    <p className="text-sm text-muted-foreground break-words">
                      {client.address}
                      {client.address && client.postalCode ? " - " : ""}
                      {client.postalCode}
                    </p>
                  </div>
                </div>
              )}
              {client.postalCode && (
                <div className="flex items-start gap-3">
                  <Hash className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Código Postal</p>
                    <p className="text-sm text-muted-foreground">{client.postalCode}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Cuenta */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Información de Cuenta</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <DollarSign className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Saldo Actual</p>
                  <div className="mt-1">{getBalanceBadge(Number(client.balance ?? 0))}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Total de Pedidos {statsQuery.isLoading && <span className="text-xs text-muted-foreground">(cargando…)</span>}
                  </p>
                    <p className="text-lg font-semibold text-primary">{orderCount}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Último Pedido</p>
                  <p className="text-sm text-muted-foreground">
                    {lastOrder ? new Date(lastOrder).toLocaleString() : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
