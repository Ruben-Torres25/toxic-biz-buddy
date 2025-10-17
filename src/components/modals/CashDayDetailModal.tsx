import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Eye, Wallet, Landmark, Banknote, RotateCcw } from "lucide-react";
import { SaleDetailModal } from "@/components/modals/SaleDetailModal";

/** Tipos de movimiento admitidos por caja */
type MovementKind = "open" | "close" | "income" | "expense" | "sale";

/** Entrada que recibimos para mostrar en el modal del día */
export type CashDayMovement = {
  id: string;
  type: MovementKind;
  description?: string | null;
  amount: number;
  createdAt: string;
  occurredAt?: string | null;

  /** 👇 Debe venir en movimientos de tipo 'sale' */
  saleId?: string | null;

  /** Cliente (si aplica) */
  customerId?: string | null;
  customerName?: string | null;

  /** Info opcional */
  paymentsBreakdown?: Partial<Record<"cash" | "debit" | "credit" | "transfer", number>>;
  itemsCount?: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateLabel: string; // "10/10/2025"
  movements: CashDayMovement[];
};

const moneyFmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

function kindIcon(kind: MovementKind) {
  if (kind === "open" || kind === "close") return Wallet;
  if (kind === "sale") return Landmark;
  if (kind === "income") return Banknote;
  return RotateCcw; // expense
}

function kindLabel(kind: MovementKind) {
  return kind === "open"
    ? "Apertura"
    : kind === "close"
    ? "Cierre"
    : kind === "sale"
    ? "Venta"
    : kind === "income"
    ? "Ingreso"
    : "Egreso";
}

export const CashDayDetailModal: React.FC<Props> = ({
  open,
  onOpenChange,
  dateLabel,
  movements,
}) => {
  // Modal de detalle de venta
  const [saleModalOpen, setSaleModalOpen] = React.useState(false);
  const [selectedSaleId, setSelectedSaleId] = React.useState<string | null>(null);

  function openSaleDetailFor(m: CashDayMovement) {
    if (m.type !== "sale" || !m.saleId) return;
    setSelectedSaleId(m.saleId);
    setSaleModalOpen(true);
  }

  // resumen cabecera
  const { openAmt, closeAmt, sales, income, expense } = React.useMemo(() => {
    let openAmt = 0, closeAmt = 0, income = 0, expense = 0, sales = 0;
    for (const m of movements) {
      if (m.type === "open") openAmt = Number(m.amount || 0);
      else if (m.type === "close") closeAmt = Number(m.amount || 0);
      else if (m.type === "income") income += Number(m.amount || 0);
      else if (m.type === "expense") expense += Math.abs(Number(m.amount || 0));
      else if (m.type === "sale") sales += Number(m.amount || 0);
    }
    return { openAmt, closeAmt, income, expense, sales };
  }, [movements]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[96vw] sm:max-w-4xl md:max-w-5xl p-0" aria-describedby={undefined}>
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Ventas y Movimientos — {dateLabel}</DialogTitle>
          </DialogHeader>

          {/* resumen del día */}
          <div className="px-6 pb-3">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm">
              <InfoTile name="Apertura" value={moneyFmt.format(openAmt)} />
              <InfoTile name="Ventas" value={moneyFmt.format(sales)} />
              <InfoTile name="Ingresos" value={moneyFmt.format(income)} />
              <InfoTile name="Egresos" value={moneyFmt.format(expense)} />
              <InfoTile
                name="Saldo calc."
                value={moneyFmt.format(openAmt + sales + income - expense)}
              />
              <InfoTile
                name="Cierre"
                value={closeAmt ? moneyFmt.format(closeAmt) : "—"}
              />
            </div>
          </div>

          {/* tabla */}
          <div className="px-6 pb-6">
            <div className="border rounded-md overflow-hidden">
              <div className="grid grid-cols-12 text-xs text-muted-foreground px-3 py-2 border-b bg-muted/40">
                <div className="col-span-2">Hora</div>
                <div className="col-span-2">Tipo</div>
                <div className="col-span-3 truncate">Descripción</div>
                <div className="col-span-3 truncate">Cliente</div>
                <div className="col-span-1 text-right">Monto</div>
                <div className="col-span-1 text-center">Detalle</div>
              </div>

              <ScrollArea className="max-h-[55vh]">
                {movements.map((m) => {
                  const Icon = kindIcon(m.type);
                  const date = new Date(m.occurredAt || m.createdAt);
                  const hh = String(date.getHours()).padStart(2, "0");
                  const mm = String(date.getMinutes()).padStart(2, "0");
                  const isSale = m.type === "sale";
                  const canOpen = isSale && !!m.saleId;

                  return (
                    <div key={m.id} className="grid grid-cols-12 items-center px-3 py-2 border-b hover:bg-accent/30 text-sm">
                      <div className="col-span-2 tabular-nums">{hh}:{mm}</div>
                      <div className="col-span-2 flex items-center gap-2">
                        <Icon className={cn("w-4 h-4", isSale ? "text-emerald-600" : m.type === "income" ? "text-emerald-500" : m.type === "expense" ? "text-red-500" : "text-primary")} />
                        <span>{kindLabel(m.type)}</span>
                      </div>
                      <div className="col-span-3 text-muted-foreground truncate">
                        {m.description || "—"}
                      </div>
                      <div className="col-span-3 truncate">
                        {m.customerName || "Consumidor final"}
                      </div>
                      <div className="col-span-1 text-right tabular-nums">
                        {moneyFmt.format(Number(m.amount || 0))}
                      </div>
                      <div className="col-span-1 text-center">
                        {isSale ? (
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => openSaleDetailFor(m)}
                            disabled={!canOpen}
                            title={
                              canOpen
                                ? "Ver productos de la venta"
                                : "Falta saleId en este movimiento (ajustá el backend)"
                            }
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {movements.length === 0 && (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No hay movimientos registrados en este día.
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de detalle de venta */}
      <SaleDetailModal
        open={saleModalOpen}
        onOpenChange={setSaleModalOpen}
        saleId={selectedSaleId}
      />
    </>
  );
};

function InfoTile({ name, value }: { name: string; value: string }) {
  return (
    <div className="rounded-md border p-2 flex flex-col gap-1">
      <span className="text-[11px] text-muted-foreground">{name}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
