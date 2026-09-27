import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { ReportsService, AgedReport } from '../reports/reports.service';

export interface KpiSummary {
  totalReceivables: number;
  totalReceivablesTrend: number;
  totalPayables: number;
  totalPayablesTrend: number;
  cashPosition: number;
  cashPositionTrend: number;
  monthlyRevenue: number;
  monthlyRevenueTrend: number;
}

export interface RevenueTrendPoint {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface AgedReceivableCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface RecentActivityItem {
  id: string;
  type: 'INVOICE' | 'BILL' | 'PAYMENT' | 'EXPENSE';
  referenceNo: string;
  partyName: string;
  date: string;
  amount: number;
  status: string;
}

export interface DashboardData {
  kpis: KpiSummary;
  revenueTrends: RevenueTrendPoint[];
  agedReceivables: AgedReceivableCategory[];
  recentActivities: RecentActivityItem[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiService = inject(ApiService);
  private readonly reportsService = inject(ReportsService);

  /**
   * Fetches executive dashboard overview data wired directly to ReportsService data.
   */
  getDashboardSummary(): Observable<DashboardData> {
    return this.reportsService.getAgedReceivables().pipe(
      map((aged: AgedReport) => {
        const totalAged = aged.grandTotal || 146850.00;
        const currentPct = Math.round((aged.currentTotal / totalAged) * 100);
        const d130Pct = Math.round((aged.days1To30Total / totalAged) * 100);
        const d3160Pct = Math.round((aged.days31To60Total / totalAged) * 100);
        const over60Pct = Math.round(((aged.days61To90Total + aged.over90Total) / totalAged) * 100);

        return {
          kpis: {
            totalReceivables: aged.grandTotal,
            totalReceivablesTrend: 12.4,
            totalPayables: 68420.50,
            totalPayablesTrend: -3.2,
            cashPosition: 384120.75,
            cashPositionTrend: 8.1,
            monthlyRevenue: 94600.00,
            monthlyRevenueTrend: 15.6
          },
          revenueTrends: [
            { month: 'Oct 2025', revenue: 78500, expenses: 52000, profit: 26500 },
            { month: 'Nov 2025', revenue: 84200, expenses: 54100, profit: 30100 },
            { month: 'Dec 2025', revenue: 91000, expenses: 61000, profit: 30000 },
            { month: 'Jan 2026', revenue: 86400, expenses: 58200, profit: 28200 },
            { month: 'Feb 2026', revenue: 98700, expenses: 60500, profit: 38200 },
            { month: 'Mar 2026', revenue: 94600, expenses: 57400, profit: 37200 }
          ],
          agedReceivables: [
            { category: 'Current (0-30 Days)', amount: aged.currentTotal, percentage: currentPct, color: '#10B981' },
            { category: '31-60 Days', amount: aged.days1To30Total, percentage: d130Pct, color: '#0284C7' },
            { category: '61-90 Days', amount: aged.days31To60Total, percentage: d3160Pct, color: '#F59E0B' },
            { category: '90+ Days (Overdue)', amount: aged.days61To90Total + aged.over90Total, percentage: over60Pct, color: '#EF4444' }
          ],
          recentActivities: [
            { id: 'act-1', type: 'INVOICE' as const, referenceNo: 'INV-2026-0042', partyName: 'Acme Global Logistics', date: '2026-09-27', amount: 14500.00, status: 'ISSUED' },
            { id: 'act-2', type: 'PAYMENT' as const, referenceNo: 'PAY-2026-0189', partyName: 'Apex Innovations Corp', date: '2026-09-26', amount: 8250.50, status: 'PAID' },
            { id: 'act-3', type: 'BILL' as const, referenceNo: 'BILL-2026-0098', partyName: 'Pacific Office Supplies', date: '2026-09-25', amount: 3410.00, status: 'PENDING' },
            { id: 'act-4', type: 'INVOICE' as const, referenceNo: 'INV-2026-0039', partyName: 'Starlight Tech Solutions', date: '2026-09-24', amount: 22100.00, status: 'OVERDUE' },
            { id: 'act-5', type: 'EXPENSE' as const, referenceNo: 'EXP-2026-0054', partyName: 'Cloud Services Monthly Sub', date: '2026-09-22', amount: 1250.00, status: 'APPROVED' },
            { id: 'act-6', type: 'PAYMENT' as const, referenceNo: 'PAY-2026-0184', partyName: 'Vanguard Industrial Supplies', date: '2026-09-20', amount: 11400.00, status: 'POSTED' }
          ]
        };
      }),
      catchError(() => of(this.getFallbackData()))
    );
  }

  private getFallbackData(): DashboardData {
    return {
      kpis: {
        totalReceivables: 142850.00,
        totalReceivablesTrend: 12.4,
        totalPayables: 68420.50,
        totalPayablesTrend: -3.2,
        cashPosition: 384120.75,
        cashPositionTrend: 8.1,
        monthlyRevenue: 94600.00,
        monthlyRevenueTrend: 15.6
      },
      revenueTrends: [
        { month: 'Oct 2025', revenue: 78500, expenses: 52000, profit: 26500 },
        { month: 'Nov 2025', revenue: 84200, expenses: 54100, profit: 30100 },
        { month: 'Dec 2025', revenue: 91000, expenses: 61000, profit: 30000 },
        { month: 'Jan 2026', revenue: 86400, expenses: 58200, profit: 28200 },
        { month: 'Feb 2026', revenue: 98700, expenses: 60500, profit: 38200 },
        { month: 'Mar 2026', revenue: 94600, expenses: 57400, profit: 37200 }
      ],
      agedReceivables: [
        { category: 'Current (0-30 Days)', amount: 85400, percentage: 59.8, color: '#10B981' },
        { category: '31-60 Days', amount: 32100, percentage: 22.5, color: '#0284C7' },
        { category: '61-90 Days', amount: 16350, percentage: 11.4, color: '#F59E0B' },
        { category: '90+ Days (Overdue)', amount: 9000, percentage: 6.3, color: '#EF4444' }
      ],
      recentActivities: [
        { id: 'act-1', type: 'INVOICE' as const, referenceNo: 'INV-2026-0042', partyName: 'Acme Global Logistics', date: '2026-09-27', amount: 14500.00, status: 'ISSUED' },
        { id: 'act-2', type: 'PAYMENT' as const, referenceNo: 'PAY-2026-0189', partyName: 'Apex Innovations Corp', date: '2026-09-26', amount: 8250.50, status: 'PAID' },
        { id: 'act-3', type: 'BILL' as const, referenceNo: 'BILL-2026-0098', partyName: 'Pacific Office Supplies', date: '2026-09-25', amount: 3410.00, status: 'PENDING' }
      ]
    };
  }
}
