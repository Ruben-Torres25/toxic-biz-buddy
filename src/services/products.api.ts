import { api } from '@/lib/api'
import type { Product } from '@/types/domain'

export type ProductSearchParams = {
  q?: string
  name?: string
  sku?: string
  category?: string
  barcode?: string
  codeLetters?: string
  codeDigits?: string
  page?: number | string
  limit?: number | string
  sortBy?: 'name' | 'sku' | 'price' | 'stock' | 'createdAt'
  sortDir?: 'asc' | 'desc'
}

export type Paged<T> = { items: T[]; total?: number; page?: number; pages?: number; limit?: number }

export class ProductsAPI {
  static async search(params: ProductSearchParams = {}) {
    return api.get<Paged<Product>>('/products', params as any)
  }

  static getById(id: string) {
    return api.get<Product>(`/products/${id}`)
  }

  static create(data: Partial<Product>) {
    // sku es opcional: lo genera la BD/trigger
    return api.post<Product>('/products', data)
  }

  static update(id: string, data: Partial<Product>) {
    return api.patch<Product>(`/products/${id}`, data)
  }

  static delete(id: string) {
    return api.delete<void>(`/products/${id}`)
  }

  static adjustStock(id: string, quantity: number) {
    return api.patch<Product>(`/products/${id}/stock`, { quantity })
  }

  static nextSku(opts?: { prefix?: string; category?: string; name?: string }) {
    return api.get<{ prefix: string; ddd: string; next: string }>(`/products/next-sku`, opts as any)
  }
}
