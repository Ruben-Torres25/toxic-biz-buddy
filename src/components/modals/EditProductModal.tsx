import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

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
          <DialogTitle>Editar Producto</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="id">Código</Label>
            <Input
              id="id"
              value={editedProduct.id}
              onChange={(e) => setEditedProduct({...editedProduct, id: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={editedProduct.name}
              onChange={(e) => setEditedProduct({...editedProduct, name: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="category">Categoría</Label>
            <Select
              value={editedProduct.category}
              onValueChange={(value) => setEditedProduct({...editedProduct, category: value})}
            >
              <SelectTrigger id="category">
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

          <div>
            <Label htmlFor="price">Precio</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={editedProduct.price}
              onChange={(e) => setEditedProduct({...editedProduct, price: parseFloat(e.target.value)})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={editedProduct.stock}
                onChange={(e) => setEditedProduct({...editedProduct, stock: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <Label htmlFor="minStock">Stock Mínimo</Label>
              <Input
                id="minStock"
                type="number"
                value={editedProduct.minStock}
                onChange={(e) => setEditedProduct({...editedProduct, minStock: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="supplier">Proveedor</Label>
            <Input
              id="supplier"
              value={editedProduct.supplier}
              onChange={(e) => setEditedProduct({...editedProduct, supplier: e.target.value})}
            />
          </div>
        </div>

        <DialogFooter>
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