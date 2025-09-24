import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X } from "lucide-react";

interface FilterClientsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: any) => void;
}

export function FilterClientsModal({ open, onOpenChange, onApplyFilters }: FilterClientsModalProps) {
  const [filters, setFilters] = useState({
    name: "",
    city: "",
    balanceType: "all",
    orderRange: "all"
  });

  const handleApply = () => {
    onApplyFilters(filters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setFilters({
      name: "",
      city: "",
      balanceType: "all",
      orderRange: "all"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filtrar Clientes
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del cliente</Label>
            <Input
              id="name"
              placeholder="Buscar por nombre..."
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <Select
              value={filters.city}
              onValueChange={(value) => setFilters({ ...filters, city: value })}
            >
              <SelectTrigger id="city">
                <SelectValue placeholder="Todas las ciudades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="Madrid">Madrid</SelectItem>
                <SelectItem value="Barcelona">Barcelona</SelectItem>
                <SelectItem value="Valencia">Valencia</SelectItem>
                <SelectItem value="Sevilla">Sevilla</SelectItem>
                <SelectItem value="Bilbao">Bilbao</SelectItem>
                <SelectItem value="Málaga">Málaga</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="balanceType">Estado de cuenta</Label>
            <Select
              value={filters.balanceType}
              onValueChange={(value) => setFilters({ ...filters, balanceType: value })}
            >
              <SelectTrigger id="balanceType">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="positive">Saldo a favor</SelectItem>
                <SelectItem value="negative">Con deuda</SelectItem>
                <SelectItem value="zero">Sin saldo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="orderRange">Cantidad de pedidos</Label>
            <Select
              value={filters.orderRange}
              onValueChange={(value) => setFilters({ ...filters, orderRange: value })}
            >
              <SelectTrigger id="orderRange">
                <SelectValue placeholder="Todos los rangos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="0-5">0-5 pedidos</SelectItem>
                <SelectItem value="6-10">6-10 pedidos</SelectItem>
                <SelectItem value="11-20">11-20 pedidos</SelectItem>
                <SelectItem value="20+">Más de 20 pedidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            <X className="w-4 h-4 mr-2" />
            Limpiar
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleApply}>
            Aplicar Filtros
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
