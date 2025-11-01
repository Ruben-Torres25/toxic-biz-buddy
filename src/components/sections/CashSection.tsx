import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { CashAPI } from "@/services/cash.api";
import { useCart } from "@/hooks/useCart";
import CartTable from "@/components/sections/CartTable";
import PaymentPanel from "@/components/sections/PaymentPanel";

import { money, number } from "@/utils/format";
import {
  ShoppingCart,
  Plus,
  Printer,
  LogIn,
  LogOut,
  CheckCircle2,
  ListOrdered,
  Banknote,
  RotateCcw,
} from "lucide-react";
import type { PaymentMethod } from "@/types/sales";
import type { Product } from "@/types/domain";
import ProductSearchModal from "../modals/ProductSearchModal";

type Movement = {
  id: string;
  createdAt: string;
  occurredAt?: string | null;
  type: "income" | "expense" | "sale";
  amount: number;
  description: string;
};

export const CashSection = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  // Carrito
  const {
    lines,
    addLine,
    removeLine,
    setQty,
    setPrice,
    setDiscountLine,
    discountGlobal,
    setDiscountGlobal,
    payments,
    setPayment,
    totals,
    clearCart,
    notes,
    setNotes,
  } = useCart();

  // Estado de caja (resumen diario)
  const { data: cashCur, isLoading: loadingCur } = useQuery({
    queryKey: ["cash-current"],
    queryFn: () => CashAPI.current(),
    staleTime: 15_000,
  });
  const isOpen = !!cashCur?.isOpen;

  // Movimientos de hoy (para “Ventas del día”)
  const { data: movsToday } = useQuery({
    queryKey: ["cash-movements"],
    queryFn: () => CashAPI.movements(),
    staleTime: 5_000,
  });

  const salesToday: Movement[] = useMemo(
    () => (Array.isArray(movsToday) ? (movsToday as Movement[]).filter((m) => m.type === "sale") : []),
    [movsToday]
  );
  const salesTotal = salesToday.reduce((acc, m) => acc + Number(m.amount || 0), 0);

  // Abrir / Cerrar caja
  const openMutation = useMutation({
    mutationFn: (amount: number) => CashAPI.open(amount),
    onSuccess: () => {
      toast({ title: "Caja abierta" });
      qc.invalidateQueries({ queryKey: ["cash-current"] });
    },
    onError: (e: any) =>
      toast({
        title: "No se pudo abrir caja",
        description: e?.message ?? "Error",
        variant: "destructive",
      }),
  });

  const closeMutation = useMutation({
    mutationFn: (amount: number) => CashAPI.close(amount),
    onSuccess: () => {
      toast({ title: "Caja cerrada" });
      qc.invalidateQueries({ queryKey: ["cash-current"] });
    },
    onError: (e: any) =>
      toast({
        title: "No se pudo cerrar caja",
        description: e?.message ?? "Error",
        variant: "destructive",
      }),
  });

  // ------ Buscar/Agregar productos con Modal ------
  const [showSearch, setShowSearch] = useState(false);

  // Mapa de cantidades ya en el carrito (para que el modal muestre disponibilidad restante)
  const inOrder = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const l of lines) {
      map[l.productId] = (map[l.productId] || 0) + Number(l.qty || 0);
    }
    return map;
  }, [lines]);

  function addProductToCart(payload: {
    product: Product;
    quantity: number;
    discountPercent: number;
  }) {
    const { product, quantity, discountPercent } = payload;
    const unit = Number(product.price || 0);
    const discAbsPerUnit =
      Math.round(unit * (Math.max(0, Math.min(100, discountPercent)) / 100) * 100) / 100;

    addLine({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      price: unit,
      qty: Math.max(1, Math.floor(quantity || 1)),
      discount: discAbsPerUnit, // descuento absoluto por unidad
    });
  }

  // ✅ Confirmar venta SOLO si la caja está abierta y el pago cubre el total
  const canConfirm = useMemo(() => {
    const total = totals.total;
    const pagos = totals.pagos;
    return isOpen && total > 0 && pagos >= total;
  }, [isOpen, totals]);

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        items: lines.map((l) => ({
          productId: l.productId,
          qty: l.qty,
          price: l.price,
          discount: l.discount || 0,
        })),
        payments: payments.map((p) => ({ method: p.method, amount: p.amount })),
        notes: notes?.trim() || undefined,
        discountGlobal: discountGlobal || 0,
      };
      const sale = await CashAPI.checkout(payload);
      return sale;
    },
    onSuccess: () => {
      toast({
        title: "Venta confirmada",
        description: `Se registró correctamente`,
        duration: 3000,
      });
      clearCart();

      // refrescar resumen y ventas del día
      qc.invalidateQueries({ queryKey: ["cash-current"] });
      qc.invalidateQueries({ queryKey: ["cash-movements"] });
      qc.invalidateQueries({ queryKey: ["history-list"] }); // si lo usás
      qc.invalidateQueries({ queryKey: ["cash", "daily"] }); // historia → caja por día
    },
    onError: (e: any) =>
      toast({
        title: "No se pudo confirmar",
        description: e?.message ?? "Error",
        variant: "destructive",
      }),
  });

  // ====== NUEVO: Ingreso / Egreso rápido ======
  const [showIncomeDialog, setShowIncomeDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);

  const incomeMutation = useMutation({
    mutationFn: async (args: { amount: number; description?: string }) =>
      CashAPI.income({ amount: Math.abs(args.amount), description: args.description?.trim() || undefined }),
    onSuccess: () => {
      toast({ title: "Ingreso registrado" });
      setShowIncomeDialog(false);
      qc.invalidateQueries({ queryKey: ["cash-current"] });
      qc.invalidateQueries({ queryKey: ["cash-movements"] });
      qc.invalidateQueries({ queryKey: ["cash", "daily"] });
    },
    onError: (e: any) =>
      toast({
        title: "No se pudo registrar el ingreso",
        description: e?.message ?? "Error",
        variant: "destructive",
      }),
  });

  const expenseMutation = useMutation({
    mutationFn: async (args: { amount: number; description?: string }) =>
      CashAPI.expense({ amount: Math.abs(args.amount), description: args.description?.trim() || undefined }),
    onSuccess: () => {
      toast({ title: "Egreso registrado" });
      setShowExpenseDialog(false);
      qc.invalidateQueries({ queryKey: ["cash-current"] });
      qc.invalidateQueries({ queryKey: ["cash-movements"] });
      qc.invalidateQueries({ queryKey: ["cash", "daily"] });
    },
    onError: (e: any) =>
      toast({
        title: "No se pudo registrar el egreso",
        description: e?.message ?? "Error",
        variant: "destructive",
      }),
  });

  // pagos rápidos
  function handleAutofill(method: PaymentMethod, value: number) {
    setPayment(method, Math.max(0, value));
  }

  // Atajo F2 para abrir modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Estado: ver detalle ventas
  const [showSalesDetail, setShowSalesDetail] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Caja</h1>
            <p className="text-muted-foreground">Escaneá, agregá al carrito y cobrá</p>
          </div>
        </div>

        {/* Estado + acciones */}
        <div className="flex flex-wrap items-center gap-2">
          {loadingCur ? (
            <Badge variant="outline" className="border-muted/30 text-muted-foreground">
              Cargando…
            </Badge>
          ) : isOpen ? (
            <Badge variant="outline" className="border-success/30 text-success" title="Caja abierta">
              <LogIn className="w-4 h-4 mr-1" /> Abierta
            </Badge>
          ) : (
            <Badge variant="outline" className="border-destructive/30 text-destructive" title="Caja cerrada">
              <LogOut className="w-4 h-4 mr-1" /> Cerrada
            </Badge>
          )}

          {!isOpen ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default" data-testid="btn-open-cash">
                  <LogIn className="w-4 h-4 mr-2" />
                  Abrir caja
                </Button>
              </AlertDialogTrigger>
              <OpenCashDialog
                onConfirm={(amount) => openMutation.mutate(amount)}
                isLoading={openMutation.isPending}
              />
            </AlertDialog>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setShowIncomeDialog(true)} title="Registrar ingreso">
                <Banknote className="w-4 h-4 mr-2" />
                Ingreso
              </Button>
              <Button variant="secondary" onClick={() => setShowExpenseDialog(true)} title="Registrar egreso">
                <RotateCcw className="w-4 h-4 mr-2" />
                Egreso
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" data-testid="btn-close-cash">
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar caja
                  </Button>
                </AlertDialogTrigger>
                <CloseCashDialog
                  onConfirm={(amount) => closeMutation.mutate(amount)}
                  isLoading={closeMutation.isPending}
                />
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {/* Resumen del día + Ventas del día */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resumen */}
        <Card className="lg:col-span-2">
          <CardHeader className="py-3">
            <CardTitle className="text-base">Resumen del día</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm">
            <Info name="Apertura" value={money(cashCur?.openingAmount ?? 0)} />
            <Info name="Ventas" value={money(cashCur?.totalSales ?? 0)} />
            <Info name="Ingresos" value={money(cashCur?.totalIncome ?? 0)} />
            <Info name="Egresos" value={money(cashCur?.totalExpense ?? 0)} />
            <Info name="Balance" value={money(cashCur?.balance ?? 0)} />
            <Info name="Estado" value={cashCur?.isOpen ? "Abierta" : "Cerrada"} />
          </CardContent>
        </Card>

        {/* Ventas del día */}
        <Card>
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ListOrdered className="w-4 h-4" /> Ventas de hoy
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowSalesDetail(true)}>
              Ver detalle
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cantidad</span>
              <span className="font-medium">{number(salesToday.length)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium">{money(salesTotal)}</span>
            </div>
            <div className="border rounded-md">
              <ScrollArea className="max-h-40">
                <ul className="text-sm divide-y">
                  {salesToday.slice(0, 2).map((s) => {
                    const when = new Date(s.occurredAt || s.createdAt);
                    const hh = String(when.getHours()).padStart(2, "0");
                    const mm = String(when.getMinutes()).padStart(2, "0");
                    return (
                      <li key={s.id} className="px-3 py-2 flex items-center justify-between">
                        <span className="text-muted-foreground">
                          {hh}:{mm}
                        </span>
                        <span className="flex-1 mx-2 truncate">{s.description || "Venta"}</span>
                        <span className="font-medium">{money(Number(s.amount || 0))}</span>
                      </li>
                    );
                  })}
                  {salesToday.length === 0 && (
                    <li className="px-3 py-6 text-center text-muted-foreground">Sin ventas aún</li>
                  )}
                </ul>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Carrito + pagos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Carrito</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CartTable
                lines={lines}
                onQty={setQty}
                onPrice={setPrice}
                onDiscount={setDiscountLine}
                onRemove={removeLine}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground">Observaciones</label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas del ticket (opcional)"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Descuento global ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={discountGlobal}
                    onChange={(e) => setDiscountGlobal(Math.max(0, Number(e.target.value || 0)))}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border rounded-md p-3 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span>Ítems:</span> <b className="tabular-nums">{number(lines.length)}</b>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Subtotal:</span> <b className="tabular-nums">{money(totals.subtotal)}</b>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Desc. global:</span> <b className="tabular-nums">{money(discountGlobal)}</b>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground">Total</div>
                  <div className="text-2xl font-bold tabular-nums">{money(totals.total)}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSearch(true)}
                  title="Abrir buscador de productos"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar al carrito
                </Button>
                <Button variant="outline" onClick={() => {}} title="Imprimir" disabled>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir (deshabilitado)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <PaymentPanel
            total={totals.total}
            current={{
              cash: payments.find((p) => p.method === "cash")?.amount || 0,
              debit: payments.find((p) => p.method === "debit")?.amount || 0,
              credit: payments.find((p) => p.method === "credit")?.amount || 0,
              transfer: payments.find((p) => p.method === "transfer")?.amount || 0,
            }}
            onSetPayment={(m, a) =>
              setPayment(m, Math.max(0, Math.round(Number(a || 0) * 100) / 100))
            }
            onAutofill={(m, v) =>
              setPayment(m, Math.max(0, Math.round(Number(v || 0) * 100) / 100))
            }
          />

          <ConfirmButton
            disabled={lines.length === 0 || !canConfirm || checkoutMutation.isPending}
            loading={checkoutMutation.isPending}
            onConfirm={() => checkoutMutation.mutate()}
          />
        </div>
      </div>

      {/* Modal de búsqueda/selección */}
      <ProductSearchModal
        open={showSearch}
        onOpenChange={setShowSearch}
        onPick={addProductToCart}
        inOrder={inOrder}
      />

      {/* Modal Detalle de Ventas del Día */}
      <Dialog open={showSalesDetail} onOpenChange={setShowSalesDetail}>
        <DialogContent className="max-w-3xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Ventas de hoy</DialogTitle>
          </DialogHeader>
          <div className="border rounded-md">
            <div className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                Cantidad: <b>{number(salesToday.length)}</b>
              </span>
              <span className="text-muted-foreground">
                Total: <b>{money(salesTotal)}</b>
              </span>
            </div>
            <ScrollArea className="max-h-[55vh]">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left w-[18%]">Hora</th>
                    <th className="px-3 py-2 text-left">Descripción</th>
                    <th className="px-3 py-2 text-right w-[20%]">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {salesToday.map((s) => {
                    const when = new Date(s.occurredAt || s.createdAt);
                    const hh = String(when.getHours()).padStart(2, "0");
                    const mm = String(when.getMinutes()).padStart(2, "0");
                    return (
                      <tr key={s.id} className="border-b">
                        <td className="px-3 py-2 align-middle text-muted-foreground">
                          {hh}:{mm}
                        </td>
                        <td className="px-3 py-2 align-middle">{s.description || "Venta"}</td>
                        <td className="px-3 py-2 align-middle text-right">{money(Number(s.amount || 0))}</td>
                      </tr>
                    );
                  })}
                  {salesToday.length === 0 && (
                    <tr>
                      <td className="px-3 py-8 text-center text-muted-foreground" colSpan={3}>
                        No hay ventas registradas hoy.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* NUEVOS: Modales Ingreso / Egreso */}
      <QuickMovementDialog
        open={showIncomeDialog}
        onOpenChange={setShowIncomeDialog}
        title="Registrar ingreso"
        confirmLabel="Registrar ingreso"
        loading={incomeMutation.isPending}
        onConfirm={(amount, description) => incomeMutation.mutate({ amount, description })}
      />

      <QuickMovementDialog
        open={showExpenseDialog}
        onOpenChange={setShowExpenseDialog}
        title="Registrar egreso"
        confirmLabel="Registrar egreso"
        loading={expenseMutation.isPending}
        onConfirm={(amount, description) => expenseMutation.mutate({ amount, description })}
      />
    </div>
  );
};

