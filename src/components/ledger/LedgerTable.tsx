import { useMemo } from "react";
import { LedgerEntry } from "@/services/ledger.api";
import { Button } from "@/components/ui/button";

const moneyFmt = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });

export function LedgerTable({
  data, page, pageSize, total, onPageChange, loading
}: {
  data: LedgerEntry[];
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  loading?: boolean;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const rows = data;

  const pager = useMemo(() => (
    <div className="flex items-center justify-end gap-2 p-2">
      <Button size="sm" variant="outline" onClick={() => onPageChange(1)} disabled={page <= 1}>«</Button>
      <Button size="sm" variant="outline" onClick={() => onPageChange(page-1)} disabled={page <= 1}>‹</Button>
      <div className="text-sm">Página {page} / {pages}</div>
      <Button size="sm" variant="outline" onClick={() => onPageChange(page+1)} disabled={page >= pages}>›</Button>
      <Button size="sm" variant="outline" onClick={() => onPageChange(pages)} disabled={page >= pages}>»</Button>
    </div>
  ), [page, pages, onPageChange]);

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
            <tr className="border-b">
              <th className="text-left p-2">Fecha</th>
              <th className="text-left p-2">Cliente</th>
              <th className="text-left p-2">Tipo</th>
              <th className="text-left p-2">Documento</th>
              <th className="text-right p-2">Importe</th>
            </tr>
          </thead>
          <tbody className="[&>tr:nth-child(even)]:bg-muted/20">
            {rows.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">{loading ? "Cargando..." : "Sin movimientos"}</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-b-0">
                <td className="p-2 align-middle">{new Date(r.date).toLocaleString()}</td>
                <td className="p-2 align-middle">{r.customerId ?? "—" /* opcional: mostrar nombre si viene */}</td>
                <td className="p-2 align-middle">{r.type}</td>
                <td className="p-2 align-middle">{r.sourceType} #{r.sourceId.slice(0, 8)}</td>
                <td className="p-2 align-middle text-right tabular-nums">{moneyFmt.format(Number(r.amount))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pager}
    </div>
  );
}
