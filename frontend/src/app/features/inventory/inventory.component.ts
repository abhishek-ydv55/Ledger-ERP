import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventoryService, Warehouse, InventoryStock, InventoryMovement, StockTransfer, StockTransferRequest } from './inventory.service';
import { ItemsService, Item } from '../items/items.service';
import { ToastService } from '../../core/services/toast.service';
import { DataTableComponent, ColumnDef } from '../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { FormDialogComponent } from '../../shared/components/form-dialog/form-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

export type InventoryTab = 'stock' | 'ledger' | 'transfers' | 'warehouses';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DataTableComponent,
    StatusBadgeComponent,
    ButtonComponent,
    FormDialogComponent,
    ConfirmDialogComponent
  ],
  template: `
    <div class="space-y-6">
      
      <!-- Header Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Inventory & Warehouse Management
          </h1>
          <p class="text-xs sm:text-sm text-stone-500 dark:text-espresso-400 mt-1">
            Real-time stock snapshots, movement ledger, inter-warehouse transfers, and warehouse depots.
          </p>
        </div>

        <div class="flex items-center space-x-3">
          @if (activeTab() === 'transfers') {
            <app-button variant="brass" size="sm" (click)="openCreateTransferModal()">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
              </svg>
              New Stock Transfer
            </app-button>
          } @else if (activeTab() === 'warehouses') {
            <app-button variant="brass" size="sm" (click)="openCreateWarehouseModal()">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Add Warehouse Depot
            </app-button>
          }
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="border-b border-stone-200 dark:border-espresso-800">
        <nav class="flex space-x-8" aria-label="Inventory Tabs">
          
          <button
            (click)="setTab('stock')"
            [class.border-brass-500]="activeTab() === 'stock'"
            [class.text-brass-600]="activeTab() === 'stock'"
            [class.dark:text-brass-400]="activeTab() === 'stock'"
            [class.border-transparent]="activeTab() !== 'stock'"
            [class.text-stone-500]="activeTab() !== 'stock'"
            class="py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-150 flex items-center space-x-2 focus:outline-none"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
            </svg>
            <span>Stock-by-Warehouse ({{ filteredStock.length }})</span>
          </button>

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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span>Movements Ledger</span>
          </button>

          <button
            (click)="setTab('transfers')"
            [class.border-brass-500]="activeTab() === 'transfers'"
            [class.text-brass-600]="activeTab() === 'transfers'"
            [class.dark:text-brass-400]="activeTab() === 'transfers'"
            [class.border-transparent]="activeTab() !== 'transfers'"
            [class.text-stone-500]="activeTab() !== 'transfers'"
            class="py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-150 flex items-center space-x-2 focus:outline-none"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
            </svg>
            <span>Stock Transfers ({{ transfers().length }})</span>
          </button>

          <button
            (click)="setTab('warehouses')"
            [class.border-brass-500]="activeTab() === 'warehouses'"
            [class.text-brass-600]="activeTab() === 'warehouses'"
            [class.dark:text-brass-400]="activeTab() === 'warehouses'"
            [class.border-transparent]="activeTab() !== 'warehouses'"
            [class.text-stone-500]="activeTab() !== 'warehouses'"
            class="py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-150 flex items-center space-x-2 focus:outline-none"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-6 0h6"/>
            </svg>
            <span>Warehouse Depots ({{ warehouses().length }})</span>
          </button>

        </nav>
      </div>

      <!-- TAB 1: Stock-by-Warehouse View -->
      @if (activeTab() === 'stock') {
        <div class="space-y-4 animate-fade-in">
          <!-- Filter Controls -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-espresso-900 p-4 rounded-xl border border-stone-200 dark:border-espresso-800 text-xs">
            <div class="flex items-center space-x-2 w-full sm:w-auto">
              <span class="text-stone-500 font-medium">Filter Warehouse:</span>
              <select
                [value]="selectedWarehouseFilter()"
                (change)="onWarehouseFilterChange($event)"
                class="bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              >
                <option value="ALL">All Warehouses ({{ warehouses().length }})</option>
                @for (wh of warehouses(); track wh.id) {
                  <option [value]="wh.id">{{ wh.name }} ({{ wh.code }})</option>
                }
              </select>
            </div>

            <div class="w-full sm:w-64">
              <input
                type="text"
                [value]="stockSearchQuery()"
                (input)="onStockSearchInput($event)"
                placeholder="Search SKU code or item title..."
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              />
            </div>
          </div>

          <!-- Stock Table -->
          <app-data-table
            [data]="filteredStock"
            [columns]="stockTableColumns"
            [loading]="isLoading()"
            emptyTitle="No stock records"
            emptyMessage="No inventory stock found matching your filter selection."
          ></app-data-table>
        </div>
      }

      <!-- TAB 2: Read-Only Inventory Movements Ledger View -->
      @if (activeTab() === 'ledger') {
        <div class="space-y-4 bg-white dark:bg-espresso-900 p-5 rounded-2xl border border-stone-200 dark:border-espresso-800 shadow-xs animate-fade-in">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-espresso-800 pb-3">
            <div>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
                <span>Inventory Movements Ledger</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-stone-100 dark:bg-espresso-800 text-stone-600 dark:text-stone-300">
                  Read-Only Audit Ledger
                </span>
              </h3>
              <p class="text-xs text-stone-500 dark:text-espresso-400 mt-0.5">
                Complete transactional audit trail of all stock movements, receipts, issues, and transfers
              </p>
            </div>
          </div>

          <!-- Ledger Movements Table -->
          <div class="overflow-x-auto rounded-xl border border-stone-200 dark:border-espresso-800">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-stone-50 dark:bg-espresso-950 border-b border-stone-200 dark:border-espresso-800 text-[11px] font-semibold text-stone-500 dark:text-espresso-400 uppercase tracking-wider">
                  <th class="py-3 px-4">Date / Time</th>
                  <th class="py-3 px-4">Movement Type</th>
                  <th class="py-3 px-4">Reference #</th>
                  <th class="py-3 px-4">Item SKU & Name</th>
                  <th class="py-3 px-4">Warehouse Depot</th>
                  <th class="py-3 px-4 text-right font-mono">Qty Moved</th>
                  <th class="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-200 dark:divide-espresso-800/60 font-mono">
                @for (mov of movements(); track mov.id) {
                  <tr class="hover:bg-stone-50/60 dark:hover:bg-espresso-800/30 font-mono">
                    <td class="py-3 px-4 text-stone-500 dark:text-espresso-400 text-[11px]">
                      {{ mov.movementDate | date:'medium' }}
                    </td>
                    <td class="py-3 px-4">
                      <app-status-badge [status]="mov.type" size="sm"></app-status-badge>
                    </td>
                    <td class="py-3 px-4 font-bold text-stone-900 dark:text-stone-100">
                      {{ mov.referenceNo }}
                    </td>
                    <td class="py-3 px-4">
                      <span class="font-bold text-stone-900 dark:text-stone-100">{{ mov.itemSku }}</span>
                      <span class="text-stone-500 ml-1.5 font-sans">({{ mov.itemName }})</span>
                    </td>
                    <td class="py-3 px-4 font-sans text-stone-700 dark:text-stone-300">
                      {{ mov.warehouseName }}
                    </td>
                    <td class="py-3 px-4 text-right font-bold text-sm" [class.text-emerald-600]="mov.quantity > 0" [class.text-rose-600]="mov.quantity < 0">
                      {{ mov.quantity > 0 ? '+' : '' }}{{ mov.quantity }}
                    </td>
                    <td class="py-3 px-4 font-sans text-stone-500 dark:text-espresso-400 text-[11px]">
                      {{ mov.notes || '—' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- TAB 3: Stock Transfers Flow -->
      @if (activeTab() === 'transfers') {
        <div class="space-y-4 animate-fade-in">
          <app-data-table
            [data]="transfers()"
            [columns]="transferTableColumns"
            [loading]="isLoading()"
            emptyTitle="No stock transfers"
            emptyMessage="No inter-warehouse stock transfers found."
          ></app-data-table>
        </div>
      }

      <!-- TAB 4: Warehouse Depots Directory -->
      @if (activeTab() === 'warehouses') {
        <div class="space-y-4 animate-fade-in">
          <app-data-table
            [data]="warehouses()"
            [columns]="warehouseTableColumns"
            [loading]="isLoading()"
            emptyTitle="No warehouse depots"
            emptyMessage="No warehouse locations created."
          ></app-data-table>
        </div>
      }

      <!-- Stock Transfer Creation Modal -->
      <app-form-dialog
        [isOpen]="isTransferModalOpen()"
        title="Create Inter-Warehouse Stock Transfer"
        subtitle="Specify origin warehouse, target destination, and item quantities to move"
        submitText="Create Transfer"
        [loading]="isSubmitting()"
        [submitDisabled]="transferForm.invalid"
        maxWidth="2xl"
        (formSubmit)="saveTransfer()"
        (cancel)="closeTransferModal()"
      >
        <form [formGroup]="transferForm" class="space-y-4 text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Source Warehouse -->
            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
                Origin Warehouse (Source) <span class="text-rose-500">*</span>
              </label>
              <select
                formControlName="sourceWarehouseId"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              >
                <option value="">-- Select Source Depot --</option>
                @for (wh of warehouses(); track wh.id) {
                  <option [value]="wh.id">{{ wh.name }} ({{ wh.code }})</option>
                }
              </select>
            </div>

            <!-- Target Warehouse -->
            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
                Destination Warehouse (Target) <span class="text-rose-500">*</span>
              </label>
              <select
                formControlName="targetWarehouseId"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              >
                <option value="">-- Select Destination Depot --</option>
                @for (wh of warehouses(); track wh.id) {
                  <option [value]="wh.id">{{ wh.name }} ({{ wh.code }})</option>
                }
              </select>
            </div>
          </div>

          <div>
            <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
              Transfer Reason / Notes
            </label>
            <input
              type="text"
              formControlName="notes"
              placeholder="e.g. Monthly stock rebalancing between hubs"
              class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
            />
          </div>

          <!-- Repeating Row Items Editor -->
          <div class="space-y-3 pt-2 border-t border-stone-200 dark:border-espresso-800">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-stone-800 dark:text-stone-200">Transfer Line Items</span>
              <button
                (click)="addTransferItemRow()"
                type="button"
                class="px-2 py-1 rounded bg-stone-100 dark:bg-espresso-800 hover:bg-brass-500/10 text-brass-600 dark:text-brass-400 font-semibold text-xs transition-colors"
              >
                + Add Item Line
              </button>
            </div>

            <div formArrayName="items" class="space-y-2">
              @for (row of transferItemsFormArray.controls; track row; let idx = $index) {
                <div [formGroupName]="idx" class="flex items-center space-x-3 bg-stone-50 dark:bg-espresso-950 p-2.5 rounded-lg border border-stone-200 dark:border-espresso-800">
                  <div class="flex-1">
                    <select
                      formControlName="itemId"
                      class="w-full bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-700 rounded-md px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brass-400"
                    >
                      <option value="">-- Select Item SKU --</option>
                      @for (item of availableItems(); track item.id) {
                        <option [value]="item.id">{{ item.name }} ({{ item.sku }})</option>
                      }
                    </select>
                  </div>

                  <div class="w-28">
                    <input
                      type="number"
                      min="1"
                      formControlName="quantity"
                      placeholder="Qty"
                      class="w-full text-right bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-700 rounded-md px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:ring-1 focus:ring-brass-400"
                    />
                  </div>

                  <button
                    (click)="removeTransferItemRow(idx)"
                    [disabled]="transferItemsFormArray.length <= 1"
                    type="button"
                    class="p-1 text-stone-400 hover:text-rose-500 disabled:opacity-30 transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              }
            </div>
          </div>
        </form>
      </app-form-dialog>

      <!-- Warehouse Form Modal -->
      <app-form-dialog
        [isOpen]="isWarehouseModalOpen()"
        [title]="selectedWarehouse() ? 'Edit Warehouse Depot' : 'Create Warehouse Depot'"
        subtitle="Specify warehouse code, physical address, and assigned manager"
        [submitText]="selectedWarehouse() ? 'Save Warehouse' : 'Create Depot'"
        [loading]="isSubmitting()"
        [submitDisabled]="warehouseForm.invalid"
        (formSubmit)="saveWarehouse()"
        (cancel)="closeWarehouseModal()"
      >
        <form [formGroup]="warehouseForm" class="space-y-4 text-xs">
          <div>
            <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
              Warehouse Name <span class="text-rose-500">*</span>
            </label>
            <input
              type="text"
              formControlName="name"
              placeholder="e.g. Main Central Logistics Hub"
              class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
            />
          </div>

          <div>
            <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
              Warehouse Code <span class="text-rose-500">*</span>
            </label>
            <input
              type="text"
              formControlName="code"
              placeholder="e.g. WH-CENTRAL"
              class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brass-400"
            />
          </div>

          <div>
            <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">Address</label>
            <input
              type="text"
              formControlName="address"
              placeholder="100 Industrial Parkway, Chicago IL"
              class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">Manager Name</label>
              <input
                type="text"
                formControlName="managerName"
                placeholder="Robert Vance"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              />
            </div>
            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">Contact Phone</label>
              <input
                type="text"
                formControlName="phone"
                placeholder="+1 (555) 321-9876"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              />
            </div>
          </div>
        </form>
      </app-form-dialog>

    </div>
  `
})
export class InventoryComponent implements OnInit {
  readonly inventoryService = inject(InventoryService);
  readonly itemsService = inject(ItemsService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly activeTab = signal<InventoryTab>('stock');
  readonly warehouses = signal<Warehouse[]>([]);
  readonly stockList = signal<InventoryStock[]>([]);
  readonly movements = signal<InventoryMovement[]>([]);
  readonly transfers = signal<StockTransfer[]>([]);
  readonly availableItems = signal<Item[]>([]);

  readonly isLoading = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);