/* ---------- helpers UI ---------- */
function Info({ name, value }: { name: string; value: string }) {
  return (
    <div className="rounded-md border p-2 flex flex-col gap-1">
      <span className="text-[11px] text-muted-foreground">{name}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function ConfirmButton({
  disabled,
  loading,
  onConfirm,
}: {
  disabled: boolean;
  loading: boolean;
  onConfirm: () => void;
}) {
  return (
    <Button className="w-full h-12 text-base" disabled={disabled || loading} onClick={onConfirm}>
      {loading ? "Confirmando…" : (<><CheckCircle2 className="w-5 h-5 mr-2" /> Confirmar venta</>)}
    </Button>
  );
}

function OpenCashDialog({
  onConfirm,
  isLoading,
}: {
  onConfirm: (amount: number) => void;
  isLoading: boolean;
}) {
  const [amount, setAmount] = useState<number>(0);
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Abrir caja</AlertDialogTitle>
        <AlertDialogDescription>Ingresá el fondo inicial.</AlertDialogDescription>
      </AlertDialogHeader>
      <div className="py-2">
        <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value || 0))} />
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction onClick={() => onConfirm(amount)} disabled={isLoading} data-testid="confirm-open-cash">
          {isLoading ? "Abriendo…" : "Abrir"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}

