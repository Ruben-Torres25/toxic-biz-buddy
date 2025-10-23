// src/services/credit-notes.api.ts
// Mismo estilo que tus otros *.api.ts: usa el wrapper `api` y rutas relativas.

import { api } from "@/lib/api";

export type CreditNoteItemPayload = {
  productId: string;        // ID del producto
  description?: string;     // nombre/desc del producto (opcional)
  unitPrice: number;        // SIN IVA
  quantity: number;         // cantidad a devolver
  discount: number;         // $ sobre base sin IVA
  taxRate?: number;         // ej. 0.21 (opcional; default en backend)
};

export type CreateCreditNotePayload = {
  orderId: string;
  invoiceId?: string | null;
  customerId?: string | null;
  reason?: string;
  refundMethod: "cash" | "credit"; // "cash": egreso de caja, "credit": saldo a favor
  items: CreditNoteItemPayload[];
};

export type CreditNoteDTO = {
  id: string;
  number?: string | null;
  subtotal: number;    // sin IVA (negativo en contabilidad)
  iva: number;         // negativo
  total: number;       // con IVA (negativo)
  status: "created" | "authorized" | "canceled";
  createdAt: string;
};

export class CreditNotesAPI {
  static create(payload: CreateCreditNotePayload): Promise<CreditNoteDTO> {
    // Ruta relativa; tu wrapper `api` ya agrega /api si corresponde
    return api.post<CreditNoteDTO>("/credit-notes", payload);
  }
}
