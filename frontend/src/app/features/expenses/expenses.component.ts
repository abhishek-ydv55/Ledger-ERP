import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExpensesService, ExpenseCategory, Expense } from './expenses.service';
import { PartiesService, Party } from '../parties/parties.service';
import { ToastService } from '../../core/services/toast.service';
import { DataTableComponent, ColumnDef } from '../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { CurrencyDisplayComponent } from '../../shared/components/currency-display/currency-display.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { FormDialogComponent } from '../../shared/components/form-dialog/form-dialog.component';

export type ExpensesTab = 'ledger' | 'categories';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DataTableComponent,
    StatusBadgeComponent,
    CurrencyDisplayComponent,
    ButtonComponent,
    FormDialogComponent
  ],
  template: `
    <div class="space-y-6">
      
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Expenses & Petty Cash
          </h1>
          <p class="text-xs sm:text-sm text-stone-500 dark:text-espresso-400 mt-1">
            Track company operating expenses, petty cash disbursements, and expense categories.
          </p>
        </div>

        <div class="flex items-center space-x-3">
          @if (activeTab() === 'ledger') {
            <app-button variant="brass" size="sm" (click)="openCreateExpenseModal()">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Record New Expense
            </app-button>
          } @else {
            <app-button variant="brass" size="sm" (click)="addCategoryInlineRow()">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Add Expense Category
            </app-button>
          }
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="border-b border-stone-200 dark:border-espresso-800">
        <nav class="flex space-x-8" aria-label="Expenses Workflow Tabs">
          
          <button
            (click)="setTab('ledger')"
            [class.border-brass-500]="activeTab() === 'ledger'"
            [class.text-brass-600]="activeTab() === 'ledger'"
            [class.dark:text-brass-400]="activeTab() === 'ledger'"
            [class.border-transparent]="activeTab() !== 'ledger'"
            [class.text-stone-500]="activeTab() !== 'ledger'"
            class="py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-150 flex items-center space-x-2 focus:outline-none"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span>Expense Ledger ({{ expenses().length }})</span>
          </button>

          <button
            (click)="setTab('categories')"
            [class.border-brass-500]="activeTab() === 'categories'"
            [class.text-brass-600]="activeTab() === 'categories'"
            [class.dark:text-brass-400]="activeTab() === 'categories'"
            [class.border-transparent]="activeTab() !== 'categories'"
            [class.text-stone-500]="activeTab() !== 'categories'"
            class="py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-150 flex items-center space-x-2 focus:outline-none"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h10M7 12h10M7 17h10"/>
            </svg>
            <span>Expense Categories ({{ categories().length }})</span>
          </button>

        </nav>
      </div>

      <!-- TAB 1: Expenses List View -->
      @if (activeTab() === 'ledger') {
        <div class="space-y-4 animate-fade-in">
          <app-data-table
            [data]="expenses()"
            [columns]="expenseTableColumns"
            [loading]="isLoading()"
            (rowClick)="openExpenseDetail($event)"
            emptyTitle="No expenses recorded"
            emptyMessage="No company operating expenses or petty cash disbursements recorded yet."
          ></app-data-table>
        </div>
      }

      <!-- TAB 2: Expense Categories Inline Edit View -->
      @if (activeTab() === 'categories') {
        <div class="space-y-4 bg-white dark:bg-espresso-900 p-5 rounded-2xl border border-stone-200 dark:border-espresso-800 shadow-sm animate-fade-in text-xs">
          <div class="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-espresso-800">
            <div>
              <h3 class="font-semibold text-stone-900 dark:text-stone-100 text-sm">Expense Categories Reference Data</h3>
              <p class="text-[11px] text-stone-500 dark:text-espresso-400">Inline quick edit mode for expense categories</p>
            </div>
            <app-button variant="brass" size="sm" (click)="addCategoryInlineRow()">+ Add Category</app-button>
          </div>

          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="text-[11px] font-semibold text-stone-500 dark:text-espresso-400 uppercase border-b border-stone-200 dark:border-espresso-800">
                <th class="py-2.5 px-3">Code</th>
                <th class="py-2.5 px-3">Category Name</th>
                <th class="py-2.5 px-3">Description</th>
                <th class="py-2.5 px-3 w-28 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200 dark:divide-espresso-800/60">
              @for (cat of categories(); track cat.id) {
                <tr class="hover:bg-stone-50/60 dark:hover:bg-espresso-800/30">
                  @if (editingCategoryId() === cat.id) {
                    <td class="p-2"><input type="text" [(ngModel)]="editCatCode" class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-300 dark:border-espresso-700 rounded px-2 py-1 text-xs font-mono uppercase" /></td>
                    <td class="p-2"><input type="text" [(ngModel)]="editCatName" class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-300 dark:border-espresso-700 rounded px-2 py-1 text-xs" /></td>
                    <td class="p-2"><input type="text" [(ngModel)]="editCatDesc" class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-300 dark:border-espresso-700 rounded px-2 py-1 text-xs" /></td>
                    <td class="p-2 text-center space-x-2">
                      <button (click)="saveCategoryInline(cat.id)" class="text-emerald-600 font-semibold hover:underline">Save</button>
                      <button (click)="cancelInlineEdit()" class="text-stone-400 hover:underline">Cancel</button>
                    </td>
                  } @else {
                    <td class="py-3 px-3 font-mono font-bold text-brass-600 dark:text-brass-400">{{ cat.code }}</td>
                    <td class="py-3 px-3 font-medium text-stone-900 dark:text-stone-100">{{ cat.name }}</td>
                    <td class="py-3 px-3 text-stone-500 dark:text-espresso-400">{{ cat.description || '—' }}</td>
                    <td class="py-3 px-3 text-center space-x-3">
                      <button (click)="startEditCategory(cat)" class="text-brass-600 dark:text-brass-400 hover:underline font-medium">Edit</button>
                      <button (click)="deleteCategory(cat.id)" class="text-rose-500 hover:underline font-medium">Delete</button>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Expense Creation/Edit Form Modal -->
      <app-form-dialog
        [isOpen]="isExpenseModalOpen()"
        title="Record Operating Expense"
        subtitle="Log an outflow expense, optional vendor supplier, and payment bank account"
        submitText="Save Expense"
        [loading]="isSubmitting()"
        [submitDisabled]="expenseForm.invalid"
        maxWidth="lg"
        (formSubmit)="saveExpense()"
        (cancel)="closeExpenseModal()"
      >
        <form [formGroup]="expenseForm" class="space-y-4 text-xs">
          
          <!-- Category & Date -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
                Expense Category <span class="text-rose-500">*</span>
              </label>
              <select
                formControlName="categoryId"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              >
                <option value="">-- Select Category --</option>
                @for (cat of categories(); track cat.id) {
                  <option [value]="cat.id">{{ cat.code }} - {{ cat.name }}</option>
                }
              </select>
            </div>

            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
                Expense Date <span class="text-rose-500">*</span>
              </label>
              <input
                type="date"
                formControlName="expenseDate"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400 font-mono"
              />
            </div>
          </div>

          <!-- Vendor Supplier (Optional) & Bank Account (Optional) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
                Vendor / Payee (Optional)
              </label>
              <select
                formControlName="vendorId"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              >
                <option value="">-- None / Direct Expense --</option>
                @for (v of vendors(); track v.id) {
                  <option [value]="v.id">{{ v.name }}</option>
                }
              </select>
            </div>

            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
                Payment Bank Account (Optional)
              </label>
              <select
                formControlName="bankAccountId"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              >
                <option value="">-- Select Payment Account --</option>
                @for (bank of bankAccountOptions; track bank.id) {
                  <option [value]="bank.id">{{ bank.name }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Amount & Tax Amount -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
                Expense Amount ($) <span class="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                formControlName="amount"
                placeholder="0.00"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              />
            </div>

            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
                Tax Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                formControlName="taxAmount"
                placeholder="0.00"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              />
            </div>
          </div>

          <!-- Reference Number -->
          <div>
            <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
              Reference / Receipt Number
            </label>
            <input
              type="text"
              formControlName="referenceNumber"
              placeholder="e.g. REC-8891 / SAAS-SEPT"
              class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
              Description / Notes
            </label>
            <textarea
              formControlName="description"
              rows="2"
              placeholder="Enter expense details or remarks..."
              class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400 resize-none"
            ></textarea>
          </div>

        </form>
      </app-form-dialog>

      <!-- Detail Overview Modal -->
      <app-form-dialog
        [isOpen]="isDetailModalOpen()"
        [title]="activeDetailExpense?.expenseNumber + ' Overview'"
        subtitle="Detailed breakdown of recorded operating expense"
        submitText="Close View"
        [submitDisabled]="false"
        maxWidth="md"
        (formSubmit)="closeDetailModal()"
        (cancel)="closeDetailModal()"
      >
        @if (activeDetailExpense) {
          <div class="space-y-4 text-xs">
            <div class="p-4 rounded-xl bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-800 flex items-center justify-between">
              <div>
                <span class="block text-[11px] font-semibold text-stone-500 uppercase">Total Paid</span>
                <app-currency-display [amount]="activeDetailExpense.totalAmount" size="md"></app-currency-display>
              </div>
              <app-status-badge [status]="activeDetailExpense.paymentStatus"></app-status-badge>
            </div>

            <div class="grid grid-cols-2 gap-4 text-stone-700 dark:text-stone-300">
              <div>
                <span class="block font-semibold text-stone-500 text-[11px] uppercase">Category</span>
                <p class="font-bold text-sm text-stone-900 dark:text-stone-100 mt-0.5">{{ activeDetailExpense.categoryName }}</p>
              </div>
              <div>
                <span class="block font-semibold text-stone-500 text-[11px] uppercase">Expense Date</span>
                <p class="font-mono text-xs mt-0.5">{{ activeDetailExpense.expenseDate }}</p>
              </div>
            </div>

            @if (activeDetailExpense.vendorName) {
              <div>
                <span class="block font-semibold text-stone-500 text-[11px] uppercase">Vendor Supplier</span>
                <p class="font-medium text-stone-900 dark:text-stone-100 mt-0.5">{{ activeDetailExpense.vendorName }}</p>
              </div>
            }

            @if (activeDetailExpense.bankAccountName) {
              <div>
                <span class="block font-semibold text-stone-500 text-[11px] uppercase">Bank Account</span>
                <p class="font-mono text-stone-900 dark:text-stone-100 mt-0.5">{{ activeDetailExpense.bankAccountName }}</p>
              </div>
            }

            @if (activeDetailExpense.description) {
              <div class="pt-2 border-t border-stone-200 dark:border-espresso-800">
                <span class="block font-semibold text-stone-500 text-[11px] uppercase">Description</span>
                <p class="text-stone-600 dark:text-stone-300 mt-0.5">{{ activeDetailExpense.description }}</p>
              </div>
            }
          </div>
        }
      </app-form-dialog>

    </div>
  `
})
export class ExpensesComponent implements OnInit {
  readonly expensesService = inject(ExpensesService);
  readonly partiesService = inject(PartiesService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly activeTab = signal<ExpensesTab>('ledger');
  readonly expenses = signal<Expense[]>([]);
  readonly categories = signal<ExpenseCategory[]>([]);
  readonly vendors = signal<Party[]>([]);

  readonly isLoading = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);

