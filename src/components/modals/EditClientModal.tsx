import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Customer } from "@/types/domain";

/* ==== Helpers (mismos que en NewClient) ==== */
const digitsOnly = (s: string) => s.replace(/\D+/g, "");
const lettersSpacesOnly = (s: string) =>
  s.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]+/g, "");
const cuitDigitsLen = 11;
const CUIT_REGEX = /^(?:\d{2}-?\d{8}-?\d)$/;
const formatCuitStrict = (raw: string) => {
  const d = digitsOnly(raw).slice(0, cuitDigitsLen);
  if (d.length <= 2) return d;
  if (d.length <= 10) return `${d.slice(0,2)}-${d.slice(2)}`;
  return `${d.slice(0,2)}-${d.slice(2,10)}-${d.slice(10)}`;
};
const iibbAllowed = (s: string) => s.replace(/[^A-Za-z0-9\-\/.\s]+/g, "");
const addressAllowed = (s: string) => s.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9°º#\-\/.,\s]+/g, "");
const clampLen = (s: string, max: number) => s.slice(0, max);

export interface EditClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Customer | null;
  onSave: (id: string, payload: Partial<Customer>) => Promise<void> | void;
}

export function EditClientModal({ open, onOpenChange, client, onSave }: EditClientModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [phone, setPhone] = useState("");
  const [phone2, setPhone2] = useState("");

  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");

  // fiscales
  const [showTax, setShowTax] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [cuit, setCuit] = useState("");
  const [vatStatus, setVatStatus] = useState<Customer["vatStatus"]>(undefined);
  const [iibb, setIibb] = useState("");
  const [fiscalAddress, setFiscalAddress] = useState("");
  const [afipCode, setAfipCode] = useState("");
  const [taxNotes, setTaxNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string,string>>({});

  // Precarga
  useEffect(() => {
    if (open && client) {
      setName(client.name ?? "");
      setEmail(client.email ?? "");
      setPhone(client.phone ?? "");
      setPhone2(client.phone2 ?? "");
      setAddress(client.address ?? "");
      setPostalCode(client.postalCode ?? "");
      setNotes(client.notes ?? "");

      setBusinessName(client.businessName ?? "");
      setCuit(client.cuit ?? "");
      setVatStatus(client.vatStatus ?? undefined);
      setIibb(client.iibb ?? "");
      setFiscalAddress(client.fiscalAddress ?? "");
      setAfipCode(client.afipCode ?? "");
      setTaxNotes(client.taxNotes ?? "");

      setShowTax(Boolean(client.businessName || client.cuit || client.vatStatus || client.iibb || client.fiscalAddress || client.afipCode || client.taxNotes));
      setErrors({});
      setLoading(false);
    }
    if (!open) {
      setErrors({});
      setLoading(false);
    }
  }, [open, client]);

  const emailValid = useMemo(() => {
    if (!email.trim()) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const cuitValid = useMemo(() => {
    if (!cuit.trim()) return true;
    return CUIT_REGEX.test(cuit.trim());
  }, [cuit]);

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && emailValid && cuitValid && !loading && !!client?.id;
  }, [name, emailValid, cuitValid, loading, client]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "El nombre es obligatorio.";
    if (email.trim() && !emailValid) e.email = "Email inválido.";
    if (phone && !/^[0-9]+$/.test(phone)) e.phone = "Solo números.";
    if (phone2 && !/^[0-9]+$/.test(phone2)) e.phone2 = "Solo números.";
    if (postalCode && !/^[0-9]+$/.test(postalCode)) e.postalCode = "Solo números.";
    if (cuit.trim() && !cuitValid) e.cuit = "CUIT inválido.";
    return e;
  };

  const handleSubmit = async () => {
    if (!client) return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const payload: Partial<Customer> = {
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      phone2: phone2.trim() || undefined,
      address: address.trim() || undefined,
      postalCode: postalCode.trim() || undefined,
      notes: notes.trim() || undefined,

      businessName: businessName.trim() || undefined,
      cuit: cuit.trim() ? formatCuitStrict(cuit.trim()) : undefined,
      vatStatus: vatStatus || undefined,
      iibb: iibb.trim() || undefined,
      fiscalAddress: fiscalAddress.trim() || undefined,
      afipCode: afipCode.trim() || undefined,
      taxNotes: taxNotes.trim() || undefined,
    };

    try {
      setLoading(true);
      await onSave(client.id, payload);
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
      <DialogContent onKeyDown={onKeyDown} className="w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              value={name}
              maxLength={80}
              onChange={(e)=>setName(lettersSpacesOnly(e.target.value))}
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
                maxLength={120}
                onChange={(e)=>setEmail(e.target.value.slice(0,120))}
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
                maxLength={10}
                onChange={(e)=>setPostalCode(digitsOnly(e.target.value))}
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
                maxLength={20}
                onChange={(e)=>setPhone(digitsOnly(e.target.value))}
              />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
            </div>
            <div>
              <Label htmlFor="phone2">Teléfono 2</Label>
              <Input
                id="phone2"
                inputMode="numeric"
                pattern="[0-9]*"
                value={phone2}
                maxLength={20}
                onChange={(e)=>setPhone2(digitsOnly(e.target.value))}
              />
              {errors.phone2 && <p className="text-xs text-destructive mt-1">{errors.phone2}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={address}
              maxLength={120}
              onChange={(e)=>setAddress(addressAllowed(e.target.value))}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notas</Label>
            <Input
              id="notes"
              value={notes}
              maxLength={200}
              onChange={(e)=>setNotes(e.target.value.slice(0,200))}
            />
          </div>

          {/* ===== Sección fiscal opcional ===== */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">Datos fiscales (opcional)</p>
              <Button type="button" variant="outline" size="sm" onClick={()=>setShowTax(s=>!s)}>
                {showTax ? "Ocultar" : "Ver/Editar"}
              </Button>
            </div>

            {showTax && (
              <div className="mt-3 space-y-3">
                <div>
                  <Label htmlFor="businessName">Razón social</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    maxLength={120}
                    onChange={(e)=>setBusinessName(lettersSpacesOnly(e.target.value))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cuit">CUIT/CUIL</Label>
                    <Input
                      id="cuit"
                      value={cuit}
                      placeholder="20-12345678-3"
                      maxLength={13}
                      onChange={(e)=>setCuit(formatCuitStrict(e.target.value))}
                    />
                    {errors.cuit && <p className="text-xs text-destructive mt-1">{errors.cuit}</p>}
                  </div>
                  <div>
                    <Label htmlFor="vatStatus">Cond. frente al IVA</Label>
                    <select
                      id="vatStatus"
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                      value={vatStatus ?? ""}
                      onChange={(e)=>setVatStatus((e.target.value || undefined) as any)}
                    >
                      <option value="">(sin especificar)</option>
                      <option value="RI">Responsable Inscripto</option>
                      <option value="MONO">Monotributo</option>
                      <option value="EXENTO">Exento</option>
                      <option value="CF">Consumidor Final</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="iibb">Ingresos Brutos</Label>
                    <Input
                      id="iibb"
                      value={iibb}
                      maxLength={40}
                      onChange={(e)=>setIibb(iibbAllowed(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="afipCode">Actividad / Código AFIP</Label>
                    <Input
                      id="afipCode"
                      value={afipCode}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      onChange={(e)=>setAfipCode(digitsOnly(e.target.value).slice(0,6))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="fiscalAddress">Domicilio fiscal</Label>
                  <Input
                    id="fiscalAddress"
                    value={fiscalAddress}
                    maxLength={120}
                    onChange={(e)=>setFiscalAddress(addressAllowed(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="taxNotes">Obs. fiscales</Label>
                  <Input
                    id="taxNotes"
                    value={taxNotes}
                    maxLength={200}
                    onChange={(e)=>setTaxNotes(clampLen(e.target.value, 200))}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={()=>onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>{loading ? "Guardando..." : "Guardar cambios"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
