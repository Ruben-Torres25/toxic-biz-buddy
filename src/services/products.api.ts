import { api } from '@/lib/api';
import type { Product } from '@/types/domain';

type SortBy = 'name' | 'sku' | 'price' | 'stock' | 'createdAt';
type SortDir = 'asc' | 'desc';

export type ProductSearchParams = {
  q?: string;
  sku?: string;
  barcode?: string;
  matchSku?: 'exact' | 'starts' | 'contains';
  matchBarcode?: 'exact' | 'contains';
  category?: string;
  page?: number;
  limit?: number;
  sortBy?: SortBy;
  sortDir?: SortDir;
};

export class ProductsAPI {
  // listado legacy (por si lo usás en otra parte)
  static async list(): Promise<Product[]> {
    const resp = await api.get<any>('/products');
    if (Array.isArray(resp)) return resp as Product[];
    if (resp && typeof resp === 'object') {
      if (Array.isArray(resp.items)) return resp.items as Product[];
      if (Array.isArray(resp.data)) return resp.data as Product[];
      if (Array.isArray(resp.results)) return resp.results as Product[];
    }
    return [];
  }

  // búsqueda avanzada con paginado
  static async search(params: ProductSearchParams) {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
    });
    return api.get(`/products?${sp.toString()}`);
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

  // categorías distintas (para el Select)
  static async categories(): Promise<string[]> {
    const resp = await api.get<any>('/products/categories');
    if (Array.isArray(resp)) return resp as string[];
    if (resp && Array.isArray(resp.items)) return resp.items as string[];
    return [];
  }
}
