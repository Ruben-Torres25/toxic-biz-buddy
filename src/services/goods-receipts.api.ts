import { api } from "@/lib/api";

/** ====== Create DTOs ====== */

export type CreateGoodsReceiptItem = {
  productId: string;
  quantity: number;   // entero > 0
  unitPrice: number;  // costo (>= 0)
  supplierSku?: string;
};

export type CreateGoodsReceiptDTO = {
  supplierId: string;
  date: string;               // YYYY-MM-DD
  documentNumber?: string;
  notes?: string;
  items: CreateGoodsReceiptItem[];

  // Opcionales (alineados con backend)
  applyRemark?: boolean;
  defaultRemarkPct?: number;
  user?: string;
};

export type CreateGoodsReceiptResult = {
  id: string | null;
  items: number;
  total: number;
  priceUpdates?: Array<{
    productId?: string;
    previousPrice?: number;
    newPrice?: number;
    [k: string]: any;
  }>;
};

/** ====== Detail types ====== */

export type GoodsReceiptHeader = {
  id: string;
  supplier_id: string;
  created_at: string;
  document_number?: string | null;
  notes?: string | null;
};

export type GoodsReceiptItem = {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  qty: number;
  base_price: number;
  margin_pct: number | null;
  final_price: number;
};

export type GoodsReceiptDetailResponse = {
  header: GoodsReceiptHeader;
  items: GoodsReceiptItem[];
};

/** ====== API ====== */

export const GoodsReceiptsAPI = {
  create: (dto: CreateGoodsReceiptDTO) =>
    api.post("/goods-receipts", dto).then((r) => r.data as CreateGoodsReceiptResult),

  detail: (id: string) =>
    api.get(`/goods-receipts/${id}`).then((r) => r.data as GoodsReceiptDetailResponse),
};
