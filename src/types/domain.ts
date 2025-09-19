export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  balance: number;
}

export interface OrderItem {
  product: Product | string;
  qty: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'delivered';
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
  items: OrderItem[];
  customer?: Customer | string;
  createdAt?: string | Date;
}

export interface CashMovement {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  createdAt: string | Date;
}

export interface CashReport {
  date: string;
  openingAmount: number;
  closingAmount: number;
  totalIncome: number;
  totalExpense: number;
  totalSales: number;
  balance: number;
  movements: CashMovement[];
}