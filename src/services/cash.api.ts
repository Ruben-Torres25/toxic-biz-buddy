// src/services/cash.api.ts
import { api } from "@/lib/api";

export type MovementKind = "income" | "expense" | "sale";
export type PaymentMethod = "cash" | "debit" | "credit" | "transfer";

export type CashSummary = {
  date: string;
  openingAmount: number;
  closingAmount: number;
  totalIncome: number;
  totalExpense: number;
  totalSales: number;
  balance: number;
  isOpen: boolean;
};

export type CheckoutItem = {
  productId: string;
  qty: number;
  price?: number;
  discount?: number; // descuento absoluto por unidad
};

export type CheckoutPayment = {
  method: PaymentMethod;
  amount: number;
};

export type CheckoutPayload = {
  items: CheckoutItem[];
  payments: CheckoutPayment[];
  discountGlobal?: number;
  notes?: string;
};

export type CashMovementDTO = {
  amount: number;
  type: MovementKind;
  description: string;
  createdAt?: string;
};

export class CashAPI {
  static current(): Promise<CashSummary> {
    return api.get<CashSummary>("/cash/current");
  }
  static open(openingAmount: number): Promise<CashSummary> {
    return api.post<CashSummary>("/cash/open", { openingAmount });
  }
  static close(closingAmount: number): Promise<CashSummary> {
    return api.post<CashSummary>("/cash/close", { closingAmount });
  }
  static movements() {
    return api.get<any[]>("/cash/movements");
  }
  static history(days = 7) {
    return api.get<any[]>("/cash/history", { days });
  }
  static movement(body: CashMovementDTO) {
    return api.post("/cash/movement", body);
  }
  static checkout(payload: CheckoutPayload) {
    return api.post("/cash/checkout", payload);
  }
}