function CloseCashDialog({
  onConfirm,
  isLoading,
}: {
  onConfirm: (amount: number) => void;
  isLoading: boolean;
}) {
  const [amount, setAmount] = useState<number>(0);
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Cerrar caja</AlertDialogTitle>
        <AlertDialogDescription>Contá el efectivo y registrá el monto.</AlertDialogDescription>
      </AlertDialogHeader>
      <div className="py-2">
        <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value || 0))} />
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction onClick={() => onConfirm(amount)} disabled={isLoading} data-testid="confirm-close-cash">
          {isLoading ? "Cerrando…" : "Cerrar"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}

/** Modal simple para Ingreso/Egreso */
function QuickMovementDialog({
  open,
  onOpenChange,
  title,
  confirmLabel,
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  confirmLabel: string;
  loading: boolean;
  onConfirm: (amount: number, description?: string) => void;
}) {
  const [amount, setAmount] = useState<number>(0);
  const [desc, setDesc] = useState<string>("");

  useEffect(() => {
    if (!open) {
      setAmount(0);
      setDesc("");
    }
  }, [open]);

  const canSave = amount > 0 && !loading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">Importe</label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value || 0)))}
              onFocus={(e) => e.currentTarget.select()}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Descripción (opcional)</label>
            <Input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ej: retiro a proveedor / aporte a caja"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={() => onConfirm(amount, desc)} disabled={!canSave}>
            {loading ? "Guardando…" : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
