import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Package, Tag, FolderOpen, DollarSign, Archive, Truck } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  supplier: string;
}

interface EditProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onSave: (product: Product) => void;
}

export function EditProductModal({ open, onOpenChange, product, onSave }: EditProductModalProps) {
  const [editedProduct, setEditedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (product) {
      setEditedProduct({ ...product });
    }
  }, [product]);

  if (!product || !editedProduct) return null;

  const handleSave = () => {
    if (editedProduct) {
      onSave(editedProduct);
      toast({
        title: "Producto actualizado",
        description: `El producto ${editedProduct.name} ha sido actualizado exitosamente.`,
      });
      onOpenChange(false);
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
            Editar Producto
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Información Principal */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="id" className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                Código
              </Label>
              <Input
                id="id"
                value={editedProduct.id}
                onChange={(e) => setEditedProduct({...editedProduct, id: e.target.value})}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                Nombre
              </Label>
              <Input
                id="name"
                value={editedProduct.name}
                onChange={(e) => setEditedProduct({...editedProduct, name: e.target.value})}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-muted-foreground" />
                Categoría
              </Label>
              <Select
                value={editedProduct.category}
                onValueChange={(value) => setEditedProduct({...editedProduct, category: value})}
              >
                <SelectTrigger id="category" className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Electrónica">Electrónica</SelectItem>
                  <SelectItem value="Ropa">Ropa</SelectItem>
                  <SelectItem value="Alimentos">Alimentos</SelectItem>
                  <SelectItem value="Hogar">Hogar</SelectItem>
                  <SelectItem value="Otros">Otros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Información Financiera */}
          <div className="space-y-2">
            <Label htmlFor="price" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              Precio
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={editedProduct.price}
              onChange={(e) => setEditedProduct({...editedProduct, price: parseFloat(e.target.value)})}
              className="bg-background"
            />
          </div>

          <Separator />

          {/* Información de Inventario */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock" className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-muted-foreground" />
                Stock
              </Label>
              <Input
                id="stock"
                type="number"
                value={editedProduct.stock}
                onChange={(e) => setEditedProduct({...editedProduct, stock: parseInt(e.target.value)})}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock" className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-muted-foreground" />
                Stock Mínimo
              </Label>
              <Input
                id="minStock"
                type="number"
                value={editedProduct.minStock}
                onChange={(e) => setEditedProduct({...editedProduct, minStock: parseInt(e.target.value)})}
                className="bg-background"
              />
            </div>
          </div>

          <Separator />

          {/* Información del Proveedor */}
          <div className="space-y-2">
            <Label htmlFor="supplier" className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-muted-foreground" />
              Proveedor
            </Label>
            <Input
              id="supplier"
              value={editedProduct.supplier}
              onChange={(e) => setEditedProduct({...editedProduct, supplier: e.target.value})}
              className="bg-background"
            />
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}