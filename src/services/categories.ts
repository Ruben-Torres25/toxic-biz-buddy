// src/services/categories.ts
import { api } from '@/lib/api'

// Key en localStorage
const LS_KEY = 'toxic.categories.v1';

export type Category = string;

function readLS(): Category[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr = raw ? (JSON.parse(raw) as Category[]) : [];
    return Array.from(new Set(arr.filter(Boolean))).sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}
function writeLS(cats: Category[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(Array.from(new Set(cats.filter(Boolean)))));
}

export const CategoriesRepo = {
  async list(): Promise<Category[]> {
    return readLS();
  },

  async discoverFromBackend(limit = 200): Promise<Category[]> {
    // Pide una página grande y junta categorías existentes
    const data = await api.get<{ items: Array<{ category?: string }> }>('/products', { limit, page: 1 });
    const fromProducts = (data?.items ?? [])
      .map(p => (p.category || '').trim())
      .filter(Boolean);
    const merged = Array.from(new Set([...readLS(), ...fromProducts])).sort((a, b) => a.localeCompare(b));
    writeLS(merged);
    return merged;
  },

  async add(name: string): Promise<Category[]> {
    const v = (name || '').trim();
    if (!v) return readLS();
    const merged = Array.from(new Set([...readLS(), v])).sort((a, b) => a.localeCompare(b));
    writeLS(merged);
    return merged;
  },

  async remove(name: string): Promise<Category[]> {
    const v = (name || '').trim();
    const filtered = readLS().filter(c => c !== v);
    writeLS(filtered);
    return filtered;
  },

  async rename(prev: string, next: string): Promise<Category[]> {
    const p = (prev || '').trim();
    const n = (next || '').trim();
    if (!p || !n) return readLS();
    const out = readLS().map(c => (c === p ? n : c));
    writeLS(Array.from(new Set(out)).sort((a, b) => a.localeCompare(b)));
    return readLS();
  },
};
