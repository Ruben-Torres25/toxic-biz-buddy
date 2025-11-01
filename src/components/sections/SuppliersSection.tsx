import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Package,
  TrendingUp,
  Users,
  Eye,
  Edit,
  ToggleLeft,
  ToggleRight,
  History,
  Loader2,
  FileSearch,
  RotateCcw,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { SuppliersAPI } from "@/services/suppliers.api";
import { ProductsAPI } from "@/services/products.api";

import { NewSupplierModal } from "@/components/modals/NewSupplierModal";
import { RegisterMerchandiseModal } from "@/components/modals/RegisterMerchandiseModal";
import { ViewSupplierModal } from "@/components/modals/ViewSupplierModal";
import { EditSupplierModal } from "@/components/modals/EditSupplierModal";
import ReceiptDetailModal from "@/components/modals/ReceiptDetailModal";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UISupplier = {
  id: string;
  name: string;
  alias?: string | null;
  cuit?: string | null;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  lastDelivery?: string | null;
  active?: boolean;
};

const normalizeSupplier = (raw: any): UISupplier => {
  const statusFromText = typeof raw?.status === "string" ? raw.status.toLowerCase() : undefined;
  const activeDerived =
    raw?.active ?? raw?.is_active ?? raw?.isActive ?? raw?.enabled ??
    (statusFromText === "active" ? true : statusFromText === "inactive" ? false : undefined);

  return {
    id: raw?.id ?? raw?.uuid ?? raw?._id ?? raw?.code ?? "—",
    name: raw?.name ?? raw?.razonSocial ?? raw?.displayName ?? raw?.fantasia ?? "—",
    alias: raw?.alias ?? null,
    cuit: raw?.cuit ?? raw?.ruc ?? null,
    contact: raw?.contact ?? raw?.contactName ?? raw?.contacto ?? raw?.responsable ?? undefined,
    phone: raw?.phone ?? raw?.telefono ?? raw?.tel ?? undefined,
    email: raw?.email ?? raw?.correo ?? undefined,
    address: raw?.address ?? raw?.direccion ?? undefined,
    lastDelivery:
      raw?.last_receipt_at ?? raw?.lastReceiptAt ?? raw?.last_goods_receipt_at ?? raw?.lastGoodsReceiptAt ?? null,
    active: typeof activeDerived === "boolean" ? activeDerived : true,
  };
};

const formatMaybeDate = (v?: string | null) => {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime())
    ? String(v)
    : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const formatDateTimeAR = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
};

const money = (n: number) => (Number(n) || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ========== MODAL HISTORIAL ========== */

type SupplierGoodsHistoryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId?: string;
  supplierName?: string;
  onOpenDetail: (receiptId: string) => void;
};

