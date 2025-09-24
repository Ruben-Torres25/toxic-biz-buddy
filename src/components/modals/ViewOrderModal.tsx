import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, XCircle, Package, CreditCard, MapPin, User, Hash, Percent, Edit } from "lucide-react";

interface OrderItem {
  productCode?: string;
  product: string;
  quantity: number;
  unitPrice: number;
  price?: number;
  discount?: number;
  total?: number;
}

interface Order {
  id: string;
  client: string;
  date: string;
  total: number;
  status: string;
  items: OrderItem[];
  address?: string;
  payment?: string;
}

interface ViewOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onEdit?: () => void;
}

export function ViewOrderModal({ open, onOpenChange, order, onEdit }: ViewOrderModalProps) {
  if (!order) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completado":
        return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle className="w-3 h-3 mr-1" />Completado</Badge>;
      case "pendiente":
        return <Badge className="bg-warning/10 text-warning border-warning/20"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case "cancelado":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Detalles del Pedido {order.id}</DialogTitle>
            {onEdit && (
              <Button
                onClick={onEdit}
                size="sm"
                className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Pedido
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Pedido #</p>
              <p className="text-lg font-semibold">{order.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha</p>
              <p className="text-lg font-semibold">{order.date}</p>
            </div>
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Cliente</p>
                <p className="text-lg font-semibold">{order.client}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estado</p>
              <div className="mt-1">{getStatusBadge(order.status?.toLowerCase?.() ?? String(order.status))}</div>
            </div>
          </div>

          <Separator />

          {/* Additional Info */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Dirección de Entrega</p>
                <p className="text-sm text-muted-foreground">{order.address || "Av. Principal 123, Ciudad"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CreditCard className="w-4 h-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Método de Pago</p>
                <p className="text-sm text-muted-foreground">{order.payment || "Efectivo"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4" />
              <h3 className="font-semibold">Detalle de Productos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-accent/50">
                    <th className="text-left py-2 px-3 text-sm font-semibold">Código</th>
                    <th className="text-left py-2 px-3 text-sm font-semibold">Producto</th>
                    <th className="text-center py-2 px-3 text-sm font-semibold">Cantidad</th>
                    <th className="text-right py-2 px-3 text-sm font-semibold">Precio Unit.</th>
                    <th className="text-center py-2 px-3 text-sm font-semibold">Descuento</th>
                    <th className="text-right py-2 px-3 text-sm font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={index} className="border-b border-border hover:bg-accent/20 transition-colors">
                      <td className="py-2 px-3 text-sm font-medium text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {item.productCode || `PRD00${index + 1}`}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-sm font-medium">{item.product}</td>
                      <td className="py-2 px-3 text-sm text-center">{item.quantity}</td>
                      <td className="py-2 px-3 text-sm text-right">${(item.unitPrice ?? item.price ?? 0).toFixed(2)}</td>
                      <td className="py-2 px-3 text-sm text-center">
                        {item.discount ? (
                          <Badge variant="outline" className="text-xs">
                            <Percent className="w-3 h-3 mr-1" />
                            {item.discount}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-sm text-right font-semibold">${(item.total ?? ((item.unitPrice ?? item.price ?? 0) * (item.quantity ?? 0))).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border">
                    <td colSpan={5} className="py-3 px-3 text-right font-semibold">Subtotal:</td>
                    <td className="py-3 px-3 text-right font-semibold">${order.total.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan={5} className="py-1 px-3 text-right text-sm text-muted-foreground">IVA (21%):</td>
                    <td className="py-1 px-3 text-right text-sm">${(order.total * 0.21).toFixed(2)}</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td colSpan={5} className="py-3 px-3 text-right font-bold">Total:</td>
                    <td className="py-3 px-3 text-right font-bold text-lg text-primary">${(order.total * 1.21).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
