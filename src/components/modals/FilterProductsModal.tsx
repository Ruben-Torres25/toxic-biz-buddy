import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X } from "lucide-react";

interface FilterProductsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilters: (filters: any) => void;
}

export function FilterProductsModal({ open, onOpenChange, onApplyFilters }: FilterProductsModalProps) {
  const [filters, setFilters] = useState({
    category: "all",
    stockStatus: "all",
    priceRange: "all",
    supplier: "all"
  });

  const handleApply = () => {
    onApplyFilters(filters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setFilters({
      category: "all",
      stockStatus: "all",
      priceRange: "all",
      supplier: "all"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filtrar Productos
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Select
              value={filters.category}
              onValueChange={(value) => setFilters({ ...filters, category: value })}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Limpieza">Limpieza</SelectItem>
                <SelectItem value="Desinfección">Desinfección</SelectItem>
                <SelectItem value="Papel">Papel</SelectItem>
                <SelectItem value="Químicos">Químicos</SelectItem>
                <SelectItem value="Accesorios">Accesorios</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stockStatus">Estado de stock</Label>
            <Select
              value={filters.stockStatus}
              onValueChange={(value) => setFilters({ ...filters, stockStatus: value })}
            >
              <SelectTrigger id="stockStatus">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="critical">Stock crítico</SelectItem>
                <SelectItem value="low">Stock bajo</SelectItem>
                <SelectItem value="normal">Stock normal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priceRange">Rango de precio</Label>
            <Select
              value={filters.priceRange}
              onValueChange={(value) => setFilters({ ...filters, priceRange: value })}
            >
              <SelectTrigger id="priceRange">
                <SelectValue placeholder="Todos los rangos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="0-50">€0 - €50</SelectItem>
                <SelectItem value="51-100">€51 - €100</SelectItem>
                <SelectItem value="101-200">€101 - €200</SelectItem>
                <SelectItem value="200+">Más de €200</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Proveedor</Label>
            <Select
              value={filters.supplier}
              onValueChange={(value) => setFilters({ ...filters, supplier: value })}
            >
              <SelectTrigger id="supplier">
                <SelectValue placeholder="Todos los proveedores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="CleanPro Supplies">CleanPro Supplies</SelectItem>
                <SelectItem value="Hygiene Solutions">Hygiene Solutions</SelectItem>
                <SelectItem value="EcoClean Dist.">EcoClean Dist.</SelectItem>
                <SelectItem value="Industrial Clean">Industrial Clean</SelectItem>
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