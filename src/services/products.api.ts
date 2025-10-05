// src/services/products.api.ts
import { api } from '@/lib/api';
import type { Product } from '@/types/domain';

export type ProductSearchParams = {
  q?: string;
  name?: string;
  sku?: string;
  category?: string;
  barcode?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'sku' | 'price' | 'stock' | 'createdAt';
  sortDir?: 'asc' | 'desc';
};

function normalizeProducts(resp: any): Product[] {
  if (Array.isArray(resp)) return resp as Product[];
  if (resp && typeof resp === 'object') {
    if (Array.isArray(resp.items)) return resp.items as Product[];
    if (Array.isArray(resp.data)) return resp.data as Product[];
    if (Array.isArray(resp.results)) return resp.results as Product[];
  }
  return [];
}

export class ProductsAPI {
  static async list(): Promise<Product[]> {
    const resp = await api.get<any>('/products');
    return normalizeProducts(resp);
  }

  static async search(params: ProductSearchParams): Promise<{ items: Product[]; total?: number }> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).length > 0) qs.append(k, String(v));
    });
    // Nota: también podrías pasar params como obj: api.get('/products', params)
    const resp = await api.get<any>('/products', Object.fromEntries(qs));
    const items = normalizeProducts(resp);
    const total = typeof resp?.total === 'number' ? resp.total : items.length;
    return { items, total };
  }

  static getById(id: string): Promise<Product> {
    return api.get<Product>(`/products/${id}`);
  }

  static create(data: Partial<Product>): Promise<Product> {
    return api.post<Product>('/products', data);
  }

  static update(id: string, data: Partial<Product>): Promise<Product> {
    return api.patch<Product>(`/products/${id}`, data);
  }

  static delete(id: string): Promise<void> {
    return api.delete(`/products/${id}`);
  }

  static adjustStock(id: string, quantity: number): Promise<Product> {
    return api.patch<Product>(`/products/${id}/stock`, { quantity });
  }
}
