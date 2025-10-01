import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  DollarSign,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { NewClientModal, type NewClientPayload } from "@/components/modals/NewClientModal";
import { ViewClientModal } from "@/components/modals/ViewClientModal";
import { EditClientModal } from "@/components/modals/EditClientModal";
import AdjustBalanceModal from "@/components/modals/AdjustBalanceModal";
import ConfirmDeleteDialog from "@/components/modals/ConfirmDeleteDialog";
import { toast } from "@/hooks/use-toast";
import { CustomersAPI } from "@/services/customers.api";

// === DTO que viene del backend ===
type CustomerDTO = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  phone2?: string | null;      // segundo teléfono
  address?: string | null;
  postalCode?: string | null;  // código postal
  notes?: string | null;
  balance?: number | null;
};

// === Tipo de UI (con extras para la tabla/modales) ===
type Client = CustomerDTO & {
  orders: number;     // placeholder UI
  lastOrder: string;  // placeholder UI
};

// Adaptador: de DTO (back) a Client (UI)
function toClient(dto: CustomerDTO): Client {
  return {
    ...dto,
    orders: 0,
    lastOrder: "-",
  };
}

export const ClientsSection = () => {
  const qc = useQueryClient();

  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isViewClientOpen, setIsViewClientOpen] = useState(false);
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientToAdjust, setClientToAdjust] = useState<{ id: string; name: string; balance?: number | null } | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const [search, setSearch] = useState("");

  // ===== Listar clientes desde el backend =====
  const listQuery = useQuery({
    queryKey: ["customers"],
    queryFn: CustomersAPI.list, // debe devolver CustomerDTO[]
  });

  const customers: Client[] = useMemo(
    () => (listQuery.data ?? []).map(toClient),
    [listQuery.data]
  );

  // ===== Mutaciones =====
  const createMut = useMutation({
    mutationFn: (payload: NewClientPayload) => CustomersAPI.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Cliente creado" });
    },
    onError: (e: any) => {
      toast({ title: "Error al crear", description: e?.message ?? "Inténtalo de nuevo", variant: "destructive" });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CustomerDTO> }) =>
      CustomersAPI.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Cliente actualizado", description: "Los cambios fueron guardados." });
    },
    onError: (e: any) => {
      toast({ title: "Error al actualizar", description: e?.message ?? "Inténtalo de nuevo", variant: "destructive" });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) =>
      (CustomersAPI as any).delete ? CustomersAPI.delete(id) : (CustomersAPI as any).remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Cliente eliminado" });
      setIsDeleteOpen(false);
      setClientToDelete(null);
    },
    onError: (e: any) => {
      toast({ title: "Error al eliminar", description: e?.message ?? "Inténtalo de nuevo", variant: "destructive" });
    },
  });

  const adjustMut = useMutation({
    mutationFn: ({ id, amount, reason }: { id: string; amount: number; reason?: string }) =>
      CustomersAPI.adjustBalance(id, { amount, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast({ title: "Saldo ajustado" });
    },
    onError: (e: any) => {
      toast({ title: "Error ajustando saldo", description: e?.message ?? "Inténtalo de nuevo", variant: "destructive" });
    },
  });

  // ===== Filtrado local (MVP) =====
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.name, c.email ?? "", c.phone ?? "", c.phone2 ?? "", c.address ?? "", c.postalCode ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [customers, search]);

  // ===== Helpers UI =====
  const getBalanceBadge = (balance?: number | null) => {
    const v = Number(balance ?? 0);
    if (v > 0) {
      return <Badge className="bg-success/10 text-success border-success/20">+${v.toFixed(2)}</Badge>;
    } else if (v < 0) {
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">${v.toFixed(2)}</Badge>;
    } else {
      return <Badge className="bg-muted/10 text-muted-foreground border-muted/20">$0.00</Badge>;
    }
  };

  const openView = (c: Client) => { setSelectedClient(c); setIsViewClientOpen(true); };
  const openEdit = (c: Client) => { setSelectedClient(c); setIsEditClientOpen(true); };

  // Abre el diálogo de confirmación
  const handleAskDelete = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    await deleteMut.mutateAsync(clientToDelete.id);
  };

  const handleSaveClient = async (
    id: string,
    payload: {
      name?: string;
      phone?: string;
      phone2?: string;
      email?: string;
      address?: string;
      postalCode?: string;
      notes?: string;
    }
  ) => {
    const clean: Partial<CustomerDTO> = {
      name: payload.name?.trim() || undefined,
      phone: payload.phone?.trim() || undefined,
      phone2: payload.phone2?.trim() || undefined,
      email: payload.email?.trim() || undefined,
      address: payload.address?.trim() || undefined,
      postalCode: payload.postalCode?.trim() || undefined,
      notes: payload.notes?.trim() || undefined,
    };
    await updateMut.mutateAsync({ id, payload: clean });
  };

  // Abrir modal de ajuste con preview
  const handleAdjustBalance = (client: Client) => {
    setClientToAdjust({ id: client.id, name: client.name, balance: client.balance });
    setIsAdjustOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Clientes</h1>
          <p className="text-muted-foreground">Administra la información de tus clientes y sus cuentas</p>
        </div>
        <Button onClick={() => setIsNewClientOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Stats (MVP) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-card to-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clientes</p>
                <p className="text-2xl font-bold text-foreground">{customers.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saldo a Favor (aprox.)</p>
                <p className="text-2xl font-bold text-success">
                  $
                  {useMemo(() => {
                    const pos = customers.reduce((acc, c) => acc + Math.max(0, Number(c.balance ?? 0)), 0);
                    return pos.toFixed(2);
                  }, [customers])}
                </p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Deudas (aprox.)</p>
                <p className="text-2xl font-bold text-destructive">
                  $
                  {useMemo(() => {
                    const neg = customers.reduce((acc, c) => acc + Math.min(0, Number(c.balance ?? 0)), 0);
                    return Math.abs(neg).toFixed(2);
                  }, [customers])}
                </p>
              </div>
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes por nombre, email, teléfono o CP..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" className="sm:w-auto" disabled>
              <Filter className="w-4 h-4 mr-2" />
              Filtros (próximamente)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          {listQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">Cargando clientes…</div>
          ) : listQuery.isError ? (
            <div className="text-sm text-destructive">No se pudieron cargar los clientes.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Cliente</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Contacto</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Saldo</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((client) => (
                    <tr key={client.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-foreground">{client.name}</p>
                          {(client.address || client.postalCode) && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {client.address}
                              {client.address && client.postalCode ? " - " : " "}
                              {client.postalCode}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {client.email && (
                            <p className="text-sm text-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {client.email}
                            </p>
                          )}
                          {client.phone && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {client.phone}
                            </p>
                          )}
                          {client.phone2 && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {client.phone2}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">{getBalanceBadge(client.balance)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => openView(client)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => openEdit(client)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleAdjustBalance(client)}
                            title="Ajustar saldo"
                          >
                            <DollarSign className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleAskDelete(client)}
                            disabled={deleteMut.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-sm text-muted-foreground mt-3">Sin resultados.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modales */}
      <NewClientModal
        open={isNewClientOpen}
        onOpenChange={setIsNewClientOpen}
        onCreate={async (p) => {
          await createMut.mutateAsync(p);
        }}
      />
      <ViewClientModal
        open={isViewClientOpen}
        onOpenChange={setIsViewClientOpen}
        client={selectedClient as any}
      />
      <EditClientModal
        open={isEditClientOpen}
        onOpenChange={setIsEditClientOpen}
        client={selectedClient as any}
        onSave={handleSaveClient}
      />
      <AdjustBalanceModal
        open={isAdjustOpen}
        onOpenChange={setIsAdjustOpen}
        client={clientToAdjust}
        onConfirm={async ({ id, amount, reason }) => {
          await adjustMut.mutateAsync({ id, amount, reason });
        }}
      />
      <ConfirmDeleteDialog
        open={isDeleteOpen}
        onOpenChange={(o) => {
          if (!o) setClientToDelete(null);
          setIsDeleteOpen(o);
        }}
        title="Eliminar cliente"
        description={`¿Seguro que querés eliminar a "${clientToDelete?.name ?? ""}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={confirmDelete}
        loading={deleteMut.isPending}
      />
    </div>
  );
};
