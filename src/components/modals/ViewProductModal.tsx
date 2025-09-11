import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, AlertTriangle, CheckCircle, Tag, FolderOpen, DollarSign, Archive, Truck } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  supplier: string;
}

interface ViewProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function ViewProductModal({ open, onOpenChange, product }: ViewProductModalProps) {
  if (!product) return null;

  const getStockStatus = () => {
    if (product.stock === 0) {
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">
        <AlertTriangle className="w-3 h-3 mr-1" />Sin Stock
      </Badge>;
    } else if (product.stock <= product.minStock) {
      return <Badge className="bg-warning/10 text-warning border-warning/20">
        <AlertTriangle className="w-3 h-3 mr-1" />Stock Bajo
      </Badge>;
    } else {
      return <Badge className="bg-success/10 text-success border-success/20">
        <CheckCircle className="w-3 h-3 mr-1" />Disponible
      </Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="w-5 h-5 text-primary" />
            </div>
            Detalles del Producto
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Información Principal */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Tag className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Código</p>
                <p className="font-semibold">{product.id}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Package className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Nombre</p>
                <p className="font-semibold">{product.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FolderOpen className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Categoría</p>
                <p className="font-semibold">{product.category}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Información Financiera */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Precio</p>
                <p className="font-semibold text-xl text-primary">${product.price.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Información de Inventario */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Archive className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Stock Actual</p>
                  <p className="font-semibold">{product.stock} unidades</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Stock Mínimo</p>
                  <p className="font-semibold">{product.minStock} unidades</p>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm font-medium">Estado del Inventario</span>
              {getStockStatus()}
            </div>
          </div>

          <Separator />

          {/* Información del Proveedor */}
          <div className="flex items-start gap-3">
            <Truck className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Proveedor</p>
              <p className="font-semibold">{product.supplier}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}