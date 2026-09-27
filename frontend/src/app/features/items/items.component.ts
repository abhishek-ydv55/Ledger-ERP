import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { ItemsService, Item, ItemCategory, Unit, TaxRate, ItemRequest } from './items.service';
import { ToastService } from '../../core/services/toast.service';
import { DataTableComponent, ColumnDef } from '../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { CurrencyDisplayComponent } from '../../shared/components/currency-display/currency-display.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { FormDialogComponent } from '../../shared/components/form-dialog/form-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

export type ItemTab = 'items' | 'categories' | 'units' | 'taxes';

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DataTableComponent,
    StatusBadgeComponent,
    CurrencyDisplayComponent,
    ButtonComponent,
    FormDialogComponent,
    ConfirmDialogComponent
  ],
  template: `
    <div class="space-y-6">
      
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Items & Product Master
          </h1>
          <p class="text-xs sm:text-sm text-stone-500 dark:text-espresso-400 mt-1">
            Product catalog, SKU pricing, units of measure, tax rates, and category mappings.
          </p>
        </div>

        @if (activeTab() === 'items') {
          <app-button variant="brass" size="sm" (click)="openCreateItemModal()">
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add New Item
          </app-button>
        }
      </div>

      <!-- Navigation Tabs -->
      <div class="border-b border-stone-200 dark:border-espresso-800">
        <nav class="flex space-x-8" aria-label="Items Sub Tabs">
          <button
            (click)="setTab('items')"
            [class.border-brass-500]="activeTab() === 'items'"
            [class.text-brass-600]="activeTab() === 'items'"
            [class.dark:text-brass-400]="activeTab() === 'items'"
            [class.border-transparent]="activeTab() !== 'items'"
            [class.text-stone-500]="activeTab() !== 'items'"
            class="py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-150 flex items-center space-x-2 focus:outline-none"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
            <span>SKU Items Catalog ({{ items().length }})</span>
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 11h.01M7 15h.01M11 7h8M11 11h8M11 15h8"/>
            </svg>
            <span>Categories ({{ categories().length }})</span>
          </button>

          <button
            (click)="setTab('units')"
            [class.border-brass-500]="activeTab() === 'units'"
            [class.text-brass-600]="activeTab() === 'units'"
            [class.dark:text-brass-400]="activeTab() === 'units'"
            [class.border-transparent]="activeTab() !== 'units'"
            [class.text-stone-500]="activeTab() !== 'units'"
            class="py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-150 flex items-center space-x-2 focus:outline-none"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>
            </svg>
            <span>Units of Measure ({{ units().length }})</span>
          </button>

          <button
            (click)="setTab('taxes')"
            [class.border-brass-500]="activeTab() === 'taxes'"
            [class.text-brass-600]="activeTab() === 'taxes'"
            [class.dark:text-brass-400]="activeTab() === 'taxes'"
            [class.border-transparent]="activeTab() !== 'taxes'"
            [class.text-stone-500]="activeTab() !== 'taxes'"
            class="py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-150 flex items-center space-x-2 focus:outline-none"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Tax Rates ({{ taxRates().length }})</span>
          </button>
        </nav>
      </div>

      <!-- TAB 1: Items DataTable -->
      @if (activeTab() === 'items') {
        <div class="space-y-4 animate-fade-in">
          <app-data-table
            [data]="items()"
            [columns]="itemTableColumns"
            [loading]="isLoading()"
            emptyTitle="No items created"
            emptyMessage="No product items or raw materials in the SKU master."
          ></app-data-table>
        </div>
      }

      <!-- TAB 2: Categories Compact List with Inline Editing -->
      @if (activeTab() === 'categories') {
        <div class="space-y-4 bg-white dark:bg-espresso-900 p-5 rounded-2xl border border-stone-200 dark:border-espresso-800 shadow-xs animate-fade-in text-xs">
          <div class="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-espresso-800">
            <div>
              <h3 class="font-semibold text-stone-900 dark:text-stone-100">Item Categories Reference Data</h3>
              <p class="text-[11px] text-stone-500 dark:text-espresso-400">Inline quick edit mode for categories</p>
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
                    <td class="py-3 px-3 font-mono font-medium text-stone-900 dark:text-stone-100">{{ cat.code }}</td>
                    <td class="py-3 px-3 font-medium">{{ cat.name }}</td>
                    <td class="py-3 px-3 text-stone-500 dark:text-espresso-400">{{ cat.description || '—' }}</td>
                    <td class="py-3 px-3 text-center space-x-3">
                      <button (click)="startEditCategory(cat)" class="text-brass-600 dark:text-brass-400 hover:underline">Edit</button>
                      <button (click)="deleteCategory(cat.id)" class="text-rose-500 hover:underline">Delete</button>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- TAB 3: Units of Measure Compact List with Inline Editing -->
      @if (activeTab() === 'units') {
        <div class="space-y-4 bg-white dark:bg-espresso-900 p-5 rounded-2xl border border-stone-200 dark:border-espresso-800 shadow-xs animate-fade-in text-xs">
          <div class="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-espresso-800">
            <div>
              <h3 class="font-semibold text-stone-900 dark:text-stone-100">Units of Measure Reference Data</h3>
              <p class="text-[11px] text-stone-500 dark:text-espresso-400">Inline quick edit mode for measurement units</p>
            </div>
            <app-button variant="brass" size="sm" (click)="addUnitInlineRow()">+ Add Unit</app-button>
          </div>

          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="text-[11px] font-semibold text-stone-500 dark:text-espresso-400 uppercase border-b border-stone-200 dark:border-espresso-800">
                <th class="py-2.5 px-3">Code</th>
                <th class="py-2.5 px-3">Unit Name</th>
                <th class="py-2.5 px-3">Symbol</th>
                <th class="py-2.5 px-3 w-28 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200 dark:divide-espresso-800/60">
              @for (unit of units(); track unit.id) {
                <tr class="hover:bg-stone-50/60 dark:hover:bg-espresso-800/30">
                  @if (editingUnitId() === unit.id) {
                    <td class="p-2"><input type="text" [(ngModel)]="editUnitCode" class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-300 dark:border-espresso-700 rounded px-2 py-1 text-xs font-mono uppercase" /></td>
                    <td class="p-2"><input type="text" [(ngModel)]="editUnitName" class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-300 dark:border-espresso-700 rounded px-2 py-1 text-xs" /></td>
                    <td class="p-2"><input type="text" [(ngModel)]="editUnitSymbol" class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-300 dark:border-espresso-700 rounded px-2 py-1 text-xs font-mono" /></td>
                    <td class="p-2 text-center space-x-2">
                      <button (click)="saveUnitInline(unit.id)" class="text-emerald-600 font-semibold hover:underline">Save</button>
                      <button (click)="cancelInlineEdit()" class="text-stone-400 hover:underline">Cancel</button>
                    </td>
                  } @else {
                    <td class="py-3 px-3 font-mono font-medium text-stone-900 dark:text-stone-100">{{ unit.code }}</td>
                    <td class="py-3 px-3 font-medium">{{ unit.name }}</td>
                    <td class="py-3 px-3 font-mono text-stone-500 dark:text-espresso-400">{{ unit.symbol || '—' }}</td>
                    <td class="py-3 px-3 text-center space-x-3">
                      <button (click)="startEditUnit(unit)" class="text-brass-600 dark:text-brass-400 hover:underline">Edit</button>
                      <button (click)="deleteUnit(unit.id)" class="text-rose-500 hover:underline">Delete</button>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- TAB 4: Tax Rates Compact List with Inline Editing -->
      @if (activeTab() === 'taxes') {
        <div class="space-y-4 bg-white dark:bg-espresso-900 p-5 rounded-2xl border border-stone-200 dark:border-espresso-800 shadow-xs animate-fade-in text-xs">
          <div class="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-espresso-800">
            <div>
              <h3 class="font-semibold text-stone-900 dark:text-stone-100">Tax Rates Reference Data</h3>
              <p class="text-[11px] text-stone-500 dark:text-espresso-400">Inline quick edit mode for sales/purchase tax rates</p>
            </div>
            <app-button variant="brass" size="sm" (click)="addTaxRateInlineRow()">+ Add Tax Rate</app-button>
          </div>

          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="text-[11px] font-semibold text-stone-500 dark:text-espresso-400 uppercase border-b border-stone-200 dark:border-espresso-800">
                <th class="py-2.5 px-3">Code</th>
                <th class="py-2.5 px-3">Tax Title</th>
                <th class="py-2.5 px-3 font-mono text-right">Rate %</th>
                <th class="py-2.5 px-3 w-28 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200 dark:divide-espresso-800/60">
              @for (tax of taxRates(); track tax.id) {
                <tr class="hover:bg-stone-50/60 dark:hover:bg-espresso-800/30">
                  @if (editingTaxId() === tax.id) {
                    <td class="p-2"><input type="text" [(ngModel)]="editTaxCode" class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-300 dark:border-espresso-700 rounded px-2 py-1 text-xs font-mono uppercase" /></td>
                    <td class="p-2"><input type="text" [(ngModel)]="editTaxName" class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-300 dark:border-espresso-700 rounded px-2 py-1 text-xs" /></td>
                    <td class="p-2 text-right"><input type="number" step="0.1" [(ngModel)]="editTaxRate" class="w-24 text-right bg-stone-50 dark:bg-espresso-950 border border-stone-300 dark:border-espresso-700 rounded px-2 py-1 text-xs font-mono" /></td>
                    <td class="p-2 text-center space-x-2">
                      <button (click)="saveTaxRateInline(tax.id)" class="text-emerald-600 font-semibold hover:underline">Save</button>
                      <button (click)="cancelInlineEdit()" class="text-stone-400 hover:underline">Cancel</button>
                    </td>
                  } @else {
                    <td class="py-3 px-3 font-mono font-medium text-stone-900 dark:text-stone-100">{{ tax.code }}</td>
                    <td class="py-3 px-3 font-medium">{{ tax.name }}</td>
                    <td class="py-3 px-3 font-mono text-right font-bold text-stone-900 dark:text-stone-100">{{ tax.rate }}%</td>
                    <td class="py-3 px-3 text-center space-x-3">
                      <button (click)="startEditTax(tax)" class="text-brass-600 dark:text-brass-400 hover:underline">Edit</button>
                      <button (click)="deleteTaxRate(tax.id)" class="text-rose-500 hover:underline">Delete</button>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Item Form Modal -->
      <app-form-dialog
        [isOpen]="isItemModalOpen()"
        [title]="selectedItem() ? 'Edit Product Item' : 'Create New Item'"
        [subtitle]="'Configure SKU code, pricing, category, unit, and tax rules'"
        [submitText]="selectedItem() ? 'Save Item' : 'Create Item'"
        [loading]="isSubmitting()"
        [submitDisabled]="itemForm.invalid"
        maxWidth="xl"
        (formSubmit)="saveItem()"
        (cancel)="closeItemModal()"
      >
        <form [formGroup]="itemForm" class="space-y-4 text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Name -->
            <div class="sm:col-span-2">
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
                Item / Product Title <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                formControlName="name"
                placeholder="e.g. High Performance Server Blade X1"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              />
            </div>

            <!-- SKU -->
            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
                SKU / Code <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                formControlName="sku"
                placeholder="SKU-ELEC-001"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brass-400"
              />
            </div>

            <!-- Category -->
            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">Category</label>
              <select
                formControlName="categoryId"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              >
                <option value="">-- Select Category --</option>
                @for (cat of categories(); track cat.id) {
                  <option [value]="cat.id">{{ cat.name }}</option>
                }
              </select>
            </div>

            <!-- Unit of Measure -->
            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">Unit of Measure</label>
              <select
                formControlName="unitId"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              >
                <option value="">-- Select Unit --</option>
                @for (u of units(); track u.id) {
                  <option [value]="u.id">{{ u.name }} ({{ u.code }})</option>
                }
              </select>
            </div>

            <!-- Tax Rate -->
            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">Tax Rate Rule</label>
              <select
                formControlName="taxRateId"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              >
                <option value="">-- Select Tax Rate --</option>
                @for (t of taxRates(); track t.id) {
                  <option [value]="t.id">{{ t.name }} ({{ t.rate }}%)</option>
                }
              </select>
            </div>

            <!-- Sale Price -->
            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">Selling Price ($) <span class="text-rose-500">*</span></label>
              <input
                type="number"
                min="0"
                step="0.01"
                formControlName="salePrice"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:ring-2 focus:ring-brass-400"
              />
            </div>

            <!-- Purchase Price -->
            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">Purchase Price ($) <span class="text-rose-500">*</span></label>
              <input
                type="number"
                min="0"
                step="0.01"
                formControlName="purchasePrice"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:ring-2 focus:ring-brass-400"
              />
            </div>
          </div>
        </form>
      </app-form-dialog>

    </div>
  `
})
export class ItemsComponent implements OnInit {
  readonly itemsService = inject(ItemsService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly activeTab = signal<ItemTab>('items');
  readonly items = signal<Item[]>([]);
  readonly categories = signal<ItemCategory[]>([]);
  readonly units = signal<Unit[]>([]);
  readonly taxRates = signal<TaxRate[]>([]);

  readonly isLoading = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);
  readonly isItemModalOpen = signal<boolean>(false);
  readonly selectedItem = signal<Item | null>(null);

