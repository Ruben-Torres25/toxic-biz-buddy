// src/services/customers.api.ts
import { api } from '@/lib/api';
import { Customer } from '@/types/domain';

export class CustomersAPI {
  static adjustBalance(id: string, arg1: { amount: number; reason: string; }): Promise<unknown> {
    throw new Error("Method not implemented.");
  }
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
}
