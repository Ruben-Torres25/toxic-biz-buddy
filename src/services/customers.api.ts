import { api } from '@/lib/api';
import { Customer } from '@/types/domain';

export class CustomersAPI {
  static async list(): Promise<Customer[]> {
    return api.get<Customer[]>('/customers');
  }

  static async getById(id: string): Promise<Customer> {
    return api.get<Customer>(`/customers/${id}`);
  }

  static async create(customerData: Partial<Customer>): Promise<Customer> {
    return api.post<Customer>('/customers', customerData);
  }

  static async update(id: string, customerData: Partial<Customer>): Promise<Customer> {
    return api.patch<Customer>(`/customers/${id}`, customerData);
  }

  static async getBalance(id: string): Promise<{ balance: number }> {
    return api.get<{ balance: number }>(`/customers/${id}/balance`);
  }

  static async adjust(id: string, amount: number, reason: string): Promise<Customer> {
    return api.post<Customer>(`/customers/${id}/adjust`, { amount, reason });
  }

  static async delete(id: string): Promise<void> {
    return api.delete(`/customers/${id}`);
  }
}
