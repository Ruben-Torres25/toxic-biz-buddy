import { api } from '@/lib/api';
import { OrderDTO } from '@/types/domain';

export type OrdersSort = 'code_asc' | 'code_desc' | 'date_desc' | 'date_asc';

export class OrdersAPI {
  static async list(
    include: ('customer'|'items')[] = ['customer','items'],
    sort: OrdersSort = 'code_desc',
  ): Promise<OrderDTO[]> {
    const params: string[] = [];
    if (include.length) params.push(`include=${include.join(',')}`);
    if (sort) params.push(`sort=${sort}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    return api.get<OrderDTO[]>(`/orders${qs}`);
  }

  static async getById(id: string, include: ('customer'|'items')[] = ['customer','items']): Promise<OrderDTO> {
    const qs = include.length ? `?include=${include.join(',')}` : '';
    return api.get<OrderDTO>(`/orders/${id}${qs}`);
  }

  static async create(orderData: Partial<OrderDTO>): Promise<OrderDTO> {
    return api.post<OrderDTO>('/orders', orderData);
  }

  static async update(id: string, orderData: Partial<OrderDTO>): Promise<OrderDTO> {
    return api.patch<OrderDTO>(`/orders/${id}`, orderData);
  }

  static async confirm(id: string): Promise<OrderDTO> {
    return api.patch<OrderDTO>(`/orders/${id}/confirm`);
  }

  static async cancel(id: string): Promise<OrderDTO> {
    return api.patch<OrderDTO>(`/orders/${id}/cancel`);
  }

  static async delete(id: string): Promise<void> {
    return api.delete(`/orders/${id}`);
  }
}
