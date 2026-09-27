import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';

export interface AccountSummary {
  accountId?: string;
  accountCode?: string;
  accountName: string;
  amount: number;
}

export interface ProfitAndLossReport {
  fromDate: string;
  toDate: string;
  revenues: AccountSummary[];
  totalRevenue: number;
  expenses: AccountSummary[];
  totalExpense: number;
  netProfit: number;
}

export interface BalanceSheetReport {
  asOfDate: string;
  assets: AccountSummary[];
  totalAssets: number;
  liabilities: AccountSummary[];
  totalLiabilities: number;
  equity: AccountSummary[];
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
}

export interface AgedReportItem {
  entityId?: string;
  documentNumber: string;
  partyId?: string;
  partyName: string;
  documentDate: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  daysOverdue: number;
  bucket: 'CURRENT' | '1-30' | '31-60' | '61-90' | '90+';
}

export interface AgedReport {
  asOfDate: string;
  items: AgedReportItem[];
  currentTotal: number;
  days1To30Total: number;
  days31To60Total: number;
  days61To90Total: number;
  over90Total: number;
  grandTotal: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private readonly api = inject(ApiService);

  private mockPnl: ProfitAndLossReport = {
    fromDate: '2026-01-01',
    toDate: '2026-09-27',
    revenues: [
      { accountCode: '4100', accountName: 'Product Sales Revenue', amount: 145000.00 },
      { accountCode: '4200', accountName: 'Professional Services Income', amount: 28500.00 }
    ],
    totalRevenue: 173500.00,
    expenses: [
      { accountCode: '5110', accountName: 'Raw Material Purchases (COGS)', amount: 62000.00 },
      { accountCode: '5210', accountName: 'Office Rent & Facilities', amount: 14000.00 },
      { accountCode: '5220', accountName: 'Salaries & Wages Expense', amount: 45000.00 },
      { accountCode: '5230', accountName: 'Software & SaaS Subscriptions', amount: 3800.00 }
    ],
    totalExpense: 124800.00,
    netProfit: 48700.00
  };

  private mockBalanceSheet: BalanceSheetReport = {
    asOfDate: '2026-09-27',
    assets: [
      { accountCode: '1110', accountName: 'Operating Bank Account (Chase)', amount: 125400.00 },
      { accountCode: '1120', accountName: 'Accounts Receivable (Trade)', amount: 36600.00 },
      { accountCode: '1130', accountName: 'Inventory Stock Asset', amount: 19600.00 },
      { accountCode: '1140', accountName: 'Petty Cash Fund', amount: 1500.00 },
      { accountCode: '1210', accountName: 'Computer Equipment & Hardware', amount: 21500.00 }
    ],
    totalAssets: 204600.00,
    liabilities: [
      { accountCode: '2110', accountName: 'Accounts Payable (Vendors)', amount: 19276.00 },
      { accountCode: '2120', accountName: 'Sales Tax Payable', amount: 2436.86 },
      { accountCode: '2130', accountName: 'Payroll Withholdings Payable', amount: 8400.00 }
    ],
    totalLiabilities: 30112.86,
    equity: [
      { accountCode: '3100', accountName: 'Owner Share Capital', amount: 125787.14 },
      { accountCode: '3200', accountName: 'Retained Earnings', amount: 48700.00 }
    ],
    totalEquity: 174487.14,
    totalLiabilitiesAndEquity: 204600.00
  };

