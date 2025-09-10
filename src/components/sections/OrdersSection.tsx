import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { ViewOrderModal } from "@/components/modals/ViewOrderModal";
import { EditOrderModal } from "@/components/modals/EditOrderModal";
import { FilterOrdersModal } from "@/components/modals/FilterOrdersModal";
import { toast } from "@/hooks/use-toast";

export const OrdersSection = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({});
  
  const [orders, setOrders] = useState([
    {
      id: "PED001",
      client: "María García",
      date: "2024-01-08",
      total: 450.00,
      status: "completado",
      items: [
        { product: "Producto A", quantity: 2, unitPrice: 150.00, total: 300.00 },
        { product: "Producto B", quantity: 1, unitPrice: 150.00, total: 150.00 }
      ],
      address: "Calle Principal 123, Ciudad",
      payment: "Tarjeta de crédito"
    },
    {
      id: "PED002", 
      client: "Carlos López",
      date: "2024-01-08",
      total: 230.50,
      status: "pendiente",
      items: [
        { product: "Producto C", quantity: 1, unitPrice: 100.50, total: 100.50 },
        { product: "Producto D", quantity: 2, unitPrice: 65.00, total: 130.00 }
      ],
      address: "Av. Secundaria 456, Ciudad",
      payment: "Efectivo"
    },
    {
      id: "PED003",
      client: "Ana Rodríguez", 
      date: "2024-01-07",
      total: 680.00,
      status: "pendiente",
      items: [
        { product: "Producto E", quantity: 5, unitPrice: 136.00, total: 680.00 }
      ],
      address: "Plaza Central 789, Ciudad",
      payment: "Transferencia"
    },
    {
      id: "PED004",
      client: "Luis Martín",
      date: "2024-01-07", 
      total: 320.75,
      status: "cancelado",
      items: [
        { product: "Producto F", quantity: 2, unitPrice: 160.375, total: 320.75 }
      ],
      address: "Barrio Norte 321, Ciudad",
      payment: "Efectivo"
    }
  ]);

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

  const handleView = (order: any) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const handleEdit = (order: any) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  const handleDelete = (orderId: string) => {
    toast({
      title: "Pedido eliminado",
      description: `El pedido ${orderId} ha sido eliminado exitosamente.`,
    });
    setOrders(orders.filter(order => order.id !== orderId));
  };

  const handleSaveOrder = (updatedOrder: any) => {
    setOrders(orders.map(order => 
      order.id === updatedOrder.id ? updatedOrder : order
    ));
  };

  const handleApplyFilters = (appliedFilters: any) => {
    setFilters(appliedFilters);
    let filtered = [...orders];

    if (appliedFilters.client) {
      filtered = filtered.filter(order => 
        order.client.toLowerCase().includes(appliedFilters.client.toLowerCase())
      );
    }

    if (appliedFilters.status && appliedFilters.status !== "all") {
      filtered = filtered.filter(order => order.status === appliedFilters.status);
    }

    if (appliedFilters.city) {
      // Filter by city if address contains city
      filtered = filtered.filter(order => 
        order.address?.toLowerCase().includes(appliedFilters.city.toLowerCase())
      );
    }

    if (appliedFilters.dateFrom) {
      filtered = filtered.filter(order => 
        new Date(order.date) >= appliedFilters.dateFrom
      );
    }

    if (appliedFilters.dateTo) {
      filtered = filtered.filter(order => 
        new Date(order.date) <= appliedFilters.dateTo
      );
    }

    setFilteredOrders(filtered);
  };

  const displayOrders = searchTerm 
    ? orders.filter(order => 
        order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : (filteredOrders.length > 0 || Object.keys(filters).length > 0 ? filteredOrders : orders);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Pedidos</h1>
          <p className="text-muted-foreground">Administra todos los pedidos de tus clientes</p>
        </div>
        <Button 
          onClick={() => navigate("/new-order")}
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              className="sm:w-auto"
              onClick={() => setIsFilterModalOpen(true)}
            >
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
                {displayOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-primary">{order.id}</td>
                    <td className="py-3 px-4 text-foreground">{order.client}</td>
                    <td className="py-3 px-4 text-muted-foreground">{order.date}</td>
                    <td className="py-3 px-4 text-foreground">{order.items.length} items</td>
                    <td className="py-3 px-4 font-semibold text-foreground">${order.total.toFixed(2)}</td>
                    <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleView(order)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(order)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(order.id)}
                        >
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

      {/* Modals */}
      <ViewOrderModal 
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        order={selectedOrder}
      />
      <EditOrderModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        order={selectedOrder}
        onSave={handleSaveOrder}
      />
      <FilterOrdersModal
        open={isFilterModalOpen}
        onOpenChange={setIsFilterModalOpen}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
};