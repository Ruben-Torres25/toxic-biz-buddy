export type PaymentMethod = 'cash' | 'debit' | 'credit' | 'transfer';

export type CartLine = {
  productId: string;
  sku?: string;
  name: string;
  price: number;
  qty: number;
  discount?: number; // en $
};

export type Payment = {
  method: PaymentMethod;
  amount: number;
};

export type SaleCreateDTO = {
  items: { productId: string; qty: number; price: number; discount?: number }[];
  payments: { method: PaymentMethod; amount: number }[];
  notes?: string;
};

export type CashSession = {
  id: string;
  openedAt: string;
  closedAt?: string | null;
  openingAmount: number;
  closingExpected?: number | null;
  closingCounted?: number | null;
  diff?: number | null;
};
