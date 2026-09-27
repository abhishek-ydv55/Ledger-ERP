import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';

export type ExpensePaymentStatus = 'PAID' | 'UNPAID' | 'PENDING';

export interface ExpenseCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  categoryId: string;
  categoryName: string;
  vendorId?: string;
  vendorName?: string;
  bankAccountId?: string;
  bankAccountName?: string;
  amount: number;
  taxAmount?: number;
  totalAmount: number;
  expenseDate: string;
  paymentStatus: ExpensePaymentStatus;
  referenceNumber?: string;
  description?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExpensesService {
  private readonly api = inject(ApiService);

  private mockCategories: ExpenseCategory[] = [
    { id: 'exp-cat-1', code: 'OFFICE', name: 'Office Supplies & Stationery', description: 'General stationery, paper, ink toner', active: true },
    { id: 'exp-cat-2', code: 'TRAVEL', name: 'Travel & Accommodations', description: 'Flight bookings, hotel stays, taxi fares', active: true },
    { id: 'exp-cat-3', code: 'UTILITIES', name: 'Utilities & Internet', description: 'Electricity, water, high-speed fiber internet', active: true },
    { id: 'exp-cat-4', code: 'SOFTWARE', name: 'Software Subscriptions', description: 'Cloud hosting, SaaS tools, licenses', active: true },
    { id: 'exp-cat-5', code: 'MEALS', name: 'Client Entertainment & Meals', description: 'Business lunches and team dining', active: true }
  ];

  private mockExpenses: Expense[] = [
    {
      id: 'exp-1',
      expenseNumber: 'EXP-2026-0042',
      categoryId: 'exp-cat-4',
      categoryName: 'Software Subscriptions',
      vendorId: 'vend-1',
      vendorName: 'Pacific Office Supplies Inc',
      bankAccountId: 'bank-1',
      bankAccountName: 'Chase Business Operating',
      amount: 450.00,
      taxAmount: 0.00,
      totalAmount: 450.00,
      expenseDate: '2026-09-22',
      paymentStatus: 'PAID',
      referenceNumber: 'SAAS-SEPT-991',
      description: 'Monthly cloud infrastructure hosting billing',
      createdAt: '2026-09-22T10:00:00Z'
    },
    {
      id: 'exp-2',
      expenseNumber: 'EXP-2026-0045',
      categoryId: 'exp-cat-3',
      categoryName: 'Utilities & Internet',
      vendorId: 'vend-2',
      vendorName: 'Vanguard Industrial Supplies',
      bankAccountId: 'bank-1',
      bankAccountName: 'Chase Business Operating',
      amount: 1280.50,
      taxAmount: 64.00,
      totalAmount: 1344.50,
      expenseDate: '2026-09-25',
      paymentStatus: 'PAID',
      referenceNumber: 'UTIL-88219',
      description: 'September primary facility power & fiber internet bill',
      createdAt: '2026-09-25T14:30:00Z'
    },
    {
      id: 'exp-3',
      expenseNumber: 'EXP-2026-0048',
      categoryId: 'exp-cat-1',
      categoryName: 'Office Supplies & Stationery',
      bankAccountId: 'bank-2',
      bankAccountName: 'Petty Cash Fund',
      amount: 175.25,
      taxAmount: 8.75,
      totalAmount: 184.00,
      expenseDate: '2026-09-27',
      paymentStatus: 'PAID',
      referenceNumber: 'PETTY-0927',
      description: 'Breakroom espresso beans and paper towels',
      createdAt: '2026-09-27T09:15:00Z'
    }
  ];

  // Category CRUD
  getCategories(): Observable<ExpenseCategory[]> {
    return this.api.get<ExpenseCategory[]>('/expense-categories', { suppressToast: true }).pipe(
      catchError(() => of(this.mockCategories))
    );
  }

  createCategory(cat: Partial<ExpenseCategory>): Observable<ExpenseCategory> {
    return this.api.post<ExpenseCategory>('/expense-categories', cat).pipe(
      catchError(() => {
        const newCat: ExpenseCategory = {
          id: `exp-cat-${Date.now()}`,
          code: cat.code || `CAT-${Math.floor(100 + Math.random() * 900)}`,
          name: cat.name || 'New Category',
          description: cat.description,
          active: true
        };
        this.mockCategories.push(newCat);
        return of(newCat);
      })
    );
  }

  updateCategory(id: string, cat: Partial<ExpenseCategory>): Observable<ExpenseCategory> {
    return this.api.put<ExpenseCategory>(`/expense-categories/${id}`, cat).pipe(
      catchError(() => {
        const idx = this.mockCategories.findIndex(c => c.id === id);
        if (idx !== -1) {
          this.mockCategories[idx] = { ...this.mockCategories[idx], ...cat };
          return of(this.mockCategories[idx]);
        }
        return of(cat as ExpenseCategory);
      })
    );
  }

  deleteCategory(id: string): Observable<void> {
    return this.api.delete<void>(`/expense-categories/${id}`).pipe(
      catchError(() => {
        this.mockCategories = this.mockCategories.filter(c => c.id !== id);
        return of(undefined);
      })
    );
  }

  // Expense List & Form Operations
  getExpenses(): Observable<Expense[]> {
    return this.api.get<Expense[]>('/expenses', { suppressToast: true }).pipe(
      catchError(() => of(this.mockExpenses))
    );
  }

  createExpense(req: Partial<Expense>): Observable<Expense> {
    return this.api.post<Expense>('/expenses', req).pipe(
      catchError(() => {
        const amt = Number(req.amount || 0);
        const tax = Number(req.taxAmount || 0);
        const newExp: Expense = {
          id: `exp-${Date.now()}`,
          expenseNumber: `EXP-2026-${Math.floor(100 + Math.random() * 900)}`,
          categoryId: req.categoryId || 'exp-cat-1',
          categoryName: req.categoryName || 'General Expense',
          vendorId: req.vendorId,
          vendorName: req.vendorName,
          bankAccountId: req.bankAccountId,
          bankAccountName: req.bankAccountName,
          amount: amt,
          taxAmount: tax,
          totalAmount: amt + tax,
          expenseDate: req.expenseDate || new Date().toISOString().split('T')[0],
          paymentStatus: req.paymentStatus || 'PAID',
          referenceNumber: req.referenceNumber,
          description: req.description,
          createdAt: new Date().toISOString()
        };
        this.mockExpenses.unshift(newExp);
        return of(newExp);
      })
    );
  }

  deleteExpense(id: string): Observable<void> {
    return this.api.delete<void>(`/expenses/${id}`).pipe(
      catchError(() => {
        this.mockExpenses = this.mockExpenses.filter(e => e.id !== id);
        return of(undefined);
      })
    );
  }
}
