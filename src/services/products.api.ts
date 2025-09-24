import { api } from '@/lib/api';
import { Product } from '@/types/domain';

export class ProductsAPI {
  static async list(): Promise<Product[]> {
    return api.get<Product[]>('/products');
  }

  static async getById(id: string): Promise<Product> {
    return api.get<Product>(`/products/${id}`);
  }

  static async create(productData: Partial<Product>): Promise<Product> {
    return api.post<Product>('/products', productData);
  }

  static async update(id: string, productData: Partial<Product>): Promise<Product> {
    return api.patch<Product>(`/products/${id}`, productData);
  }

  static async remove(id: string): Promise<void> {
    return api.delete(`/products/${id}`);
  }

  static async updateStock(id: string, quantity: number): Promise<Product> {
    return api.patch<Product>(`/products/${id}/stock`, { quantity });
  }
}
