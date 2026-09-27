import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type JournalEntryStatus = 'DRAFT' | 'POSTED' | 'VOID';

export interface AccountNode {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  balance: number;
  description?: string;
  parentId?: string | null;
  children?: AccountNode[];
}

export interface JournalEntryLineItem {
  id?: string;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  debit: number;
  credit: number;
  memo?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  reference?: string;
  status: JournalEntryStatus;
  totalDebit: number;
  totalCredit: number;
  notes?: string;
  lines: JournalEntryLineItem[];
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountingService {
  private readonly api = inject(ApiService);

  private mockAccounts: AccountNode[] = [
    {
      id: 'acc-1000',
      code: '1000',
      name: 'ASSETS',
      type: 'ASSET',
      balance: 204600.00,
      description: 'Total Organization Assets',
      children: [
        {
          id: 'acc-1100',
          code: '1100',
          name: 'Current Assets',
          type: 'ASSET',
          balance: 183100.00,
          parentId: 'acc-1000',
          children: [
            { id: 'acc-1110', code: '1110', name: 'Operating Bank Account (Chase)', type: 'ASSET', balance: 125400.00, parentId: 'acc-1100' },
            { id: 'acc-1120', code: '1120', name: 'Accounts Receivable (Trade)', type: 'ASSET', balance: 36600.00, parentId: 'acc-1100' },
            { id: 'acc-1130', code: '1130', name: 'Inventory Stock Asset', type: 'ASSET', balance: 19600.00, parentId: 'acc-1100' },
            { id: 'acc-1140', code: '1140', name: 'Petty Cash Fund', type: 'ASSET', balance: 1500.00, parentId: 'acc-1100' }
          ]
        },
        {
          id: 'acc-1200',
          code: '1200',
          name: 'Non-Current Assets',
          type: 'ASSET',
          balance: 21500.00,
          parentId: 'acc-1000',
          children: [
            { id: 'acc-1210', code: '1210', name: 'Computer Equipment & Hardware', type: 'ASSET', balance: 28000.00, parentId: 'acc-1200' },
            { id: 'acc-1220', code: '1220', name: 'Accumulated Depreciation - Equipment', type: 'ASSET', balance: -6500.00, parentId: 'acc-1200' }
          ]
        }
      ]
    },
    {
      id: 'acc-2000',
      code: '2000',
      name: 'LIABILITIES',
      type: 'LIABILITY',
      balance: 30112.86,
      description: 'Total Outstanding Liabilities',
      children: [
        {
          id: 'acc-2100',
          code: '2100',
          name: 'Current Liabilities',
          type: 'LIABILITY',
          balance: 30112.86,
          parentId: 'acc-2000',
          children: [
            { id: 'acc-2110', code: '2110', name: 'Accounts Payable (Vendors)', type: 'LIABILITY', balance: 19276.00, parentId: 'acc-2100' },
            { id: 'acc-2120', code: '2120', name: 'Sales Tax Payable', type: 'LIABILITY', balance: 2436.86, parentId: 'acc-2100' },
            { id: 'acc-2130', code: '2130', name: 'Payroll Withholdings Payable', type: 'LIABILITY', balance: 8400.00, parentId: 'acc-2100' }
          ]
        }
      ]
    },
    {
      id: 'acc-3000',
      code: '3000',
      name: 'EQUITY',
      type: 'EQUITY',
      balance: 200087.14,
      children: [
        { id: 'acc-3100', code: '3100', name: 'Owner Share Capital', type: 'EQUITY', balance: 150000.00, parentId: 'acc-3000' },
        { id: 'acc-3200', code: '3200', name: 'Retained Earnings', type: 'EQUITY', balance: 50087.14, parentId: 'acc-3000' }
      ]
    },
    {
      id: 'acc-4000',
      code: '4000',
      name: 'REVENUE',
      type: 'REVENUE',
      balance: 173500.00,
      children: [
        { id: 'acc-4100', code: '4100', name: 'Product Sales Revenue', type: 'REVENUE', balance: 145000.00, parentId: 'acc-4000' },
        { id: 'acc-4200', code: '4200', name: 'Professional Services Income', type: 'REVENUE', balance: 28500.00, parentId: 'acc-4000' }
      ]
    },
    {
      id: 'acc-5000',
      code: '5000',
      name: 'EXPENSES',
      type: 'EXPENSE',
      balance: 124800.00,
      children: [
        {
          id: 'acc-5100',
          code: '5100',
          name: 'Cost of Goods Sold',
          type: 'EXPENSE',
          balance: 62000.00,
          parentId: 'acc-5000',
          children: [
            { id: 'acc-5110', code: '5110', name: 'Raw Material Purchases', type: 'EXPENSE', balance: 62000.00, parentId: 'acc-5100' }
          ]
        },
        {
          id: 'acc-5200',
          code: '5200',
          name: 'Operating Expenses',
          type: 'EXPENSE',
          balance: 62800.00,
          parentId: 'acc-5000',
          children: [
            { id: 'acc-5210', code: '5210', name: 'Office Rent & Facilities', type: 'EXPENSE', balance: 14000.00, parentId: 'acc-5200' },
            { id: 'acc-5220', code: '5220', name: 'Salaries & Wages Expense', type: 'EXPENSE', balance: 45000.00, parentId: 'acc-5200' },
            { id: 'acc-5230', code: '5230', name: 'Software & SaaS Subscriptions', type: 'EXPENSE', balance: 3800.00, parentId: 'acc-5200' }
          ]
        }
      ]
    }
  ];

  private mockEntries: JournalEntry[] = [
    {
      id: 'je-1',
      entryNumber: 'JE-2026-0001',
      entryDate: '2026-09-15',
      reference: 'Q3 Equipment Depreciation',
      status: 'POSTED',
      totalDebit: 1250.00,
      totalCredit: 1250.00,
      notes: 'Quarterly straight-line depreciation entry for workstation hardware',
      lines: [
        { id: 'jel-1', accountId: 'acc-5200', accountCode: '5200', accountName: 'Operating Expenses', debit: 1250.00, credit: 0.00, memo: 'Depreciation Expense' },
        { id: 'jel-2', accountId: 'acc-1220', accountCode: '1220', accountName: 'Accumulated Depreciation - Equipment', debit: 0.00, credit: 1250.00, memo: 'Accumulated Depreciation' }
      ],
      createdAt: '2026-09-15T10:00:00Z'
    },
    {
      id: 'je-2',
      entryNumber: 'JE-2026-0002',
      entryDate: '2026-09-20',
      reference: 'Prepaid Software License Accrual',
      status: 'POSTED',
      totalDebit: 3800.00,
      totalCredit: 3800.00,
      notes: 'Monthly SaaS software subscription allocation',
      lines: [
        { id: 'jel-3', accountId: 'acc-5230', accountCode: '5230', accountName: 'Software & SaaS Subscriptions', debit: 3800.00, credit: 0.00, memo: 'Software SaaS expense' },
        { id: 'jel-4', accountId: 'acc-1110', accountCode: '1110', accountName: 'Operating Bank Account (Chase)', debit: 0.00, credit: 3800.00, memo: 'Chase Bank payment' }
      ],
      createdAt: '2026-09-20T14:30:00Z'
    },
    {
      id: 'je-3',
      entryNumber: 'JE-2026-0003',
      entryDate: '2026-09-27',
      reference: 'Petty Cash Replenishment Draft',
      status: 'DRAFT',
      totalDebit: 250.00,
      totalCredit: 250.00,
      notes: 'Replenishing office petty cash receipts',
      lines: [
        { id: 'jel-5', accountId: 'acc-1140', accountCode: '1140', accountName: 'Petty Cash Fund', debit: 250.00, credit: 0.00, memo: 'Top-up petty cash' },
        { id: 'jel-6', accountId: 'acc-1110', accountCode: '1110', accountName: 'Operating Bank Account (Chase)', debit: 0.00, credit: 250.00, memo: 'ATM Withdrawal' }
      ],
      createdAt: '2026-09-27T08:00:00Z'
    }
  ];

  // Accounts Operations
  getAccountsTree(): Observable<AccountNode[]> {
    return this.api.get<AccountNode[]>('/accounts/tree', { suppressToast: true }).pipe(
      catchError(() => of(this.mockAccounts))
    );
  }

  getFlatAccounts(): AccountNode[] {
    const flatList: AccountNode[] = [];
    const traverse = (nodes: AccountNode[]) => {
      for (const node of nodes) {
        flatList.push(node);
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      }
    };
    traverse(this.mockAccounts);
    return flatList;
  }

  createAccount(account: Partial<AccountNode>): Observable<AccountNode> {
    return this.api.post<AccountNode>('/accounts', account).pipe(
      catchError(() => {
        const newAcc: AccountNode = {
          id: `acc-${Date.now()}`,
          code: account.code || `${Math.floor(1000 + Math.random() * 8999)}`,
          name: account.name || 'New Account',
          type: account.type || 'ASSET',
          balance: account.balance || 0,
          description: account.description,
          parentId: account.parentId || null
        };

        if (account.parentId) {
          const parent = this.findAccountNode(this.mockAccounts, account.parentId);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(newAcc);
          } else {
            this.mockAccounts.push(newAcc);
          }
        } else {
          this.mockAccounts.push(newAcc);
        }
        return of(newAcc);
      })
    );
  }

