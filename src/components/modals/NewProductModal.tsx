import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface NewProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewProductModal({ open, onOpenChange }: NewProductModalProps) {
  const { toast } = useToast();

  const handleSubmit = () => {
    toast({
      title: "Producto Agregado",
      description: "El producto ha sido registrado en el inventario.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo Producto</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="product-name">Nombre del Producto</Label>
            <Input id="product-name" placeholder="Detergente Industrial" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Categoría</Label>
              <Select>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="detergentes">Detergentes</SelectItem>
                  <SelectItem value="desinfectantes">Desinfectantes</SelectItem>
                  <SelectItem value="jabones">Jabones</SelectItem>
                  <SelectItem value="accesorios">Accesorios</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="unit">Unidad</Label>
              <Select>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="litros">Litros</SelectItem>
                  <SelectItem value="unidades">Unidades</SelectItem>
                  <SelectItem value="kilos">Kilos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="purchase-price">Precio Compra</Label>
              <Input id="purchase-price" type="number" placeholder="50.00" />
            </div>
            <div>
              <Label htmlFor="sale-price">Precio Venta</Label>
              <Input id="sale-price" type="number" placeholder="85.00" />
            </div>
            <div>
              <Label htmlFor="margin">Margen %</Label>
              <Input id="margin" type="number" placeholder="70" disabled />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="stock">Stock Inicial</Label>
              <Input id="stock" type="number" placeholder="50" />
            </div>
            <div>
              <Label htmlFor="min-stock">Stock Mínimo</Label>
              <Input id="min-stock" type="number" placeholder="10" />
            </div>
            <div>
              <Label htmlFor="max-stock">Stock Máximo</Label>
              <Input id="max-stock" type="number" placeholder="200" />
            </div>
          </div>

          <div>
            <Label htmlFor="supplier">Proveedor</Label>
            <Select>
              <SelectTrigger id="supplier">
                <SelectValue placeholder="Seleccionar proveedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Química Industrial S.A.</SelectItem>
                <SelectItem value="2">Distribuidora del Sur</SelectItem>
                <SelectItem value="3">Productos Químicos ABC</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Textarea id="description" placeholder="Descripción del producto..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Agregar Producto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}