// src/components/sections/OrdersSection.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus, Search, Filter, Edit, Trash2, Eye, CheckCircle, Clock, XCircle,
} from "lucide-react";
import { ViewOrderModal } from "@/components/modals/ViewOrderModal";
import { EditOrderModal } from "@/components/modals/EditOrderModal";
import { FilterOrdersModal } from "@/components/modals/FilterOrdersModal";
import { toast } from "@/hooks/use-toast";
import { OrdersAPI } from "@/services/orders.api";
import { CashAPI } from "@/services/cash.api";
import type { OrderDTO } from "@/types/domain";

type OrderStatus = "pending" | "confirmed" | "canceled" | "partially_returned" | "returned";

// === helpers dinero/IVA ===
const IVA_RATE = 0.21;
const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const moneyFmt =
  typeof Intl !== "undefined"
    ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 })
    : { format: (n: number) => `$${Number(n ?? 0).toFixed(2)}` };
const fmtMoney = (n: any) => moneyFmt.format(Number(n ?? 0));

export function OrdersSection() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderDTO | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<any>({});

  // ---- Caja (status) ----
  const { data: cash = undefined, refetch: refetchCash } = useQuery({
    queryKey: ["cash", "current"],
    queryFn: () => CashAPI.current(),
    staleTime: 10_000,
  });
  const cashOpen = !!cash?.isOpen;

  // ---- Orders ----
  const {
    data: orders = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<OrderDTO[]>({
    queryKey: ["orders", { include: "customer,items", sort: "code_desc" }],
    queryFn: () =>
      OrdersAPI.list(["customer", "items"]).then((os) => {
        const num = (o: OrderDTO) =>
          Number(String(o.code ?? "").replace(/\D/g, "")) || 0;
        return [...os].sort((a, b) => num(b) - num(a));
      }),
    retry: 1,
  });

  // ✅ Refresco puntual del pedido (para NC, etc.)
  const softRefresh = async (orderId: string) => {
    try {
      const fresh = await OrdersAPI.getById(orderId, ["customer","items"]);
      const key = ["orders", { include: "customer,items", sort: "code_desc" }];
      queryClient.setQueryData<OrderDTO[] | undefined>(key, (old) => {
        if (!old) return old;
        return old.map(o => (o.id === fresh.id ? fresh : o));
      });
      setSelectedOrder((curr) => (curr && curr.id === fresh.id ? fresh : curr));
    } catch (e) { console.debug("softRefresh error", e); }
  };

  // ---- Mutations ----
  const confirmOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!cashOpen) {
        navigate("/caja");
        throw new Error("Caja cerrada");
      }
      return OrdersAPI.confirm(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      refetchCash();
      toast({ title: "Pedido confirmado", description: "Se confirmó el pedido." });
    },
    onError: (err: any) => {
      const msg = err?.message || "No se pudo confirmar";
      toast({ title: "No se pudo confirmar", description: msg, variant: "destructive" });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (id: string) => OrdersAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Pedido cancelado", description: "Se canceló el pedido." });
    },
    onError: (err: any) => {
      toast({
        title: "Error al cancelar",
        description: err?.message ?? "No se pudo cancelar el pedido.",
        variant: "destructive",
      });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: (id: string) => OrdersAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({ title: "Pedido eliminado", description: "Se eliminó el pedido." });
    },
    onError: (err: any) => {
      toast({
        title: "Error al eliminar",
        description: err?.message ?? "No se pudo eliminar el pedido.",
        variant: "destructive",
      });
    },
  });

  const handleView = (order: OrderDTO) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const handleEdit = (order: OrderDTO) => {
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

  // ⬇️ Actualización optimista + recálculo del total con IVA
  const handleSaveOrder = async (updated: OrderDTO) => {
    try {
      await OrdersAPI.update(updated.id, updated);

      const key = ["orders", { include: "customer,items", sort: "code_desc" }];
      queryClient.setQueryData<OrderDTO[] | undefined>(key, (old) => {
        if (!old) return old;

        const newItems = Array.isArray((updated as any).items)
          ? (updated as any).items
          : undefined;

        // total con IVA a partir de items (fallback al total que trae el backend)
        const recomputedTotal = newItems
          ? newItems.reduce((acc: number, it: any) => {
              const price = Number(it?.unitPrice ?? 0);
              const qty = Number(it?.quantity ?? 0);
              const disc = Number(it?.discount ?? 0);
              const net = r2(price * qty - disc);           // s/IVA
              const iva = r2(Math.max(0, net * IVA_RATE));  // 21%
              const gross = r2(net + iva);                  // c/IVA
              return acc + gross;
            }, 0)
          : Number((updated as any)?.total ?? 0);

        return old.map((o) =>
          o.id === updated.id
            ? {
                ...o,
                items: newItems ?? o.items,
                total: recomputedTotal, // dejamos total con IVA
                ...(updated as any).notes ? { notes: (updated as any).notes } : {},
              }
            : o
        );
      });

      queryClient.invalidateQueries({ queryKey: ["orders"] });

      toast({ title: "Pedido actualizado", description: "Cambios guardados." });
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast({
        title: "Error al actualizar",
        description: err?.message ?? "No se pudo actualizar el pedido.",
        variant: "destructive",
      });
    }
  };

  const handleApplyFilters = (applied: any) => {
    setFilters(applied);
  };

  // ---- UI helpers ----
  const normalizeStatus = (s?: string): OrderStatus | undefined => {
    if (!s) return undefined;
    const map: Record<string, OrderStatus> = {
      pendiente: "pending",
      confirmado: "confirmed",
      completado: "confirmed",
      cancelado: "canceled",
      "devolución parcial": "partially_returned",
      devuelto: "returned",
      partially_returned: "partially_returned",
      returned: "returned",
      pending: "pending",
      confirmed: "confirmed",
      canceled: "canceled",
    };
    return map[s] ?? (["pending","confirmed","canceled","partially_returned","returned"].includes(s) ? (s as OrderStatus) : undefined);
  };

  const getStatusBadge = (status: OrderStatus | undefined) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmado
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case "canceled":
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelado
          </Badge>
        );
      case "partially_returned":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Devolución parcial</Badge>;
      case "returned":
        return <Badge className="bg-muted text-foreground border-muted-foreground/20">Devuelto</Badge>;
      default:
        return <Badge variant="outline">—</Badge>;
    }
  };

  const prettyCode = (o: OrderDTO) => {
    if (o.code) return o.code;
    const n = (Number(String(o.id).replace(/\D/g, "").slice(-3)) || 0)
      .toString()
      .padStart(3, "0");
    return `PED${n}`;
  };

  // ---- Search + Filters (client-side) ----
  const filteredOrders = useMemo(() => {
    let ds: OrderDTO[] = orders ?? [];
    if (!ds.length) return ds;

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      ds = ds.filter((o) => {
        const clientName =
          (typeof o.customer === "object" && o.customer?.name) || "";
        return (
          (o.code && o.code.toLowerCase().includes(term)) ||
          clientName.toLowerCase().includes(term)
        );
      });
    }

    if (filters && Object.keys(filters).length > 0) {
      ds = ds.filter((o) => {
        const clientName =
          (typeof o.customer === "object" && o.customer?.name?.toLowerCase()) ||
          "";
        if (filters.client && !clientName.includes(filters.client.toLowerCase())) {
          return false;
        }

        if (filters.status && filters.status !== "all") {
          const wanted = normalizeStatus(filters.status);
          if (wanted && o.status !== wanted) return false;
        }

        const date = o.createdAt ? new Date(o.createdAt) : null;
        if (filters.dateFrom && date) {
          if (date < new Date(filters.dateFrom)) return false;
        }
        if (filters.dateTo && date) {
          if (date > new Date(filters.dateTo)) return false;
        }

        return true;
      });
    }

    const num = (oo: OrderDTO) =>
      Number(String(oo.code ?? "").replace(/\D/g, "")) || 0;
    ds = [...ds].sort((a, b) => num(b) - num(a));

    return ds;
  }, [orders, searchTerm, filters]);

  // ---- Loading / Error ----
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-muted-foreground">Cargando pedidos…</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <div className="text-destructive">
          Ocurrió un error al cargar pedidos.
        </div>
        <Button variant="outline" onClick={() => refetch()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!cashOpen && (
        <Card className="border-amber-300 bg-amber-50 text-amber-800">
          <CardContent className="pt-6 flex items-center justify-between gap-4">
            <span>La caja está cerrada. Abrila para poder confirmar pedidos y registrar ventas.</span>
            <Button onClick={() => navigate("/caja")}>Ir a abrir caja</Button>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Pedidos</h1>
          <p className="text-muted-foreground">Administra todos los pedidos de tus clientes</p>
        </div>
        <Button
          onClick={() => navigate("/new-order")}
          className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Pedido
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código (PEDxxx) o cliente…"
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

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Código</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Cliente</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Fecha</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Items</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Total</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Estado</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const customerName =
                    (typeof order.customer === "object" && order.customer?.name) ||
                    "Sin cliente";
                  const created =
                    order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString()
                      : "";

                  const qtyTotal = Array.isArray(order.items)
                    ? order.items.reduce((acc, it: any) => acc + Number(it?.quantity ?? 0), 0)
                    : 0;

                  // === TOTAL CON IVA (21%) ===
                  const totalGross = Array.isArray(order.items) && order.items.length > 0
                    ? order.items.reduce((acc, it: any) => {
                        const price = Number(it?.unitPrice ?? 0);
                        const qty = Number(it?.quantity ?? 0);
                        const disc = Number(it?.discount ?? 0);
                        const net = r2(price * qty - disc);           // s/IVA
                        const iva = r2(Math.max(0, net * IVA_RATE));  // 21%
                        const gross = r2(net + iva);                  // c/IVA
                        return acc + gross;
                      }, 0)
                    : Number(order.total ?? 0);

                  const disabledConfirm = order.status !== "pending" || !cashOpen;

                  return (
                    <tr
                      key={order.id}
                      className="border-b border-border hover:bg-accent/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-primary">
                        {prettyCode(order)}
                      </td>
                      <td className="py-3 px-4 text-foreground">{customerName}</td>
                      <td className="py-3 px-4 text-muted-foreground">{created}</td>

                      <td className="py-3 px-4 text-foreground">
                        {qtyTotal} {qtyTotal === 1 ? "item" : "items"}
                      </td>

                      <td className="py-3 px-4 font-semibold text-foreground tabular-nums">
                        {fmtMoney(totalGross)}
                      </td>

                      <td className="py-3 px-4">{getStatusBadge(order.status as OrderStatus)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {/* Ver: siempre */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleView(order)}
                            title="Ver pedido"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {/* Editar: SOLO si está pendiente */}
                          {order.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEdit(order)}
                              title="Editar pedido"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}

                          {/* Confirmar/Cancelar: SOLO si está pendiente */}
                          {order.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 hover:bg-success/10"
                                onClick={() => handleConfirm(order.id)}
                                title={cashOpen ? "Confirmar pedido" : "Abrir caja para confirmar"}
                                disabled={disabledConfirm}
                              >
                                <CheckCircle className={`w-4 h-4 ${cashOpen ? "text-success" : ""}`} />
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

                          {/* Eliminar: oculto si está confirmado */}
                          {order.status !== "confirmed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDelete(order.id)}
                              title="Eliminar pedido"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td className="py-6 px-4 text-muted-foreground" colSpan={7}>
                      No se encontraron pedidos con esos criterios.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <ViewOrderModal
        key={selectedOrder?.id ?? "no-order"}              // 👈 fuerza remount cuando cambia el pedido
        open={isViewModalOpen}
        onOpenChange={(o) => {                            // 👈 al cerrar, limpiamos selección
          setIsViewModalOpen(o);
          if (!o) setSelectedOrder(null);
        }}
        order={selectedOrder}
        onSoftRefresh={softRefresh}
      />
      <EditOrderModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        order={selectedOrder ?? undefined}
        onSave={handleSaveOrder}
      />
      <FilterOrdersModal
        open={isFilterModalOpen}
        onOpenChange={setIsFilterModalOpen}
        onApplyFilters={setFilters}
      />
    </div>
  );
}

export default OrdersSection;