  // Filters
  readonly selectedWarehouseFilter = signal<string>('ALL');
  readonly stockSearchQuery = signal<string>('');

  // Modals
  readonly isTransferModalOpen = signal<boolean>(false);
  readonly isWarehouseModalOpen = signal<boolean>(false);
  readonly selectedWarehouse = signal<Warehouse | null>(null);

  transferForm: FormGroup = this.fb.group({
    sourceWarehouseId: ['', Validators.required],
    targetWarehouseId: ['', Validators.required],
    notes: [''],
    items: this.fb.array([])
  });

  warehouseForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
    address: [''],
    managerName: [''],
    phone: [''],
    active: [true]
  });

  // Columns for Stock-by-Warehouse Table
  stockTableColumns: ColumnDef<InventoryStock>[] = [
    { key: 'itemSku', header: 'SKU Code', width: '130px' },
    { key: 'itemName', header: 'Item Title', width: '240px' },
    { key: 'warehouseName', header: 'Warehouse Location' },
    {
      key: 'quantityOnHand',
      header: 'On Hand',
      align: 'right',
      width: '110px',
      cell: (s) => s.quantityOnHand
    },
    {
      key: 'reservedQuantity',
      header: 'Reserved',
      align: 'right',
      width: '110px',
      cell: (s) => s.reservedQuantity
    },
    {
      key: 'availableQuantity',
      header: 'Available',
      align: 'right',
      width: '110px',
      cell: (s) => s.availableQuantity
    }
  ];

  // Columns for Stock Transfers Table
  transferTableColumns: ColumnDef<StockTransfer>[] = [
    { key: 'transferNo', header: 'Transfer #', width: '150px' },
    { key: 'sourceWarehouseName', header: 'Origin Warehouse' },
    { key: 'targetWarehouseName', header: 'Destination Warehouse' },
    { key: 'transferDate', header: 'Date', width: '120px' },
    {
      key: 'itemsCount',
      header: 'Line Items',
      align: 'center',
      width: '100px',
      cell: (t) => `${t.items?.length || 0} items`
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      width: '120px',
      cell: (t) => t.status
    }
  ];

  // Columns for Warehouses Table
  warehouseTableColumns: ColumnDef<Warehouse>[] = [
    { key: 'code', header: 'Code', width: '140px' },
    { key: 'name', header: 'Depot Name', width: '220px' },
    { key: 'address', header: 'Location Address' },
    { key: 'managerName', header: 'Warehouse Manager', width: '160px' },
    { key: 'phone', header: 'Contact Phone', width: '140px' },
    {
      key: 'active',
      header: 'Status',
      align: 'center',
      width: '100px',
      cell: (w) => w.active ? 'ACTIVE' : 'INACTIVE'
    }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    this.inventoryService.getWarehouses().subscribe(whs => this.warehouses.set(whs));
    this.inventoryService.getStock().subscribe(stk => this.stockList.set(stk));
    this.inventoryService.getMovements().subscribe(movs => this.movements.set(movs));
    this.inventoryService.getStockTransfers().subscribe(trfs => this.transfers.set(trfs));
    this.itemsService.getItems().subscribe(items => {
      this.availableItems.set(items);
      this.isLoading.set(false);
    });
  }

  setTab(tab: InventoryTab): void {
    this.activeTab.set(tab);
  }

  get filteredStock(): InventoryStock[] {
    let list = this.stockList();
    const whFilter = this.selectedWarehouseFilter();
    const query = this.stockSearchQuery().toLowerCase().trim();

    if (whFilter !== 'ALL') {
      list = list.filter(s => s.warehouseId === whFilter);
    }

    if (query) {
      list = list.filter(s =>
        s.itemSku.toLowerCase().includes(query) ||
        s.itemName.toLowerCase().includes(query)
      );
    }

    return list;
  }

  onWarehouseFilterChange(event: Event): void {
    this.selectedWarehouseFilter.set((event.target as HTMLSelectElement).value);
  }

  onStockSearchInput(event: Event): void {
    this.stockSearchQuery.set((event.target as HTMLInputElement).value);
  }

  // Stock Transfer Modal Logic
  get transferItemsFormArray(): FormArray {
    return this.transferForm.get('items') as FormArray;
  }

  openCreateTransferModal(): void {
    this.transferForm.reset({
      sourceWarehouseId: '',
      targetWarehouseId: '',
      notes: ''
    });
    this.transferItemsFormArray.clear();
    this.addTransferItemRow();
    this.isTransferModalOpen.set(true);
  }

  closeTransferModal(): void {
    this.isTransferModalOpen.set(false);
  }

  addTransferItemRow(): void {
    this.transferItemsFormArray.push(this.fb.group({
      itemId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
    }));
  }

  removeTransferItemRow(idx: number): void {
    if (this.transferItemsFormArray.length > 1) {
      this.transferItemsFormArray.removeAt(idx);
    }
  }

  saveTransfer(): void {
    if (this.transferForm.invalid) return;

    this.isSubmitting.set(true);
    const formVal = this.transferForm.value;
    const req: StockTransferRequest = {
      sourceWarehouseId: formVal.sourceWarehouseId,
      targetWarehouseId: formVal.targetWarehouseId,
      notes: formVal.notes,
      items: formVal.items
    };

    this.inventoryService.createStockTransfer(req).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeTransferModal();
        this.toast.success('Stock transfer created in DRAFT state', 'Transfer Created');
        this.loadData();
      },
      error: () => this.isSubmitting.set(false)
    });
  }

  // Warehouse Modal Logic
  openCreateWarehouseModal(): void {
    this.selectedWarehouse.set(null);
    this.warehouseForm.reset({ active: true });
    this.isWarehouseModalOpen.set(true);
  }

  closeWarehouseModal(): void {
    this.isWarehouseModalOpen.set(false);
  }

  saveWarehouse(): void {
    if (this.warehouseForm.invalid) return;

    this.isSubmitting.set(true);
    const formVal = this.warehouseForm.value;
    const wh = this.selectedWarehouse();

    if (wh) {
      this.inventoryService.updateWarehouse(wh.id, formVal).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeWarehouseModal();
          this.toast.success('Warehouse updated successfully', 'Success');
          this.loadData();
        },
        error: () => this.isSubmitting.set(false)
      });
    } else {
      this.inventoryService.createWarehouse(formVal).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeWarehouseModal();
          this.toast.success('New warehouse depot added', 'Success');
          this.loadData();
        },
        error: () => this.isSubmitting.set(false)
      });
    }
  }
}
