// src/services/orders.api.ts
import { api } from '@/lib/api';
import { OrderDTO as Order } from '@/types/domain';

type Include = ('customer' | 'items')[];
type Sort = 'code_asc' | 'code_desc' | 'date_desc' | 'date_asc';

const makeQs = (include: Include = ['customer', 'items'], sort: Sort = 'code_desc') => {
  const params = new URLSearchParams();
  if (include.length) params.set('include', include.join(','));
  if (sort) params.set('sort', sort);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

export class OrdersAPI {
  static async list(include: Include = ['customer', 'items'], sort: Sort = 'code_desc'): Promise<Order[]> {
    return api.get<Order[]>(`/orders${makeQs(include, sort)}`);
  }

  static async getById(id: string, include: Include = ['customer', 'items']): Promise<Order> {
    return api.get<Order>(`/orders/${id}${makeQs(include)}`);
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
