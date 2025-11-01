import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { SuppliersAPI } from "@/services/suppliers.api";

interface NewSupplierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // onSuccess?: (created: any) => void; // opcional
}

export function NewSupplierModal({ open, onOpenChange /*, onSuccess*/ }: NewSupplierModalProps) {
  const { toast } = useToast();

  // Campos que SÍ persisten en tu DB
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [cuit, setCuit] = useState("");

  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // UI extra (no persiste por ahora)
  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [productsSupplied, setProductsSupplied] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName(""); setAlias(""); setCuit("");
    setContact(""); setAddress(""); setPhone(""); setEmail("");
    setPaymentTerms(""); setDeliveryTime(""); setProductsSupplied(""); setNotes("");
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: "Falta el nombre", description: "El campo Nombre es obligatorio.", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const created = await SuppliersAPI.create({
        name: name.trim(),
        alias: alias.trim() || null,
        cuit: cuit.trim() || null,
        contact: contact.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
      });

      toast({
        title: "Proveedor registrado",
        description: `Se creó: ${created?.name ?? "Proveedor"}`,
      });

      // onSuccess?.(created);
      onOpenChange(false); // SuppliersSection invalida la query al cerrar
      reset();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? "Error desconocido";
      toast({ title: "No se pudo registrar", description: String(msg), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
      {/* Contenedor: ancho responsivo, altura máx 92vh, flex col para fijar header/footer y hacer scroll solo en el body */}
      <DialogContent className="w-[96vw] max-w-3xl max-h-[92vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Nuevo Proveedor</DialogTitle>
        </DialogHeader>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-4">
          <div>
            <Label htmlFor="supplier-name">Nombre de la Empresa *</Label>
            <Input
              id="supplier-name"
              placeholder="Química Industrial S.A."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="alias">Alias (opcional)</Label>
              <Input
                id="alias"
                placeholder="QuimInd"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cuit">CUIT</Label>
              <Input
                id="cuit"
                placeholder="20-12345678-3"
                value={cuit}
                onChange={(e) => setCuit(e.target.value)}
              />
            </div>
          </div>

          {/* Campos que sí persisten */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact">Persona de Contacto</Label>
              <Input
                id="contact"
                placeholder="Juan Pérez"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="supplier-email">Email</Label>
              <Input
                id="supplier-email"
                type="email"
                placeholder="ventas@proveedor.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier-phone">Teléfono</Label>
              <Input
                id="supplier-phone"
                placeholder="021 123 456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="supplier-address">Dirección</Label>
              <Input
                id="supplier-address"
                placeholder="Av. Industrial 456, Ciudad"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          {/* UI extra (no se envía aún) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment-terms">Términos de Pago</Label>
              <Input
                id="payment-terms"
                placeholder="30 días"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="delivery-time">Tiempo de Entrega</Label>
              <Input
                id="delivery-time"
                placeholder="3-5 días"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="products-supplied">Productos que Suministra</Label>
            <Textarea
              id="products-supplied"
              placeholder="Detergentes, Desinfectantes, Jabones..."
              value={productsSupplied}
              onChange={(e) => setProductsSupplied(e.target.value)}
              className="min-h-[88px] max-h-[240px] resize-y"
            />
          </div>

          <div>
            <Label htmlFor="supplier-notes">Notas (Opcional)</Label>
            <Textarea
              id="supplier-notes"
              placeholder="Información adicional del proveedor..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[88px] max-h-[240px] resize-y"
            />
          </div>
        </div>

        {/* Footer fijo dentro del contenedor (no scrollea) */}
        <DialogFooter className="px-6 py-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Guardando..." : "Registrar Proveedor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
