// src/services/products.api.ts
import { api } from '@/lib/api';
import { Product } from '@/types/domain';

export class ProductsAPI {
  static list(): Promise<Product[]> {
    return api.get<Product[]>('/products');
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
}
