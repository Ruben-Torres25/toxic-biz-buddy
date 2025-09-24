import { api } from '@/lib/api';
import { CashReport, CashMovement } from '@/types/domain';

export class CashAPI {
  static async current(): Promise<CashReport> {
    return api.get<CashReport>('/cash/current');
  }

  static async open(openingAmount: number): Promise<CashReport> {
    return api.post<CashReport>('/cash/open', { openingAmount });
  }

  static async close(closingAmount: number): Promise<CashReport> {
    return api.post<CashReport>('/cash/close', { closingAmount });
  }

  static async movement(movement: Partial<CashMovement>): Promise<CashMovement> {
    return api.post<CashMovement>('/cash/movement', movement);
  }

  static async report(date: string): Promise<CashReport> {
    return api.get<CashReport>('/cash/report', { date });
  }

  static async getMovements(date?: string): Promise<CashMovement[]> {
    return api.get<CashMovement[]>('/cash/movements', date ? { date } : undefined);
  }
}