function SupplierGoodsHistoryModal({
  open,
  onOpenChange,
  supplierId,
  supplierName,
  onOpenDetail,
}: SupplierGoodsHistoryModalProps) {
  const PAGE_SIZE = 500;
  const page = 1;

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["supplierReceipts", supplierId, page, PAGE_SIZE],
    queryFn: async () => {
      if (!supplierId) return { data: [], total: 0, page: 1, pageSize: PAGE_SIZE };
      return SuppliersAPI.receiptsBySupplier(supplierId, page, PAGE_SIZE);
    },
    enabled: open && !!supplierId,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  const items: Array<{ id: string; supplier_id: string; created_at: string; lines_count: number; total_qty: number; total_amount: number }> =
    (data as any)?.data ?? (data as any)?.items ?? (data as any)?.results ?? [];

  const total = Number((data as any)?.total ?? items.length ?? 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Historial de ingresos
          </DialogTitle>
          <DialogDescription className="sr-only">
            Historial de ingresos por proveedor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Proveedor: <span className="font-medium text-foreground">{supplierName ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => refetch()} variant="secondary" size="sm" disabled={isFetching}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Refrescar
              </Button>
            </div>
          </div>

          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
              <div className="max-h-[460px] overflow-y-auto">
                <table className="w-full text-sm table-fixed">
                  <colgroup><col className="w-[160px]" /><col className="w-[240px]" /><col className="w-[120px]" /><col className="w-[120px]" /><col className="w-[160px]" /><col className="w-[140px]" /></colgroup>
                  <thead className="sticky top-0 z-20 bg-background">
                    <tr className="border-b border-border">
                      <th className="text-left  py-2 px-3 font-semibold">Fecha</th>
                      <th className="text-left  py-2 px-3 font-semibold">Proveedor</th>
                      <th className="text-right py-2 px-3 font-semibold">Productos</th>
                      <th className="text-right py-2 px-3 font-semibold">Cant. total</th>
                      <th className="text-right py-2 px-3 font-semibold">Total $</th>
                      <th className="text-left  py-2 px-3 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i} className="border-b border-border">
                          <td className="px-3 py-2"><div className="h-4 w-28 bg-muted/60 animate-pulse rounded" /></td>
                          <td className="px-3 py-2"><div className="h-4 w-40 bg-muted/60 animate-pulse rounded" /></td>
                          <td className="px-3 py-2 text-right"><div className="h-4 w-12 bg-muted/60 animate-pulse rounded inline-block" /></td>
                          <td className="px-3 py-2 text-right"><div className="h-4 w-16 bg-muted/60 animate-pulse rounded inline-block" /></td>
                          <td className="px-3 py-2 text-right"><div className="h-4 w-24 bg-muted/60 animate-pulse rounded inline-block" /></td>
                          <td className="px-3 py-2"><div className="h-8 w-16 bg-muted/60 animate-pulse rounded" /></td>
                        </tr>
                      ))
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8">
                          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <History className="w-6 h-6" />
                            <p className="text-sm">Sin ingresos registrados.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      items.map((r: any) => (
                        <tr
                          key={r.id}
                          className="border-b border-border even:bg-accent/10 hover:bg-accent/30 transition-colors"
                        >
                          <td className="px-3 py-2">
                            <time title={new Date(r.created_at ?? r.createdAt).toISOString()}>
                              {formatDateTimeAR(r.created_at ?? r.createdAt)}
                            </time>
                          </td>
                          <td className="px-3 py-2">
                            <span className="truncate block" title={supplierName ?? "—"}>
                              {supplierName ?? "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {r.lines_count ?? r.linesCount}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {r.total_qty ?? r.totalQty}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            ${money(Number(r.total_amount ?? r.totalAmount ?? 0))}
                          </td>
                          <td className="px-3 py-2">
                            <Button size="sm" variant="outline" onClick={() => onOpenDetail(r.id)}>
                              <FileSearch className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-right">Total: {total}</div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ========== SECCIÓN PRINCIPAL ========== */

export const SuppliersSection = () => {
  const qc = useQueryClient();

  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState(false);
  const [isRegisterMerchandiseOpen, setIsRegisterMerchandiseOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySupplier, setHistorySupplier] = useState<{ id: string; name: string } | null>(null);

  const [historySupplierId, setHistorySupplierId] = useState<string | undefined>(undefined);
  const HIST_PAGE_SIZE = 500;

  const [receiptDetailOpen, setReceiptDetailOpen] = useState(false);
  const [receiptId, setReceiptId] = useState<string | null>(null);

  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [presetSupplierId, setPresetSupplierId] = useState<string | undefined>(undefined);

  const [q, setQ] = useState("");
  const pageSize = 100;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["suppliers", { q, pageSize }],
    queryFn: async () => {
      const res = await SuppliersAPI.list(q, 1, pageSize);
      const items =
        (res as any)?.items ?? (res as any)?.data ?? (res as any)?.results ?? (Array.isArray(res) ? res : []);
      return Array.isArray(items) ? items : [];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const suppliers: UISupplier[] = useMemo(() => (data ?? []).map(normalizeSupplier), [data]);

  const activeCount = useMemo(
    () => suppliers.filter((s) => s.active !== false).length,
    [suppliers]
  );

  const supplierLookup = useMemo(
    () =>
      new Map(
        suppliers.map((s) => [
          s.id,
          { id: s.id, name: s.name, alias: s.alias ?? null, cuit: s.cuit ?? null },
        ])
      ),
    [suppliers]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return suppliers;
    return suppliers.filter((x) =>
      [x.name, x.alias, x.cuit, x.contact, x.email, x.phone, x.address]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [q, suppliers]);

  useEffect(() => {
    if (!historySupplierId && filtered.length > 0) {
      setHistorySupplierId(filtered[0].id);
    } else if (historySupplierId && !filtered.find((f) => f.id === historySupplierId)) {
      setHistorySupplierId(filtered[0]?.id);
    }
  }, [filtered, historySupplierId]);

  const {
    data: histRaw,
    isLoading: isHistLoading,
    isError: isHistError,
    error: histError,
    refetch: refetchHist,
    isFetching: isHistFetching,
  } = useQuery({
    queryKey: ["supplierReceiptsInline", historySupplierId, HIST_PAGE_SIZE],
    queryFn: async () => {
      if (!historySupplierId) return { data: [], total: 0, page: 1, pageSize: HIST_PAGE_SIZE };
      return SuppliersAPI.receiptsBySupplier(historySupplierId, 1, HIST_PAGE_SIZE);
    },
    enabled: !!historySupplierId,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  const histItems = (histRaw as any)?.data ?? (histRaw as any)?.items ?? (histRaw as any)?.results ?? [];
  const histTotal = Number((histRaw as any)?.total ?? histItems.length ?? 0);

  const { data: prodCount, isLoading: isProdLoading, isError: isProdError } = useQuery({
    queryKey: ["productsCount"],
    queryFn: async () => {
      const resp: any = await ProductsAPI.search({ page: 1, limit: 1 });
      const data = resp?.data ?? resp;
      const total = Number(data?.total ?? 0);
      return Number.isFinite(total) ? total : 0;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const handleToggleActive = async (supplier: UISupplier) => {
    const next = !(supplier.active === true);
    try {
      await SuppliersAPI.toggleActive(supplier.id, next);
      toast({
        title: next ? "Proveedor activado" : "Proveedor desactivado",
        description: supplier.name,
      });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["suppliers"] }),
        qc.invalidateQueries({ queryKey: ["supplierReceiptsInline"] }),
      ]);
      refetchHist();
    } catch (e: any) {
      toast({
        title: "No se pudo cambiar el estado",
        description: e?.response?.data?.message ?? "Intentalo nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleSaveSupplier = async () => {
    await qc.invalidateQueries({ queryKey: ["suppliers"] });
    refetchHist();
  };

  const openReceiptDetail = (id: string) => {
    setReceiptId(id);
    setReceiptDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Proveedores</h1>
          <p className="text-muted-foreground">Administra tus proveedores y sus entregas</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setPresetSupplierId(undefined);
              setIsRegisterMerchandiseOpen(true);
            }}
            className="border-primary text-primary hover:bg-primary/10"
          >
            <Package className="w-4 h-4 mr-2" />
            Registrar Mercadería
          </Button>
          <Button
            onClick={() => setIsNewSupplierOpen(true)}
            className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Proveedor
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-card to-accent/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Proveedores</p>
                <p className="text-2xl font-bold text-foreground">{isLoading ? "…" : suppliers.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Proveedores Activos</p>
                <p className="text-2xl font-bold text-success">{isLoading ? "…" : activeCount}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Productos Totales</p>
                <p className="text-2xl font-bold text-primary">
                  {isProdLoading ? "…" : isProdError ? "—" : Number(prodCount ?? 0).toLocaleString("es-AR")}
                </p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar proveedores por nombre, alias, CUIT, contacto…"
                className="pl-10"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Proveedores */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Proveedores</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="text-destructive">
              Error al cargar proveedores: {String((error as any)?.message ?? "Desconocido")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="rounded-md border">
                <div className="max-h-[460px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-background z-10">
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Proveedor</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Contacto</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Teléfono</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Dirección</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Último ingreso</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Estado</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-muted-foreground">
                            Cargando proveedores…
                          </td>
                        </tr>
                      ) : filtered.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-muted-foreground">
                            {q ? "No hay resultados para la búsqueda." : "No hay proveedores cargados."}
                          </td>
                        </tr>
                      ) : (
                        filtered.map((supplier) => (
                          <tr
                            key={supplier.id}
                            className={`border-b border-border hover:bg-accent/30 transition-colors ${
                              supplier.active === false ? "opacity-70" : ""
                            }`}
                          >
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="max-w-[260px]">
                                <p className="font-medium text-foreground truncate">{supplier.name}</p>
                                <div className="text-xs text-muted-foreground flex gap-2">
                                  {supplier.cuit ? <span className="truncate">CUIT: {supplier.cuit}</span> : null}
                                  {supplier.alias ? <span className="truncate">• Alias: {supplier.alias}</span> : null}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="max-w-[220px]">
                                <p className="font-medium text-foreground truncate">{supplier.contact ?? "—"}</p>
                                <p className="text-sm text-muted-foreground truncate">{supplier.email ?? "—"}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="truncate block max-w-[160px]">{supplier.phone ?? "—"}</span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="truncate block max-w-[240px]">{supplier.address ?? "—"}</span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="max-w-[160px]">
                                <p className="font-medium text-foreground truncate">
                                  {formatMaybeDate(supplier.lastDelivery)}
                                </p>
                                <p className="text-xs text-muted-foreground">Último ingreso</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {supplier.active === false ? (
                                <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                                  Inactivo
                                </Badge>
                              ) : (
                                <Badge className="bg-success/10 text-success border-success/20">
                                  Activo
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedSupplier(supplier);
                                    setIsViewModalOpen(true);
                                  }}
                                  title="Ver proveedor"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedSupplier(supplier);
                                    setIsEditModalOpen(true);
                                  }}
                                  title="Editar proveedor"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>

                                {/* Activar / Desactivar */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className={`h-8 px-2 ${
                                    supplier.active === false
                                      ? "hover:bg-success/10 hover:text-success"
                                      : "hover:bg-destructive/10 hover:text-destructive"
                                  }`}
                                  onClick={() => handleToggleActive(supplier)}
                                  title={supplier.active === false ? "Activar proveedor" : "Desactivar proveedor"}
                                >
                                  {supplier.active === false ? (
                                    <ToggleRight className="w-4 h-4 mr-1" />
                                  ) : (
                                    <ToggleLeft className="w-4 h-4 mr-1" />
                                  )}
                                  {supplier.active === false ? "Activar" : "Desactivar"}
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2"
                                  disabled={supplier.active === false}
                                  onClick={() => {
                                    if (supplier.active === false) {
                                      toast({
                                        title: "Proveedor inactivo",
                                        description: "No podés registrar mercadería con un proveedor desactivado.",
                                        variant: "destructive",
                                      });
                                      return;
                                    }
                                    setPresetSupplierId(supplier.id);
                                    setIsRegisterMerchandiseOpen(true);
                                  }}
                                  title={supplier.active === false ? "Proveedor inactivo" : "Registrar ingreso de mercadería"}
                                >
                                  <Package className="w-4 h-4 mr-1" />
                                  Ingreso
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2"
                                  onClick={() => {
                                    setHistorySupplier({ id: supplier.id, name: supplier.name });
                                    setIsHistoryOpen(true);
                                  }}
                                  title="Historial de ingresos"
                                >
                                  <History className="w-4 h-4 mr-1" />
                                  Historial
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card fija: Historial de ingresos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Historial de ingresos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value={historySupplierId ?? ""}
              onValueChange={(v) => {
                setHistorySupplierId(v || undefined);
              }}
            >
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="Elegí un proveedor…" />
              </SelectTrigger>
              <SelectContent>
                {filtered.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (historySupplierId) {
                  const name = suppliers.find((s) => s.id === historySupplierId)?.name;
                  setHistorySupplier({ id: historySupplierId, name: name ?? "Proveedor" });
                  setIsHistoryOpen(true);
                }
              }}
            >
              <History className="w-4 h-4 mr-1" />
              Ver todos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!historySupplierId ? (
            <div className="text-sm text-muted-foreground">Elegí un proveedor para ver sus ingresos.</div>
          ) : (
            <>
              {isHistLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
                </div>
              ) : isHistError ? (
                <div className="text-destructive text-sm">
                  Error: {String((histError as any)?.message ?? "desconocido")}
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <div className="max-h-[460px] overflow-y-auto">
                      <table className="w-full text-sm table-fixed">
                        <colgroup><col className="w-[160px]" /><col className="w-[240px]" /><col className="w-[120px]" /><col className="w-[120px]" /><col className="w-[160px]" /><col className="w-[140px]" /></colgroup>
                        <thead className="bg-background sticky top-0 z-20">
                          <tr className="border-b border-border">
                            <th className="text-left  py-2 px-3 font-semibold">Fecha</th>
                            <th className="text-left  py-2 px-3 font-semibold">Proveedor</th>
                            <th className="text-right py-2 px-3 font-semibold">Productos</th>
                            <th className="text-right py-2 px-3 font-semibold">Cant. total</th>
                            <th className="text-right py-2 px-3 font-semibold">Total $</th>
                            <th className="text-left  py-2 px-3 font-semibold">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {histItems.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8">
                                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                  <History className="w-6 h-6" />
                                  <p className="text-sm">Sin ingresos registrados.</p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            histItems.map((r: any) => {
                              const provId = r.supplier_id ?? historySupplierId ?? "";
                              const provName =
                                supplierLookup.get(provId)?.name ??
                                suppliers.find((s) => s.id === provId)?.name ??
                                "—";
                              return (
                                <tr
                                  key={r.id}
                                  className="border-b border-border even:bg-accent/10 hover:bg-accent/20 transition-colors"
                                >
                                  <td className="px-3 py-2">
                                    <time title={new Date(r.created_at ?? r.createdAt).toISOString()}>
                                      {formatDateTimeAR(r.created_at ?? r.createdAt)}
                                    </time>
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className="truncate block" title={provName}>{provName}</span>
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums">
                                    {r.lines_count ?? r.linesCount}
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums">
                                    {r.total_qty ?? r.totalQty}
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums">
                                    ${money(Number(r.total_amount ?? r.totalAmount ?? 0))}
                                  </td>
                                  <td className="px-3 py-2">
                                    <Button size="sm" variant="outline" onClick={() => openReceiptDetail(r.id)}>
                                      <FileSearch className="w-4 h-4 mr-1" />
                                      Ver
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="p-2 text-xs text-muted-foreground text-right">
                    Total: {histTotal}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modales */}
      <NewSupplierModal
        open={isNewSupplierOpen}
        onOpenChange={(open) => {
          setIsNewSupplierOpen(open);
          if (!open) (async () => { await qc.invalidateQueries({ queryKey: ["suppliers"] }); })();
        }}
      />

      <RegisterMerchandiseModal
        open={isRegisterMerchandiseOpen}
        onOpenChange={setIsRegisterMerchandiseOpen}
        defaultSupplierId={presetSupplierId}
        onRegistered={async (res: { supplierId?: string }) => {
          await Promise.all([
            qc.invalidateQueries({ queryKey: ["suppliers"] }),
            qc.invalidateQueries({ queryKey: ["supplierReceipts"] }),
            qc.invalidateQueries({ queryKey: ["supplierReceiptsInline"] }),
            qc.invalidateQueries({ queryKey: ["productsCount"] }),
          ]);
          setQ("");
          if (res?.supplierId) setHistorySupplierId(res.supplierId);
          refetchHist();
        }}
      />

      <ViewSupplierModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        supplier={selectedSupplier}
      />

      <EditSupplierModal
        open={isEditModalOpen}
        onOpenChange={(open) => {
          setIsEditModalOpen(open);
          if (!open) (async () => { await qc.invalidateQueries({ queryKey: ["suppliers"] }); })();
        }}
        supplier={selectedSupplier}
        onSave={handleSaveSupplier}
      />

      <SupplierGoodsHistoryModal
        open={isHistoryOpen}
        onOpenChange={(open) => {
          setIsHistoryOpen(open);
          if (!open) setHistorySupplier(null);
        }}
        supplierId={historySupplier?.id}
        supplierName={historySupplier?.name}
        onOpenDetail={(id) => openReceiptDetail(id)}
      />

      <ReceiptDetailModal
        open={receiptDetailOpen}
        onOpenChange={setReceiptDetailOpen}
        receiptId={receiptId}
        supplierLookup={supplierLookup}
      />
    </div>
  );
};
