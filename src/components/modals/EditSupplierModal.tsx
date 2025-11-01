import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Truck, Building2, User, MapPin, Phone, Mail, CreditCard, StickyNote, BadgeCheck } from "lucide-react";
import { SuppliersAPI } from "@/services/suppliers.api";
import { Switch } from "@/components/ui/switch";

type EditableSupplier = {
  id: string;
  name: string;
  alias?: string | null;
  cuit?: string | null;
  contact?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  active?: boolean | null; // ⇠ NUEVO
};

interface EditSupplierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Puede venir de la tabla normalizada (UISupplier)
  supplier: Partial<EditableSupplier> | null;
  onSave: (updated: EditableSupplier) => void; // el padre invalida cache
}

export function EditSupplierModal({ open, onOpenChange, supplier, onSave }: EditSupplierModalProps) {
  const [model, setModel] = useState<EditableSupplier | null>(null);
  const [saving, setSaving] = useState(false);

  // hidratar el formulario cuando cambie el supplier
  useEffect(() => {
    if (!supplier) {
      setModel(null);
      return;
    }
    setModel({
      id: String(supplier.id ?? ""),
      name: String(supplier.name ?? ""),
      alias: (supplier.alias ?? null) as string | null,
      cuit: (supplier.cuit ?? null) as string | null,
      contact: (supplier.contact ?? null) as string | null,
      address: (supplier.address ?? null) as string | null,
      phone: (supplier.phone ?? null) as string | null,
      email: (supplier.email ?? null) as string | null,
      notes: (supplier.notes ?? null) as string | null,
      active: typeof supplier.active === "boolean" ? supplier.active : true, // por defecto activo
    });
  }, [supplier]);

  if (!supplier || !model) return null;

  const set = <K extends keyof EditableSupplier>(key: K, value: EditableSupplier[K]) =>
    setModel((m) => (m ? { ...m, [key]: value } : m));

  const handleSave = async () => {
    if (!model.name.trim()) {
      toast({ title: "Falta el nombre", description: "El campo Nombre es obligatorio.", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const payload = {
        name: model.name.trim(),
        alias: model.alias?.trim?.() || null,
        cuit: model.cuit?.trim?.() || null,
        contact: model.contact?.trim?.() || null,
        phone: model.phone?.trim?.() || null,
        email: model.email?.trim?.() || null,
        address: model.address?.trim?.() || null,
        notes: model.notes?.trim?.() || null,
        active: !!model.active, // ⇠ enviar estado
      };
      const updated = await SuppliersAPI.update(model.id, payload);
      onSave(updated);
      toast({
        title: "Proveedor actualizado",
        description: `Se guardaron los cambios de “${updated?.name ?? model.name}”.`,
      });
      onOpenChange(false);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? "Error desconocido";
      toast({ title: "No se pudo actualizar", description: String(msg), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            Editar Proveedor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estado (activar / desactivar) */}
          <div className="flex items-center justify-between rounded-lg border p-3 bg-background/60">
            <div>
              <p className="text-sm font-medium">Estado del proveedor</p>
              <p className="text-xs text-muted-foreground">
                {model.active ? "El proveedor está activo y puede usarse en registros." : "Proveedor inactivo. No se sugerirá por defecto."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-medium px-2 py-1 rounded ${
                  model.active ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                }`}
              >
                {model.active ? "Activo" : "Inactivo"}
              </span>
              <Switch
                checked={!!model.active}
                onCheckedChange={(v) => set("active", Boolean(v))}
                disabled={saving}
                aria-label="Cambiar estado del proveedor"
              />
            </div>
          </div>

          {/* Información Principal */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                Nombre del Proveedor *
              </Label>
              <Input
                id="name"
                value={model.name}
                onChange={(e) => set("name", e.target.value)}
                className="bg-background"
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alias" className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-muted-foreground" />
                  Alias
                </Label>
                <Input
                  id="alias"
                  value={model.alias ?? ""}
                  onChange={(e) => set("alias", e.target.value)}
                  className="bg-background"
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cuit" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  CUIT
                </Label>
                <Input
                  id="cuit"
                  value={model.cuit ?? ""}
                  onChange={(e) => set("cuit", e.target.value)}
                  className="bg-background"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Información de Contacto */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact" className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Persona de Contacto
              </Label>
            <Input
                id="contact"
                value={model.contact ?? ""}
                onChange={(e) => set("contact", e.target.value)}
                className="bg-background"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Dirección
              </Label>
              <Input
                id="address"
                value={model.address ?? ""}
                onChange={(e) => set("address", e.target.value)}
                className="bg-background"
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  value={model.phone ?? ""}
                  onChange={(e) => set("phone", e.target.value)}
                  className="bg-background"
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={model.email ?? ""}
                  onChange={(e) => set("email", e.target.value)}
                  className="bg-background"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-muted-foreground" />
              Notas
            </Label>
            <Textarea
              id="notes"
              value={model.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              className="bg-background min-h-[80px]"
              disabled={saving}
              placeholder="Opcional"
            />
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
