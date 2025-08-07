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

export const DashboardSection = () => {
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
    { id: "001", client: "María García", total: "$450", status: "Completado", time: "10:30 AM" },
    { id: "002", client: "Carlos López", total: "$230", status: "Pendiente", time: "11:15 AM" },
    { id: "003", client: "Ana Rodríguez", total: "$680", status: "Pendiente", time: "12:00 PM" },
    { id: "004", client: "Luis Martín", total: "$320", status: "Completado", time: "12:45 PM" },
  ];

  const lowStockProducts = [
    { name: "Detergente Líquido", stock: 3, min: 10 },
    { name: "Desinfectante Multiuso", stock: 1, min: 5 },
    { name: "Jabón en Polvo", stock: 2, min: 8 },
    { name: "Limpiador de Vidrios", stock: 4, min: 12 },
  ];

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
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
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
                    <p className="font-semibold text-foreground">{order.total}</p>
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
    </div>
  );
};