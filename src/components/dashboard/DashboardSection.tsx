import { useState } from "react";
import { StatsCard } from "./StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart, 
  Users, 
  Package, 
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle
} from "lucide-react";
import { ViewOrderModal } from "@/components/modals/ViewOrderModal";
import { EditOrderModal } from "@/components/modals/EditOrderModal";
import { toast } from "@/hooks/use-toast";

export const DashboardSection = () => {
  const [isViewOrderOpen, setIsViewOrderOpen] = useState(false);
  const [isEditOrderOpen, setIsEditOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // Mock data for demonstration
  const stats = [
    {
      title: "Ventas del Día",
      value: "$12,450",
      icon: DollarSign,
      trend: { value: 8.2, isPositive: true },
      variant: "success" as const
    },
    {
      title: "Pedidos Activos",
      value: 23,
      icon: ShoppingCart,
      trend: { value: 12, isPositive: true }
    },
    {
      title: "Clientes Totales",
      value: 142,
      icon: Users,
      trend: { value: 5.1, isPositive: true }
    },
    {
      title: "Stock Bajo",
      value: 7,
      icon: AlertTriangle,
      variant: "warning" as const
    }
  ];

  const recentOrders = [
    { 
      id: "001", 
      client: "María García", 
      total: 450, 
      status: "Completado", 
      time: "10:30 AM",
      date: "2024-01-08",
      paymentMethod: "Efectivo",
      address: "Calle Mayor 123, Madrid",
      items: [
        { product: "Detergente Líquido", quantity: 5, price: 45, discount: 5, total: 220 },
        { product: "Desinfectante Multiuso", quantity: 3, price: 80, discount: 10, total: 230 }
      ]
    },
    { 
      id: "002", 
      client: "Carlos López", 
      total: 230, 
      status: "Pendiente", 
      time: "11:15 AM",
      date: "2024-01-08",
      paymentMethod: "Transferencia",
      address: "Avenida España 45, Barcelona",
      items: [
        { product: "Jabón en Polvo", quantity: 2, price: 65, discount: 0, total: 130 },
        { product: "Limpiador de Vidrios", quantity: 4, price: 25, discount: 0, total: 100 }
      ]
    },
    { 
      id: "003", 
      client: "Ana Rodríguez", 
      total: 680, 
      status: "Pendiente", 
      time: "12:00 PM",
      date: "2024-01-08",
      paymentMethod: "Tarjeta",
      address: "Plaza Central 8, Valencia",
      items: [
        { product: "Detergente Industrial", quantity: 10, price: 68, discount: 0, total: 680 }
      ]
    },
    { 
      id: "004", 
      client: "Luis Martín", 
      total: 320, 
      status: "Completado", 
      time: "12:45 PM",
      date: "2024-01-08",
      paymentMethod: "Efectivo",
      address: "Calle Sol 67, Sevilla",
      items: [
        { product: "Cloro Industrial", quantity: 8, price: 40, discount: 0, total: 320 }
      ]
    },
  ];

  const lowStockProducts = [
    { name: "Detergente Líquido", stock: 3, min: 10 },
    { name: "Desinfectante Multiuso", stock: 1, min: 5 },
    { name: "Jabón en Polvo", stock: 2, min: 8 },
    { name: "Limpiador de Vidrios", stock: 4, min: 12 },
  ];

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setIsViewOrderOpen(true);
  };

  const handleEditOrder = () => {
    setIsViewOrderOpen(false);
    setIsEditOrderOpen(true);
  };

  const handleSaveOrder = (updatedOrder: any) => {
    toast({
      title: "Pedido actualizado",
      description: `El pedido #${updatedOrder.id} ha sido actualizado exitosamente.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Resumen general del negocio</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Nuevo Pedido
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            variant={stat.variant}
          />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Pedidos Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => handleViewOrder(order)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      order.status === "Completado" ? "bg-success" : "bg-warning"
                    }`} />
                    <div>
                      <p className="font-medium text-foreground">{order.client}</p>
                      <p className="text-sm text-muted-foreground">#{order.id} - {order.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">${order.total}</p>
                    <p className={`text-xs ${
                      order.status === "Completado" ? "text-success" : "text-warning"
                    }`}>
                      {order.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <div>
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="text-sm text-muted-foreground">Mínimo: {product.min} unidades</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-warning">{product.stock}</p>
                    <p className="text-xs text-muted-foreground">disponibles</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <ViewOrderModal 
        open={isViewOrderOpen}
        onOpenChange={setIsViewOrderOpen}
        order={selectedOrder}
        onEdit={handleEditOrder}
      />
      
      <EditOrderModal
        open={isEditOrderOpen}
        onOpenChange={setIsEditOrderOpen}
        order={selectedOrder}
        onSave={handleSaveOrder}
      />
    </div>
  );
};