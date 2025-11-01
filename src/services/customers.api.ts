import { api } from '@/lib/api';
import { Customer } from '@/types/domain';

export type CustomerMovementDTO = {
  id: string;
  type: 'payment' | 'debt' | 'adjust';
  amount: number;
  reason?: string | null;
  createdAt: string | Date;
};

export class CustomersAPI {
  static list(): Promise<Customer[]> {
    return api.get<Customer[]>('/customers');
  }

  static getById(id: string): Promise<Customer> {
    return api.get<Customer>(`/customers/${id}`);
  }

  static create(data: Partial<Customer>): Promise<Customer> {
    return api.post<Customer>('/customers', data);
  }

  static update(id: string, data: Partial<Customer>): Promise<Customer> {
    return api.patch<Customer>(`/customers/${id}`, data);
  }

  static delete(id: string): Promise<void> {
    return api.delete(`/customers/${id}`);
  }

  static adjustBalance(
    id: string,
    payload: { amount: number; reason?: string }
  ): Promise<{ ok: true; balance: number }> {
    return api.post<{ ok: true; balance: number }>(`/customers/${id}/adjust`, payload);
  }

  /** Registrar pago (el backend setea fecha y devuelve balance actualizado) */
  static createPayment(
    id: string,
    payload: { amount: number; method: 'cash' | 'debit' | 'credit' | 'transfer'; notes?: string }
  ): Promise<{
    ok: true;
    customerId: string;
    sourceId: string;
    method: string;
    amount: number;
    createdAt: string;
    balance: number;
  }> {
    return api.post(`/customers/${id}/payments`, payload);
  }

  static async listMovements(customerId: string): Promise<CustomerMovementDTO[]> {
    const resp = await api.get<any>(`/customers/${customerId}/movements`);
    const data = resp as any;
    if (Array.isArray(data)) return data as CustomerMovementDTO[];
    if (data && typeof data === 'object') {
      if (Array.isArray(data.items)) return data.items as CustomerMovementDTO[];
      if (Array.isArray(data.data)) return data.data as CustomerMovementDTO[];
      if (Array.isArray(data.results)) return data.results as CustomerMovementDTO[];
    }
    return [];
  }
}