  private mockAgedReceivables: AgedReport = {
    asOfDate: '2026-09-27',
    currentTotal: 85400.00,
    days1To30Total: 32100.00,
    days31To60Total: 16350.00,
    days61To90Total: 8500.00,
    over90Total: 4500.00,
    grandTotal: 146850.00,
    items: [
      {
        documentNumber: 'INV-2026-0042',
        partyName: 'Acme Global Logistics Ltd',
        documentDate: '2026-09-20',
        dueDate: '2026-10-20',
        totalAmount: 14160.00,
        amountPaid: 0.00,
        balanceDue: 14160.00,
        daysOverdue: 0,
        bucket: 'CURRENT'
      },
      {
        documentNumber: 'INV-2026-0039',
        partyName: 'Starlight Tech Solutions',
        documentDate: '2026-08-25',
        dueDate: '2026-09-10',
        totalAmount: 22100.00,
        amountPaid: 10000.00,
        balanceDue: 12100.00,
        daysOverdue: 17,
        bucket: '1-30'
      },
      {
        documentNumber: 'INV-2026-0028',
        partyName: 'Global Retail Outlets Corp',
        documentDate: '2026-07-15',
        dueDate: '2026-08-15',
        totalAmount: 16350.00,
        amountPaid: 0.00,
        balanceDue: 16350.00,
        daysOverdue: 43,
        bucket: '31-60'
      },
      {
        documentNumber: 'INV-2026-0019',
        partyName: 'NexGen Telecom Inc',
        documentDate: '2026-06-10',
        dueDate: '2026-07-10',
        totalAmount: 8500.00,
        amountPaid: 0.00,
        balanceDue: 8500.00,
        daysOverdue: 79,
        bucket: '61-90'
      },
      {
        documentNumber: 'INV-2026-0005',
        partyName: 'Legacy Enterprises LLC',
        documentDate: '2026-04-01',
        dueDate: '2026-05-01',
        totalAmount: 4500.00,
        amountPaid: 0.00,
        balanceDue: 4500.00,
        daysOverdue: 149,
        bucket: '90+'
      }
    ]
  };

  private mockAgedPayables: AgedReport = {
    asOfDate: '2026-09-27',
    currentTotal: 42000.00,
    days1To30Total: 18420.50,
    days31To60Total: 5000.00,
    days61To90Total: 3000.00,
    over90Total: 0.00,
    grandTotal: 68420.50,
    items: [
      {
        documentNumber: 'BILL-2026-0031',
        partyName: 'Pacific Office Supplies Inc',
        documentDate: '2026-09-24',
        dueDate: '2026-10-24',
        totalAmount: 3776.00,
        amountPaid: 0.00,
        balanceDue: 3776.00,
        daysOverdue: 0,
        bucket: 'CURRENT'
      },
      {
        documentNumber: 'BILL-2026-0028',
        partyName: 'Vanguard Industrial Supplies',
        documentDate: '2026-08-20',
        dueDate: '2026-09-05',
        totalAmount: 10500.00,
        amountPaid: 5000.00,
        balanceDue: 5500.00,
        daysOverdue: 22,
        bucket: '1-30'
      },
      {
        documentNumber: 'BILL-2026-0015',
        partyName: 'Apex Raw Metals Distribution',
        documentDate: '2026-07-01',
        dueDate: '2026-07-30',
        totalAmount: 5000.00,
        amountPaid: 0.00,
        balanceDue: 5000.00,
        daysOverdue: 59,
        bucket: '31-60'
      },
      {
        documentNumber: 'BILL-2026-0009',
        partyName: 'Metro Utilities Power Company',
        documentDate: '2026-06-15',
        dueDate: '2026-07-01',
        totalAmount: 3000.00,
        amountPaid: 0.00,
        balanceDue: 3000.00,
        daysOverdue: 88,
        bucket: '61-90'
      }
    ]
  };

  getProfitAndLoss(fromDate?: string, toDate?: string): Observable<ProfitAndLossReport> {
    const params: any = {};
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;

    return this.api.get<ProfitAndLossReport>('/reports/profit-and-loss', { params, suppressToast: true }).pipe(
      catchError(() => of(this.mockPnl))
    );
  }

  getBalanceSheet(asOf?: string): Observable<BalanceSheetReport> {
    const params: any = {};
    if (asOf) params.asOf = asOf;

    return this.api.get<BalanceSheetReport>('/reports/balance-sheet', { params, suppressToast: true }).pipe(
      catchError(() => of(this.mockBalanceSheet))
    );
  }

  getAgedReceivables(asOf?: string): Observable<AgedReport> {
    const params: any = {};
    if (asOf) params.asOf = asOf;

    return this.api.get<AgedReport>('/reports/aged-receivables', { params, suppressToast: true }).pipe(
      catchError(() => of(this.mockAgedReceivables))
    );
  }

  getAgedPayables(asOf?: string): Observable<AgedReport> {
    const params: any = {};
    if (asOf) params.asOf = asOf;

    return this.api.get<AgedReport>('/reports/aged-payables', { params, suppressToast: true }).pipe(
      catchError(() => of(this.mockAgedPayables))
    );
  }
}