  private findAccountNode(nodes: AccountNode[], id: string): AccountNode | null {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = this.findAccountNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // Journal Entries Operations
  getJournalEntries(): Observable<JournalEntry[]> {
    return this.api.get<JournalEntry[]>('/journal-entries', { suppressToast: true }).pipe(
      catchError(() => of(this.mockEntries))
    );
  }

  createJournalEntry(entry: Partial<JournalEntry>): Observable<JournalEntry> {
    return this.api.post<JournalEntry>('/journal-entries', entry).pipe(
      catchError(() => {
        const newEntry: JournalEntry = {
          id: `je-${Date.now()}`,
          entryNumber: `JE-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          entryDate: entry.entryDate || new Date().toISOString().split('T')[0],
          reference: entry.reference,
          status: 'DRAFT',
          totalDebit: entry.totalDebit || 0,
          totalCredit: entry.totalCredit || 0,
          notes: entry.notes,
          lines: entry.lines || [],
          createdAt: new Date().toISOString()
        };
        this.mockEntries.unshift(newEntry);
        return of(newEntry);
      })
    );
  }

  postJournalEntry(id: string): Observable<JournalEntry> {
    return this.api.post<JournalEntry>(`/journal-entries/${id}/post`, {}).pipe(
      catchError(() => {
        const entry = this.mockEntries.find(e => e.id === id);
        if (entry) entry.status = 'POSTED';
        return of(entry!);
      })
    );
  }

  voidJournalEntry(id: string): Observable<JournalEntry> {
    return this.api.post<JournalEntry>(`/journal-entries/${id}/void`, {}).pipe(
      catchError(() => {
        const entry = this.mockEntries.find(e => e.id === id);
        if (entry) entry.status = 'VOID';
        return of(entry!);
      })
    );
  }
}
