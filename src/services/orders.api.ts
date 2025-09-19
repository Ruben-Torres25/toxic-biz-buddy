import { api } from '@/lib/api';
import { Order } from '@/types/domain';

export class OrdersAPI {
  static async list(): Promise<Order[]> {
    return api.get<Order[]>('/orders');
  }

  static async getById(id: string): Promise<Order> {
    return api.get<Order>(`/orders/${id}`);
  }

  static async create(orderData: Partial<Order>): Promise<Order> {
    return api.post<Order>('/orders', orderData);
  }

  static async update(id: string, orderData: Partial<Order>): Promise<Order> {
    return api.patch<Order>(`/orders/${id}`, orderData);
  }

  static async confirm(id: string): Promise<Order> {
    return api.patch<Order>(`/orders/${id}/confirm`);
  }

  static async cancel(id: string): Promise<Order> {
    return api.patch<Order>(`/orders/${id}/cancel`);
  }

  static async delete(id: string): Promise<void> {
    return api.delete(`/orders/${id}`);
  }
}