import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import { NewOrderModal } from "@/components/modals/NewOrderModal";

export const OrdersSection = () => {
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const orders = [
    {
      id: "PED001",
      client: "María García",
      date: "2024-01-08",
      total: 450.00,
      status: "completado",
      items: 3
    },
    {
      id: "PED002", 
      client: "Carlos López",
      date: "2024-01-08",
      total: 230.50,
      status: "pendiente",
      items: 2
    },
    {
      id: "PED003",
      client: "Ana Rodríguez", 
      date: "2024-01-07",
      total: 680.00,
      status: "pendiente",
      items: 5
    },
    {
      id: "PED004",
      client: "Luis Martín",
      date: "2024-01-07", 
      total: 320.75,
      status: "cancelado",
      items: 2
    }
  ];

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Pedidos</h1>
          <p className="text-muted-foreground">Administra todos los pedidos de tus clientes</p>
        </div>
        <Button 
          onClick={() => setIsNewOrderOpen(true)}
          className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Pedido
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por cliente o número de pedido..." 
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="sm:w-auto">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Pedido</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Cliente</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Fecha</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Items</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Total</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Estado</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-primary">{order.id}</td>
                    <td className="py-3 px-4 text-foreground">{order.client}</td>
                    <td className="py-3 px-4 text-muted-foreground">{order.date}</td>
                    <td className="py-3 px-4 text-foreground">{order.items} items</td>
                    <td className="py-3 px-4 font-semibold text-foreground">${order.total.toFixed(2)}</td>
                    <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <NewOrderModal open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen} />
    </div>
  );
};