  // Inline edit state
  editingCategoryId = signal<string | null>(null);
  editCatName = ''; editCatCode = ''; editCatDesc = '';

  editingUnitId = signal<string | null>(null);
  editUnitName = ''; editUnitCode = ''; editUnitSymbol = '';

  editingTaxId = signal<string | null>(null);
  editTaxName = ''; editTaxCode = ''; editTaxRate = 0;

  itemForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    sku: ['', Validators.required],
    description: [''],
    categoryId: [''],
    unitId: [''],
    taxRateId: [''],
    salePrice: [0, [Validators.required, Validators.min(0)]],
    purchasePrice: [0, [Validators.required, Validators.min(0)]]
  });

  itemTableColumns: ColumnDef<Item>[] = [
    { key: 'sku', header: 'SKU Code', width: '140px' },
    { key: 'name', header: 'Product Name', width: '240px' },
    { key: 'categoryName', header: 'Category' },
    { key: 'unitCode', header: 'Unit', align: 'center', width: '90px' },
    {
      key: 'salePrice',
      header: 'Selling Price',
      align: 'right',
      width: '130px',
      cell: (i) => `$${i.salePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    {
      key: 'taxRate',
      header: 'Tax %',
      align: 'right',
      width: '90px',
      cell: (i) => `${i.taxRate || 0}%`
    },
    {
      key: 'active',
      header: 'Status',
      align: 'center',
      width: '100px',
      cell: (i) => i.active ? 'ACTIVE' : 'INACTIVE'
    }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.itemsService.getItems().subscribe(items => this.items.set(items));
    this.itemsService.getCategories().subscribe(cats => this.categories.set(cats));
    this.itemsService.getUnits().subscribe(units => this.units.set(units));
    this.itemsService.getTaxRates().subscribe(taxes => {
      this.taxRates.set(taxes);
      this.isLoading.set(false);
    });
  }

  setTab(tab: ItemTab): void {
    this.activeTab.set(tab);
    this.cancelInlineEdit();
  }

  openCreateItemModal(): void {
    this.selectedItem.set(null);
    this.itemForm.reset({ salePrice: 0, purchasePrice: 0 });
    this.isItemModalOpen.set(true);
  }

  closeItemModal(): void {
    this.isItemModalOpen.set(false);
  }

  saveItem(): void {
    if (this.itemForm.invalid) return;

    this.isSubmitting.set(true);
    const req: ItemRequest = this.itemForm.value;
    const item = this.selectedItem();

    if (item) {
      this.itemsService.updateItem(item.id, req).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeItemModal();
          this.toast.success('Item updated successfully', 'Success');
          this.loadData();
        },
        error: () => this.isSubmitting.set(false)
      });
    } else {
      this.itemsService.createItem(req).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeItemModal();
          this.toast.success('Product item created', 'Success');
          this.loadData();
        },
        error: () => this.isSubmitting.set(false)
      });
    }
  }

  // Categories Inline Editing
  addCategoryInlineRow(): void {
    const newCat: ItemCategory = { id: `cat-new-${Date.now()}`, name: 'New Category', code: 'NEW_CAT', description: '' };
    this.categories.update(current => [newCat, ...current]);
    this.startEditCategory(newCat);
  }

  startEditCategory(cat: ItemCategory): void {
    this.editingCategoryId.set(cat.id);
    this.editCatName = cat.name;
    this.editCatCode = cat.code;
    this.editCatDesc = cat.description || '';
  }

  saveCategoryInline(id: string): void {
    const cat: ItemCategory = { id, name: this.editCatName, code: this.editCatCode, description: this.editCatDesc };
    this.itemsService.saveCategory(cat).subscribe(() => {
      this.editingCategoryId.set(null);
      this.toast.success('Category saved', 'Saved');
      this.loadData();
    });
  }

  deleteCategory(id: string): void {
    this.itemsService.deleteCategory(id).subscribe(() => {
      this.toast.success('Category removed', 'Deleted');
      this.loadData();
    });
  }

  // Units Inline Editing
  addUnitInlineRow(): void {
    const newUnit: Unit = { id: `unit-new-${Date.now()}`, name: 'New Unit', code: 'UNIT', symbol: 'u' };
    this.units.update(current => [newUnit, ...current]);
    this.startEditUnit(newUnit);
  }

  startEditUnit(unit: Unit): void {
    this.editingUnitId.set(unit.id);
    this.editUnitName = unit.name;
    this.editUnitCode = unit.code;
    this.editUnitSymbol = unit.symbol || '';
  }

  saveUnitInline(id: string): void {
    const unit: Unit = { id, name: this.editUnitName, code: this.editUnitCode, symbol: this.editUnitSymbol };
    this.itemsService.saveUnit(unit).subscribe(() => {
      this.editingUnitId.set(null);
      this.toast.success('Unit saved', 'Saved');
      this.loadData();
    });
  }

  deleteUnit(id: string): void {
    this.itemsService.deleteUnit(id).subscribe(() => {
      this.toast.success('Unit removed', 'Deleted');
      this.loadData();
    });
  }

  // Tax Rates Inline Editing
  addTaxRateInlineRow(): void {
    const newTax: TaxRate = { id: `tax-new-${Date.now()}`, name: 'New Tax Rate', code: 'TAX_NEW', rate: 10 };
    this.taxRates.update(current => [newTax, ...current]);
    this.startEditTax(newTax);
  }

  startEditTax(tax: TaxRate): void {
    this.editingTaxId.set(tax.id);
    this.editTaxName = tax.name;
    this.editTaxCode = tax.code;
    this.editTaxRate = tax.rate;
  }

  saveTaxRateInline(id: string): void {
    const tax: TaxRate = { id, name: this.editTaxName, code: this.editTaxCode, rate: Number(this.editTaxRate) || 0 };
    this.itemsService.saveTaxRate(tax).subscribe(() => {
      this.editingTaxId.set(null);
      this.toast.success('Tax rate saved', 'Saved');
      this.loadData();
    });
  }

  deleteTaxRate(id: string): void {
    this.itemsService.deleteTaxRate(id).subscribe(() => {
      this.toast.success('Tax rate removed', 'Deleted');
      this.loadData();
    });
  }

  cancelInlineEdit(): void {
    this.editingCategoryId.set(null);
    this.editingUnitId.set(null);
    this.editingTaxId.set(null);
  }
}
