// src/services/ledger.api.ts
import { api } from '@/lib/api';

export type LedgerFilters = {
  from?: string;
  to?: string;
  type?: 'order' | 'payment' | 'credit_note' | 'adjustment';
  customerId?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

export type LedgerEntry = {
  id: string;
  customerId: string | null;
  customerName?: string | null; // 👈 NUEVO
  date: string;
  createdAt?: string;           // opcional para fallback
  type: 'order' | 'payment' | 'credit_note' | 'adjustment';
  sourceType: 'order' | 'payment' | 'credit_note';
  sourceId: string;
  amount: number;
  description?: string | null;
  runningBalance?: number;
};

export type LedgerListResponse = {
  items: LedgerEntry[];
  total: number;
  page: number;
  pageSize: number;
  balance?: number;
};

export const LedgerAPI = {
  async list(filters: LedgerFilters = {}): Promise<LedgerListResponse> {
    return api.get<LedgerListResponse>('/ledger', filters);
  },
};
