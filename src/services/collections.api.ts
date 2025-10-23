export type CollectionMethod = 'EFECTIVO' | 'TRANSFERENCIA' | 'DEBITO' | 'CREDITO' | 'OTRO';

export type CollectionRow = {
  id: string;
  source: 'CAJA' | 'CLIENTES';
  date: string;
  method: CollectionMethod;
  amount: number;
  description?: string | null;
  customerId?: string | null;
  customerName?: string | null;
};

export type CollectionsResponse = {
  range: { from: string; to: string };
  totals: { EFECTIVO: number; TRANSFERENCIA: number; DEBITO: number; CREDITO: number; OTRO: number; TOTAL: number };
  items: CollectionRow[];
};

const API = import.meta.env.VITE_API_URL ?? '';

export async function fetchCollections(params: { from?: string; to?: string }): Promise<CollectionsResponse> {
  const qs = new URLSearchParams();
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  const res = await fetch(`${API}/collections?${qs.toString()}`);
  if (!res.ok) throw new Error('Error al obtener cobranzas');
  return res.json();
}
