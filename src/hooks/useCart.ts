import { useMemo, useState } from "react";
import type { CartLine, Payment, PaymentMethod } from "@/types/sales";

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [discountGlobal, setDiscountGlobal] = useState<number>(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notes, setNotes] = useState<string>("");

  const totals = useMemo(() => {
    const subtotal = lines.reduce((a, l) => a + l.price * l.qty - (l.discount || 0), 0);
    const total = Math.max(0, subtotal - discountGlobal);
    const pagos = payments.reduce((a, p) => a + p.amount, 0);
    return { subtotal, total, pagos };
  }, [lines, discountGlobal, payments]);

  function addLine(line: CartLine) {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.productId === line.productId && l.price === line.price);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + line.qty };
        return copy;
      }
      return [...prev, line];
    });
  }
  const removeLine = (productId: string) => setLines((prev) => prev.filter((l) => l.productId !== productId));
  const setQty = (id: string, qty: number) => setLines((prev) => prev.map((l) => l.productId === id ? { ...l, qty: Math.max(1, Math.floor(qty || 1)) } : l));
  const setPrice = (id: string, price: number) => setLines((prev) => prev.map((l) => l.productId === id ? { ...l, price: Math.max(0, price) } : l));
  const setDiscountLine = (id: string, discount: number) => setLines((prev) => prev.map((l) => l.productId === id ? { ...l, discount: Math.max(0, discount) } : l));
  const clearCart = () => { setLines([]); setDiscountGlobal(0); setPayments([]); setNotes(""); };

  function setPayment(method: PaymentMethod, amount: number) {
    setPayments((prev) => {
      const idx = prev.findIndex((p) => p.method === method);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], amount: Math.max(0, amount) };
        return copy;
      }
      return [...prev, { method, amount: Math.max(0, amount) }];
    });
  }
  const removePayment = (method: PaymentMethod) => setPayments((prev) => prev.filter((p) => p.method !== method));

  return {
    lines, payments, notes, setNotes,
    discountGlobal, setDiscountGlobal,
    totals,
    addLine, removeLine, setQty, setPrice, setDiscountLine, clearCart,
    setPayment, removePayment,
  };
}
