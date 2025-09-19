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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OrdersAPI } from "@/services/orders.api";
import { Order } from "@/types/domain";

export const OrdersSection = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<any>({});
  
  // Datos mock como fallback
  const mockOrders = [
    {
      id: "PED001",
      client: "María García",
      date: "2024-01-08",
      total: 450.00,
      status: "completado",
      items: [
        { productCode: "PRD001", product: "Producto A", quantity: 2, unitPrice: 150.00, discount: 0, total: 300.00 },
        { productCode: "PRD002", product: "Producto B", quantity: 1, unitPrice: 150.00, discount: 0, total: 150.00 }
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
        { productCode: "PRD003", product: "Producto C", quantity: 1, unitPrice: 100.50, discount: 0, total: 100.50 },
        { productCode: "PRD004", product: "Producto D", quantity: 2, unitPrice: 65.00, discount: 0, total: 130.00 }
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
        { productCode: "PRD005", product: "Producto E", quantity: 5, unitPrice: 136.00, discount: 10, total: 680.00 }
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
        { productCode: "PRD006", product: "Producto F", quantity: 2, unitPrice: 160.375, discount: 5, total: 320.75 }
      ],
      address: "Barrio Norte 321, Ciudad",
      payment: "Efectivo"
    }
  ];

  // Fetch orders con React Query
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: OrdersAPI.list,
    retry: 1,
  });

  // Mutation para confirmar pedido
  const confirmOrderMutation = useMutation({
    mutationFn: (id: string) => OrdersAPI.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "Pedido confirmado",
        description: "El pedido ha sido confirmado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al confirmar",
        description: error.message || "No se pudo confirmar el pedido.",
        variant: "destructive",
      });
    },
  });

  // Mutation para cancelar pedido
  const cancelOrderMutation = useMutation({
    mutationFn: (id: string) => OrdersAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "Pedido cancelado",
        description: "El pedido ha sido cancelado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al cancelar",
        description: error.message || "No se pudo cancelar el pedido.",
        variant: "destructive",
      });
    },
  });

  // Mutation para eliminar pedido
  const deleteOrderMutation = useMutation({
    mutationFn: (id: string) => OrdersAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "Pedido eliminado",
        description: "El pedido ha sido eliminado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar el pedido.",
        variant: "destructive",
      });
    },
  });

  // Usar orders del API o mockOrders si hay error
  const displayData: any[] = error ? mockOrders : orders;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completado":
      case "confirmed":
      case "delivered":
        return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle className="w-3 h-3 mr-1" />Completado</Badge>;
      case "pendiente":
      case "pending":
        return <Badge className="bg-warning/10 text-warning border-warning/20"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case "cancelado":
      case "cancelled":
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
    deleteOrderMutation.mutate(orderId);
  };

  const handleConfirm = (orderId: string) => {
    confirmOrderMutation.mutate(orderId);
  };

  const handleCancel = (orderId: string) => {
    cancelOrderMutation.mutate(orderId);
  };

  const handleSaveOrder = async (updatedOrder: any) => {
    try {
      await OrdersAPI.update(updatedOrder.id, updatedOrder);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "Pedido actualizado",
        description: "Los cambios han sido guardados exitosamente.",
      });
    } catch (error: any) {
      toast({
        title: "Error al actualizar",
        description: error.message || "No se pudo actualizar el pedido.",
        variant: "destructive",
      });
    }
  };

  const handleApplyFilters = (appliedFilters: any) => {
    setFilters(appliedFilters);
  };

  // Aplicar filtros
  let filteredOrders: any[] = displayData;
  
  // Filtro de búsqueda
  if (searchTerm) {
    filteredOrders = filteredOrders.filter((order: any) => 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.client && order.client.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.customer?.name && order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  // Aplicar filtros adicionales
  if (Object.keys(filters).length > 0) {
    filteredOrders = filteredOrders.filter((order: any) => {
      const clientName = order.client || order.customer?.name || '';
      
      if (filters.client && !clientName.toLowerCase().includes(filters.client.toLowerCase())) {
        return false;
      }
      
      if (filters.status && filters.status !== "all" && order.status !== filters.status) {
        return false;
      }
      
      if (filters.city) {
        const address = order.address || '';
        if (!address.toLowerCase().includes(filters.city.toLowerCase())) {
          return false;
        }
      }
      
      const orderDate = order.date || order.createdAt;
      if (filters.dateFrom && orderDate) {
        if (new Date(orderDate) < new Date(filters.dateFrom)) {
          return false;
        }
      }
      
      if (filters.dateTo && orderDate) {
        if (new Date(orderDate) > new Date(filters.dateTo)) {
          return false;
        }
      }
      
      return true;
    });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-muted-foreground">Cargando pedidos...</div>
      </div>
    );
  }

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
                {filteredOrders.map((order: any) => (
                  <tr key={order.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-primary">{order.id}</td>
                    <td className="py-3 px-4 text-foreground">{order.client || order.customer?.name || 'Sin cliente'}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {order.date || (order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '')}
                    </td>
                    <td className="py-3 px-4 text-foreground">{order.items?.length || 0} items</td>
                    <td className="py-3 px-4 font-semibold text-foreground">${(order.total || 0).toFixed(2)}</td>
                    <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleView(order)}
                          title="Ver pedido"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(order)}
                          title="Editar pedido"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {(order.status === 'pending' || order.status === 'pendiente') && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 w-8 p-0 hover:bg-success/10"
                              onClick={() => handleConfirm(order.id)}
                              title="Confirmar pedido"
                            >
                              <CheckCircle className="w-4 h-4 text-success" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 w-8 p-0 hover:bg-destructive/10"
                              onClick={() => handleCancel(order.id)}
                              title="Cancelar pedido"
                            >
                              <XCircle className="w-4 h-4 text-destructive" />
                            </Button>
                          </>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDelete(order.id)}
                          title="Eliminar pedido"
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