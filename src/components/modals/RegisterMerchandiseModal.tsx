import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface RegisterMerchandiseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MerchandiseItem {
  product: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export function RegisterMerchandiseModal({ open, onOpenChange }: RegisterMerchandiseModalProps) {
  const [supplier, setSupplier] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [items, setItems] = useState<MerchandiseItem[]>([]);
  const [currentItem, setCurrentItem] = useState<MerchandiseItem>({
    product: "",
    quantity: 1,
    unitPrice: 0,
    total: 0
  });
  const [notes, setNotes] = useState("");

  const suppliers = [
    "Distribuidora Norte S.A.",
    "Comercial Sur Ltda.",
    "Importadora Central",
    "Proveedores Unidos",
    "Distribuidora Este"
  ];

  const handleAddItem = () => {
    if (!currentItem.product || currentItem.quantity <= 0 || currentItem.unitPrice <= 0) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos del producto",
        variant: "destructive"
      });
      return;
    }

    const total = currentItem.quantity * currentItem.unitPrice;
    setItems([...items, { ...currentItem, total }]);
    setCurrentItem({
      product: "",
      quantity: 1,
      unitPrice: 0,
      total: 0
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!supplier || !invoiceNumber || items.length === 0) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    const total = items.reduce((sum, item) => sum + item.total, 0);
    
    toast({
      title: "Mercadería registrada",
      description: `Se registró la mercadería del proveedor ${supplier} por un total de $${total.toFixed(2)}`,
    });
    
    // Reset form
    setSupplier("");
    setInvoiceNumber("");
    setItems([]);
    setNotes("");
    onOpenChange(false);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Registrar Mercadería</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier">Proveedor</Label>
              <Select value={supplier} onValueChange={setSupplier}>
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((sup) => (
                    <SelectItem key={sup} value={sup}>{sup}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="invoice">Número de Factura</Label>
              <Input
                id="invoice"
                placeholder="Ej: FAC-001234"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
          </div>

          {/* Add Product Section */}
          <div className="border border-border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Agregar Producto</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="product">Producto</Label>
                <Input
                  id="product"
                  placeholder="Nombre del producto"
                  value={currentItem.product}
                  onChange={(e) => setCurrentItem({...currentItem, product: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={currentItem.quantity}
                  onChange={(e) => setCurrentItem({...currentItem, quantity: parseInt(e.target.value) || 1})}
                />
              </div>
              <div>
                <Label htmlFor="unitPrice">Precio Unitario</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentItem.unitPrice}
                  onChange={(e) => setCurrentItem({...currentItem, unitPrice: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddItem} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              </div>
            </div>
          </div>

          {/* Items Table */}
          {items.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-accent/50">
                  <tr>
                    <th className="text-left py-2 px-4 text-sm font-semibold">Producto</th>
                    <th className="text-center py-2 px-4 text-sm font-semibold">Cantidad</th>
                    <th className="text-right py-2 px-4 text-sm font-semibold">Precio Unit.</th>
                    <th className="text-right py-2 px-4 text-sm font-semibold">Total</th>
                    <th className="text-center py-2 px-4 text-sm font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-t border-border">
                      <td className="py-2 px-4 text-sm">{item.product}</td>
                      <td className="py-2 px-4 text-sm text-center">{item.quantity}</td>
                      <td className="py-2 px-4 text-sm text-right">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-2 px-4 text-sm text-right font-semibold">${item.total.toFixed(2)}</td>
                      <td className="py-2 px-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-border bg-accent/30">
                  <tr>
                    <td colSpan={3} className="py-3 px-4 text-right font-semibold">Total:</td>
                    <td className="py-3 px-4 text-right font-bold text-lg text-primary">${totalAmount.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Observaciones adicionales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            Registrar Mercadería
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}