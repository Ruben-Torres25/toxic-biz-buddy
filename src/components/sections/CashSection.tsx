import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { CashAPI, CashCurrent } from "@/services/cash.api";
import type { CashMovement } from "@/types/domain";
import {
  AlertCircle,
  CreditCard,
  TrendingUp,
  TrendingDown,
  History,
  PiggyBank,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function CashSection() {
  const queryClient = useQueryClient();

  const [movType, setMovType] = useState<"deposit" | "withdrawal">("deposit");
  const [movAmount, setMovAmount] = useState<string>("");
  const [movDesc, setMovDesc] = useState<string>("");
  const [openAmount, setOpenAmount] = useState<string>("0");

  // Traemos todo desde /cash/current (incluye isOpen)
  const {
    data: current,
    isLoading: loadingCurrent,
    refetch: refetchCurrent,
  } = useQuery<CashCurrent>({
    queryKey: ["cash", "current"],
    queryFn: () => CashAPI.current(),
    retry: 1,
  });

  const { data: movements = [], isLoading: loadingMovs } = useQuery<CashMovement[]>({
    queryKey: ["cash", "movements"],
    queryFn: () => CashAPI.movements(),
    retry: 1,
  });

  const isOpen = current?.isOpen;

  const addMovement = useMutation({
    mutationFn: (p: { amount: number; type: string; description: string }) => CashAPI.movement(p as any),
    onSuccess: async () => {
      toast({ title: "Movimiento registrado" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cash", "current"] }),
        queryClient.invalidateQueries({ queryKey: ["cash", "movements"] }),
      ]);
      setMovAmount("");
      setMovDesc("");
    },
    onError: (e: any) => {
      toast({
        title: "No se pudo registrar el movimiento",
        description: e?.message ?? "Error desconocido",
        variant: "destructive",
      });
    },
  });

  const openCash = useMutation({
    mutationFn: (amount: number) => CashAPI.open(amount),
    onSuccess: async () => {
      toast({ title: "Caja abierta" });
      await refetchCurrent();
    },
    onError: (e: any) => {
      toast({
        title: "No se pudo abrir la caja",
        description: e?.message ?? "Error",
        variant: "destructive",
      });
    },
  });

  const closeCash = useMutation({
    mutationFn: (amount: number) => CashAPI.close(amount),
    onSuccess: async () => {
      toast({ title: "Caja cerrada" });
      await refetchCurrent();
    },
    onError: (e: any) => {
      toast({
        title: "No se pudo cerrar la caja",
        description: e?.message ?? "Error",
        variant: "destructive",
      });
    },
  });

  const n = (v: any) => Number(v ?? 0);
  const fmt = (v: any) => n(v).toLocaleString("es-AR", { style: "currency", currency: "ARS" });

  const openingAmount = n(current?.openingAmount);
  const totalIncome = n(current?.totalIncome);
  const totalExpense = n(current?.totalExpense);
  const totalSales = n(current?.totalSales);
  const balance = n(current?.balance);

  const calcOpening = balance - totalIncome + totalExpense - totalSales;
  const showCalcOpening = openingAmount === 0 && Math.abs(calcOpening) > 0.0001;

  const sortedMovs = useMemo(() => {
    const arr = Array.isArray(movements) ? movements : [];
    return [...arr].sort((a: any, b: any) => {
      const da = new Date(a.createdAt).getTime() || 0;
      const db = new Date(b.createdAt).getTime() || 0;
      return db - da;
    });
  }, [movements]);

  useEffect(() => {
    if (!isNaN(balance)) setOpenAmount(String(balance));
  }, [balance]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Caja</h1>
            <p className="text-muted-foreground">Apertura, cierre y movimientos del día</p>
          </div>
          <StatusChip isOpen={isOpen} />
        </div>

        <div className="flex gap-2">
          {isOpen === true ? (
            <Button
              onClick={() => closeCash.mutate(balance)}
              variant="secondary"
              disabled={closeCash.isPending}
            >
              <ArrowUpFromLine className="w-4 h-4 mr-2" />
              Cerrar caja
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                className="w-28"
                type="number"
                step="1"
                value={openAmount}
                onChange={(e) => setOpenAmount(e.target.value)}
                placeholder="Monto"
              />
              <Button
                onClick={() => openCash.mutate(Number(openAmount || 0))}
                variant="default"
                disabled={openCash.isPending}
              >
                <ArrowDownToLine className="w-4 h-4 mr-2" />
                Abrir caja
              </Button>
            </div>
          )}
        </div>
      </div>

      {isOpen === false && (
        <div className={cn("border border-amber-300/60 bg-amber-50 text-amber-900 p-3 rounded-xl flex items-center gap-2")}>
          <AlertCircle className="w-4 h-4" />
          <span>La caja está <b>cerrada</b>. Abrila para poder confirmar pedidos y registrar ventas.</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Resumen del día</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCurrent ? (
            <div className="text-sm text-muted-foreground">Cargando resumen…</div>
          ) : current ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Kpi label="Fecha" value={current.date ?? "—"} />
              <Kpi
                label="Apertura"
                value={fmt(openingAmount)}
                hint={showCalcOpening ? `Apertura calculada: ${fmt(calcOpening)}` : undefined}
                emphasis={showCalcOpening}
                extraBadge={showCalcOpening ? "calculada" : undefined}
              />
              <Kpi label="Ingresos" value={fmt(totalIncome)} />
              <Kpi label="Egresos" value={fmt(totalExpense)} />
              <Kpi label="Ventas" value={fmt(totalSales)} />
              <Kpi label="Balance" value={fmt(balance)} emphasis />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Sin datos.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Movimiento manual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={movType === "deposit" ? "default" : "outline"}
                onClick={() => setMovType("deposit")}
                className="gap-2"
              >
                <TrendingUp className="w-4 h-4" /> Ingreso
              </Button>
              <Button
                type="button"
                variant={movType === "withdrawal" ? "default" : "outline"}
                onClick={() => setMovType("withdrawal")}
                className="gap-2"
              >
                <TrendingDown className="w-4 h-4" /> Egreso
              </Button>
            </div>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="Monto"
              className="md:w-40"
              value={movAmount}
              onChange={(e) => setMovAmount(e.target.value)}
            />
            <Input
              type="text"
              placeholder="Descripción"
              className="flex-1"
              value={movDesc}
              onChange={(e) => setMovDesc(e.target.value)}
            />
            <Button
              onClick={() => {
                const val = Number(movAmount);
                if (!val || val <= 0) {
                  toast({ title: "Ingresá un monto válido", variant: "destructive" });
                  return;
                }
                const kind = movType === "withdrawal" ? "expense" : "income";
                addMovement.mutate({
                  amount: val,
                  type: kind,
                  description: movDesc || (kind === "income" ? "Ingreso manual" : "Egreso manual"),
                });
              }}
              className="md:w-40"
              disabled={addMovement.isPending}
            >
              {movType === "deposit" ? <PiggyBank className="w-4 h-4 mr-2" /> : <History className="w-4 h-4 mr-2" />}
              Registrar
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            Tip: podés usar valores negativos solo para egresos. Para ingresos, el monto debe ser positivo.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMovs ? (
            <div className="text-sm text-muted-foreground">Cargando movimientos…</div>
          ) : sortedMovs.length === 0 ? (
            <div className="text-sm text-muted-foreground">Aún no hay movimientos.</div>
          ) : (
            <div className="space-y-2">
              {sortedMovs.map((m) => {
                const isOut = m.type === "expense";
                const sign = isOut ? "-" : "+";
                const icon = isOut ? (
                  <TrendingDown className="w-4 h-4" />
                ) : m.type === "sale" ? (
                  <CreditCard className="w-4 h-4" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                );
                const when = new Date(m.createdAt).toLocaleString();

                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between border rounded-xl p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          isOut ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                        )}
                      >
                        {icon}
                      </div>
                      <div>
                        <div className="font-medium">{m.description}</div>
                        <div className="text-xs text-muted-foreground">{when}</div>
                      </div>
                    </div>
                    <div className={cn("font-semibold", isOut ? "text-red-700" : "text-emerald-700")}>
                      {sign}
                      {n(Math.abs(Number(m.amount))).toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  label,
  value,
  emphasis = false,
  hint,
  extraBadge,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  hint?: string;
  extraBadge?: string;
}) {
  return (
    <div className={cn("p-3 border rounded-xl relative", emphasis ? "bg-primary/5" : "")}>
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{label}</div>
        {extraBadge && (
          <Badge className="text-[10px] py-0 px-1.5 bg-primary/10 text-primary border-primary/20">
            {extraBadge}
          </Badge>
        )}
      </div>
      <div className={cn("text-lg font-semibold", emphasis ? "text-primary" : "text-foreground")}>
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>
      )}
    </div>
  );
}

function StatusChip({ isOpen }: { isOpen?: boolean }) {
  if (isOpen === true) {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
        • Caja abierta
      </Badge>
    );
  }
  if (isOpen === false) {
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
        • Caja cerrada
      </Badge>
    );
  }
  return (
    <Badge className="bg-slate-100 text-slate-700 border-slate-200">
      • Estado desconocido
    </Badge>
  );
}

export default CashSection;
