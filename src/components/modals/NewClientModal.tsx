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

export type NewClientPayload = {
  name: string;
  email?: string;
  phone?: string;      // solo números
  phone2?: string;     // solo números (opcional)
  address?: string;
  postalCode?: string; // solo números (opcional)
  notes?: string;
};

export interface NewClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: NewClientPayload) => Promise<void> | void;
}

const onlyDigits = (s: string) => s.replace(/\D+/g, "");

export function NewClientModal({
  open,
  onOpenChange,
  onCreate,
}: NewClientModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");     // numérico
  const [phone2, setPhone2] = useState("");   // numérico
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState(""); // numérico
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  useEffect(() => {
    if (!open) {
      setName(""); setEmail(""); setPhone(""); setPhone2("");
      setAddress(""); setPostalCode(""); setNotes("");
      setErrors({}); setLoading(false);
    }
  }, [open]);

  const emailValid = useMemo(() => {
    if (!email.trim()) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && emailValid && !loading;
  }, [name, emailValid, loading]);

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
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const payload: NewClientPayload = {
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      phone2: phone2.trim() || undefined,
      address: address.trim() || undefined,
      postalCode: postalCode.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      setLoading(true);
      await onCreate(payload);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onKeyDown={onKeyDown} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              autoFocus
              placeholder="Juan Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="cliente@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="postalCode">Código Postal</Label>
              <Input
                id="postalCode"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="5000"
                value={postalCode}
                onChange={(e) => setPostalCode(onlyDigits(e.target.value))}
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
                placeholder="3510000000"
                value={phone}
                onChange={(e) => setPhone(onlyDigits(e.target.value))}
              />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
            </div>
            <div>
              <Label htmlFor="phone2">Teléfono 2 (opcional)</Label>
              <Input
                id="phone2"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="3510000000"
                value={phone2}
                onChange={(e) => setPhone2(onlyDigits(e.target.value))}
              />
              {errors.phone2 && <p className="text-xs text-destructive mt-1">{errors.phone2}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              placeholder="Av. Principal 123"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notas</Label>
            <Input
              id="notes"
              placeholder="Información adicional"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {loading ? "Creando..." : "Crear cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