  // Inline Category Editing Signals
  readonly editingCategoryId = signal<string | null>(null);
  editCatCode = '';
  editCatName = '';
  editCatDesc = '';

  // Bank Account Options
  readonly bankAccountOptions = [
    { id: 'bank-1', name: 'Chase Business Operating Account (****4829)' },
    { id: 'bank-2', name: 'Petty Cash Custodial Fund' },
    { id: 'bank-3', name: 'Silicon Valley Savings Reserve (****9102)' }
  ];

  // Modals
  readonly isExpenseModalOpen = signal<boolean>(false);
  readonly isDetailModalOpen = signal<boolean>(false);
  activeDetailExpense: Expense | null = null;

  expenseForm: FormGroup = this.fb.group({
    categoryId: ['', Validators.required],
    vendorId: [''],
    bankAccountId: [''],
    amount: ['', [Validators.required, Validators.min(0.01)]],
    taxAmount: [0],
    expenseDate: [new Date().toISOString().split('T')[0], Validators.required],
    referenceNumber: [''],
    description: ['']
  });

  // Table Columns
  expenseTableColumns: ColumnDef<Expense>[] = [
    { key: 'expenseNumber', header: 'Expense #', width: '140px' },
    { key: 'categoryName', header: 'Category' },
    {
      key: 'vendorName',
      header: 'Vendor / Payee',
      cell: (e) => e.vendorName || 'Direct Expense'
    },
    { key: 'expenseDate', header: 'Date', width: '110px' },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      align: 'right',
      width: '130px',
      cell: (e) => `$${e.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    {
      key: 'paymentStatus',
      header: 'Status',
      align: 'center',
      width: '110px',
      cell: (e) => e.paymentStatus
    }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    this.expensesService.getCategories().subscribe(cats => this.categories.set(cats));
    this.partiesService.getVendors().subscribe(vends => this.vendors.set(vends));
    this.expensesService.getExpenses().subscribe(exp => {
      this.expenses.set(exp);
      this.isLoading.set(false);
    });
  }

  setTab(tab: ExpensesTab): void {
    this.activeTab.set(tab);
  }

  // Inline Category Editing Handlers (Mirroring ItemsComponent category pattern)
  addCategoryInlineRow(): void {
    const newId = `temp-${Date.now()}`;
    const newCat: ExpenseCategory = {
      id: newId,
      code: 'NEW',
      name: 'New Expense Category',
      description: '',
      active: true
    };
    this.categories.update(list => [...list, newCat]);
    this.startEditCategory(newCat);
  }

  startEditCategory(cat: ExpenseCategory): void {
    this.editingCategoryId.set(cat.id);
    this.editCatCode = cat.code;
    this.editCatName = cat.name;
    this.editCatDesc = cat.description || '';
  }

  cancelInlineEdit(): void {
    const currentId = this.editingCategoryId();
    if (currentId && currentId.startsWith('temp-')) {
      this.categories.update(list => list.filter(c => c.id !== currentId));
    }
    this.editingCategoryId.set(null);
  }

  saveCategoryInline(id: string): void {
    if (!this.editCatName.trim()) return;

    const catData: Partial<ExpenseCategory> = {
      code: this.editCatCode.toUpperCase(),
      name: this.editCatName,
      description: this.editCatDesc
    };

    if (id.startsWith('temp-')) {
      this.expensesService.createCategory(catData).subscribe(() => {
        this.toast.success('Expense category created', 'Category Created');
        this.editingCategoryId.set(null);
        this.loadData();
      });
    } else {
      this.expensesService.updateCategory(id, catData).subscribe(() => {
        this.toast.success('Expense category updated', 'Category Updated');
        this.editingCategoryId.set(null);
        this.loadData();
      });
    }
  }

  deleteCategory(id: string): void {
    this.expensesService.deleteCategory(id).subscribe(() => {
      this.toast.success('Expense category deleted', 'Deleted');
      this.loadData();
    });
  }

  // Expense Modal Handlers
  openCreateExpenseModal(): void {
    this.expenseForm.reset({
      categoryId: '',
      vendorId: '',
      bankAccountId: '',
      amount: '',
      taxAmount: 0,
      expenseDate: new Date().toISOString().split('T')[0],
      referenceNumber: '',
      description: ''
    });
    this.isExpenseModalOpen.set(true);
  }

  closeExpenseModal(): void {
    this.isExpenseModalOpen.set(false);
  }

  saveExpense(): void {
    if (this.expenseForm.invalid) return;

    this.isSubmitting.set(true);
    const val = this.expenseForm.value;

    const cat = this.categories().find(c => c.id === val.categoryId);
    const vend = this.vendors().find(v => v.id === val.vendorId);
    const bank = this.bankAccountOptions.find(b => b.id === val.bankAccountId);

    const req: Partial<Expense> = {
      categoryId: val.categoryId,
      categoryName: cat?.name || 'General Expense',
      vendorId: val.vendorId || undefined,
      vendorName: vend?.name,
      bankAccountId: val.bankAccountId || undefined,
      bankAccountName: bank?.name,
      amount: Number(val.amount),
      taxAmount: Number(val.taxAmount || 0),
      expenseDate: val.expenseDate,
      referenceNumber: val.referenceNumber,
      description: val.description,
      paymentStatus: 'PAID'
    };

    this.expensesService.createExpense(req).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeExpenseModal();
        this.toast.success('Operating expense recorded', 'Expense Logged');
        this.loadData();
      },
      error: () => this.isSubmitting.set(false)
    });
  }

  openExpenseDetail(expense: Expense): void {
    this.activeDetailExpense = expense;
    this.isDetailModalOpen.set(true);
  }

  closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.activeDetailExpense = null;
  }
}
