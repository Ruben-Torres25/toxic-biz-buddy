import { api } from '@/lib/api';
import type { OrderDTO, CreateOrderDTO } from '@/types/domain';

type Include = ('customer'|'items')[];
type Sort = 'code_desc' | 'code_asc' | 'date_desc' | 'date_asc';

function qs(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v); });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export class OrdersAPI {
  static async list(include: Include = ['customer','items'], sort: Sort = 'code_desc'): Promise<OrderDTO[]> {
    const query = qs({
      include: include.join(','),
      sort,
    });
    return api.get<OrderDTO[]>(`/orders${query}`);
  }

  static async getById(id: string, include: Include = ['customer','items']): Promise<OrderDTO> {
    const query = qs({ include: include.join(',') });
    return api.get<OrderDTO>(`/orders/${id}${query}`);
  }

  static async create(orderData: CreateOrderDTO): Promise<OrderDTO> {
    return api.post<OrderDTO>('/orders', orderData);
  }

  static async update(id: string, orderData: Partial<OrderDTO>): Promise<OrderDTO> {
    return api.patch<OrderDTO>(`/orders/${id}`, orderData);
  }

  // Enviamos {} para evitar body "undefined"
  static async confirm(id: string): Promise<OrderDTO> {
    return api.patch<OrderDTO>(`/orders/${id}/confirm`, {});
  }

  static async cancel(id: string): Promise<OrderDTO> {
    return api.patch<OrderDTO>(`/orders/${id}/cancel`, {});
  }

  static async delete(id: string): Promise<void> {
    return api.delete(`/orders/${id}`);
  }
}
