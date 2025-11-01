// src/services/suppliers.api.ts
import { api } from "@/lib/api";

function unwrap<T = any>(x: any): T {
  const d = x?.data ?? x;
  if (d && typeof d === "object" && ("data" in d || "items" in d || "results" in d || "total" in d)) {
    return d as T;
  }
  if (Array.isArray(d)) {
    return { data: d, total: d.length } as unknown as T;
  }
  return d as T;
}

export const SuppliersAPI = {
  list: async (q = "", page = 1, pageSize = 100) => {
    const res = await api.get("/suppliers", { params: { q, page, pageSize } });
    return unwrap(res);
  },

  create: async (payload: {
    name: string;
    alias?: string | null;
    cuit?: string | null;
    contact?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
  }) => {
    const res = await api.post("/suppliers", payload);
    return unwrap(res);
  },

  update: async (
    id: string,
    payload: Partial<{
      name: string;
      alias: string | null;
      cuit: string | null;
      contact: string | null;
      phone: string | null;
      email: string | null;
      address: string | null;
      notes: string | null;
      is_active: boolean;
    }>
  ) => {
    const res = await api.patch(`/suppliers/${id}`, payload);
    return unwrap(res);
  },

  toggleActive: async (id: string, active: boolean) => {
    const res = await api.patch(`/suppliers/${id}`, { is_active: active });
    return unwrap(res);
  },

  receiptsBySupplier: async (supplierId: string, page = 1, pageSize = 50) => {
    const qs = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    }).toString();
    const res = await api.get(`/suppliers/${supplierId}/receipts?${qs}`);
    return unwrap(res);
  },
};
