import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  phone2?: string | null;
  address?: string | null;
  postalCode?: string | null;
  notes?: string | null;
  // otros campos de UI (orders/lastOrder) pueden existir, pero no son necesarios aquí
};

export interface EditClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onSave: (
    id: string,
    payload: {
      name?: string;
      phone?: string;
      phone2?: string;
      email?: string;
      address?: string;
      postalCode?: string;
      notes?: string;
    }
  ) => void | Promise<void>;
}

const onlyDigits = (s: string) => s.replace(/\D+/g, "");

export function EditClientModal({
  open,
  onOpenChange,
  client,
  onSave,
}: EditClientModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phone2, setPhone2] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  // Precargar valores del cliente al abrir
  useEffect(() => {
    if (client && open) {
      setName(client.name ?? "");
      setEmail(client.email ?? "");
      setPhone(client.phone ?? "");
      setPhone2(client.phone2 ?? "");
      setAddress(client.address ?? "");
      setPostalCode(client.postalCode ?? "");
      setNotes(client.notes ?? "");
      setErrors({});
      setLoading(false);
    }
    if (!open) {
      // opcional: limpiar al cerrar
      setErrors({});
      setLoading(false);
    }
  }, [client, open]);

  const emailValid = useMemo(() => {
    if (!email.trim()) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && emailValid && !!client && !loading;
  }, [name, emailValid, client, loading]);

  const validate = () => {
    const e: { [k: string]: string } = {};
    if (!name.trim()) e.name = "El nombre es obligatorio.";
    if (email.trim() && !emailValid) e.email = "Email inválido.";
    if (phone && !/^[0-9]+$/.test(phone)) e.phone = "Solo números.";
    if (phone2 && !/^[0-9]+$/.test(phone2)) e.phone2 = "Solo números.";
    if (postalCode && !/^[0-9]+$/.test(postalCode)) e.postalCode = "Solo números.";
    return e;
  };

  const handleSubmit = async () => {
    if (!client) return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    try {
      setLoading(true);
      await onSave(client.id, {
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        phone2: phone2.trim() || undefined,
        address: address.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (ev: React.KeyboardEvent) => {
    if (ev.key === "Enter" && canSubmit) {
      ev.preventDefault();
      handleSubmit();
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onKeyDown={onKeyDown} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan Pérez"
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@correo.com"
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="postalCode">Código Postal</Label>
              <Input
                id="postalCode"
                inputMode="numeric"
                pattern="[0-9]*"
                value={postalCode}
                onChange={(e) => setPostalCode(onlyDigits(e.target.value))}
                placeholder="5000"
              />
              {errors.postalCode && <p className="text-xs text-destructive mt-1">{errors.postalCode}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Teléfono 1</Label>
              <Input
                id="phone"
                inputMode="numeric"
                pattern="[0-9]*"
                value={phone}
                onChange={(e) => setPhone(onlyDigits(e.target.value))}
                placeholder="3510000000"
              />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
            </div>
            <div>
              <Label htmlFor="phone2">Teléfono 2 (opcional)</Label>
              <Input
                id="phone2"
                inputMode="numeric"
                pattern="[0-9]*"
                value={phone2}
                onChange={(e) => setPhone2(onlyDigits(e.target.value))}
                placeholder="3510000000"
              />
              {errors.phone2 && <p className="text-xs text-destructive mt-1">{errors.phone2}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Av. Principal 123"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notas</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Información adicional"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
