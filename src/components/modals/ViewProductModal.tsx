import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, CheckCircle } from "lucide-react";

interface Product {
  code: string;
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Detalles del Producto
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Código</p>
            <p className="font-semibold">{product.code}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Nombre</p>
            <p className="font-semibold">{product.name}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Categoría</p>
            <p className="font-semibold">{product.category}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Precio</p>
            <p className="font-semibold text-lg">${product.price.toFixed(2)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Stock Actual</p>
              <p className="font-semibold">{product.stock} unidades</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stock Mínimo</p>
              <p className="font-semibold">{product.minStock} unidades</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Estado</p>
            <div className="mt-1">{getStockStatus()}</div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Proveedor</p>
            <p className="font-semibold">{product.supplier}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}