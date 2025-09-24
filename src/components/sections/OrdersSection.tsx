// src/components/sections/OrdersSection.tsx
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
import { OrderDTO as Order } from "@/types/domain";

export const OrdersSection = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<any>({});

  // Fetch orders ordenados por código desc (PEDxxx)
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['orders', 'code_desc'],
    queryFn: () => OrdersAPI.list(['customer','items'], 'code_desc'),
    retry: 1,
  });

  // Mutations
  const confirmOrderMutation = useMutation({
    mutationFn: (id: string) => OrdersAPI.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: "Pedido confirmado", description: "El pedido ha sido confirmado exitosamente." });
    },
    onError: (error: any) => {
      toast({ title: "Error al confirmar", description: error.message || "No se pudo confirmar el pedido.", variant: "destructive" });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (id: string) => OrdersAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: "Pedido cancelado", description: "El pedido ha sido cancelado exitosamente." });
    },
    onError: (error: any) => {
      toast({ title: "Error al cancelar", description: error.message || "No se pudo cancelar el pedido.", variant: "destructive" });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (id: string) => OrdersAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: "Pedido eliminado", description: "El pedido ha sido eliminado exitosamente." });
    },
    onError: (error: any) => {
      toast({ title: "Error al eliminar", description: error.message || "No se pudo eliminar el pedido.", variant: "destructive" });
    },
  });

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
      case "canceled":
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
      toast({ title: "Pedido actualizado", description: "Los cambios han sido guardados exitosamente." });
    } catch (error: any) {
      toast({ title: "Error al actualizar", description: error.message || "No se pudo actualizar el pedido.", variant: "destructive" });
    }
  };

  const handleApplyFilters = (appliedFilters: any) => {
    setFilters(appliedFilters);
  };

  // ====== Filtros en memoria ======
  let filteredOrders: Order[] = orders;

  // Búsqueda: por código (PEDxxx), cliente o id
  if (searchTerm) {
    const q = searchTerm.toLowerCase().trim();
    filteredOrders = filteredOrders.filter((order: any) => {
      const code = (order.code ?? '').toLowerCase();
      const id = (order.id ?? '').toLowerCase();
      const client = (order.client ?? order.customer?.name ?? '').toLowerCase();
      return code.includes(q) || client.includes(q) || id.includes(q);
    });
  }

  // Filtros avanzados (si usás el modal)
  if (Object.keys(filters).length > 0) {
    filteredOrders = filteredOrders.filter((order: any) => {
      const clientName = order.client || order.customer?.name || '';

      if (filters.client && !clientName.toLowerCase().includes(filters.client.toLowerCase())) return false;
      if (filters.status && filters.status !== "all" && order.status !== filters.status) return false;

      const orderDate = order.date || order.createdAt;
      if (filters.dateFrom && orderDate && new Date(orderDate) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && orderDate && new Date(orderDate) > new Date(filters.dateTo)) return false;

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
        <Button onClick={() => navigate("/new-order")} className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary">
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
                placeholder="Buscar por código, cliente o número de pedido…"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="sm:w-auto" onClick={() => setIsFilterModalOpen(true)}>
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
                    <td className="py-3 px-4 font-medium text-primary">
                      {/* 👇 Mostramos el código PEDxxx; caemos a id si todavía no tiene */}
                      {order.code ?? order.id}
                    </td>
                    <td className="py-3 px-4 text-foreground">{order.client || order.customer?.name || 'Sin cliente'}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {order.date || (order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '')}
                    </td>
                    <td className="py-3 px-4 text-foreground">{order.items?.length || 0} items</td>
                    <td className="py-3 px-4 font-semibold text-foreground">${(order.total || 0).toFixed(2)}</td>
                    <td className="py-3 px-4">{getStatusBadge(order.status)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleView(order)} title="Ver pedido">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleEdit(order)} title="Editar pedido">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {(order.status === 'pending' || order.status === 'pendiente') && (
                          <>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 hover:bg-success/10" onClick={() => handleConfirm(order.id)} title="Confirmar pedido">
                              <CheckCircle className="w-4 h-4 text-success" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 hover:bg-destructive/10" onClick={() => handleCancel(order.id)} title="Cancelar pedido">
                              <XCircle className="w-4 h-4 text-destructive" />
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(order.id)} title="Eliminar pedido">
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
      <ViewOrderModal open={isViewModalOpen} onOpenChange={setIsViewModalOpen} order={selectedOrder} />
      <EditOrderModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} order={selectedOrder} onSave={handleSaveOrder} />
      <FilterOrdersModal open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen} onApplyFilters={handleApplyFilters} />
    </div>
  );
};
