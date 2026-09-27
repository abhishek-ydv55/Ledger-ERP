import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PurchasesService, PurchaseOrder, Bill, PurchaseOrderStatus, BillStatus } from './purchases.service';
import { PartiesService, Party } from '../parties/parties.service';
import { ItemsService, Item } from '../items/items.service';
import { ToastService } from '../../core/services/toast.service';
import { DataTableComponent, ColumnDef } from '../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { CurrencyDisplayComponent } from '../../shared/components/currency-display/currency-display.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { FormDialogComponent } from '../../shared/components/form-dialog/form-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LineItemEditorComponent, LineItemConfig, LineItemTotals } from '../../shared/components/line-item-editor/line-item-editor.component';
import { OrderStatusActionsComponent } from '../../shared/components/order-status-actions/order-status-actions.component';

export type PurchasesTab = 'orders' | 'bills';

@Component({
  selector: 'app-purchases',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    DataTableComponent,
    StatusBadgeComponent,
    CurrencyDisplayComponent,
    ButtonComponent,
    FormDialogComponent,
    ConfirmDialogComponent,
    LineItemEditorComponent,
    OrderStatusActionsComponent
  ],
  template: `
    <div class="space-y-6">
      
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Purchases & Bills Workflow
          </h1>
          <p class="text-xs sm:text-sm text-stone-500 dark:text-espresso-400 mt-1">
            Manage vendor purchase orders, goods receipts, and incoming supplier bills.
          </p>
        </div>

        <div class="flex items-center space-x-3">
          @if (activeTab() === 'orders') {
            <app-button variant="brass" size="sm" (click)="openCreateModal('order')">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              New Purchase Order
            </app-button>
          } @else {
            <app-button variant="brass" size="sm" (click)="openCreateModal('bill')">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              New Vendor Bill
            </app-button>
          }
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="border-b border-stone-200 dark:border-espresso-800">
        <nav class="flex space-x-8" aria-label="Purchases Workflow Tabs">
          
          <button
            (click)="setTab('orders')"
            [class.border-brass-500]="activeTab() === 'orders'"
            [class.text-brass-600]="activeTab() === 'orders'"
            [class.dark:text-brass-400]="activeTab() === 'orders'"
            [class.border-transparent]="activeTab() !== 'orders'"
            [class.text-stone-500]="activeTab() !== 'orders'"
            class="py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-150 flex items-center space-x-2 focus:outline-none"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            <span>Purchase Orders ({{ orders().length }})</span>
          </button>

          <button
            (click)="setTab('bills')"
            [class.border-brass-500]="activeTab() === 'bills'"
            [class.text-brass-600]="activeTab() === 'bills'"
            [class.dark:text-brass-400]="activeTab() === 'bills'"
            [class.border-transparent]="activeTab() !== 'bills'"
            [class.text-stone-500]="activeTab() !== 'bills'"
            class="py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-150 flex items-center space-x-2 focus:outline-none"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Vendor Bills ({{ bills().length }})</span>
          </button>

        </nav>
      </div>

      <!-- Tab Contents -->
      
      <!-- TAB 1: Purchase Orders List -->
      @if (activeTab() === 'orders') {
        <div class="space-y-4 animate-fade-in">
          <app-data-table
            [data]="orders()"
            [columns]="orderTableColumns"
            [loading]="isLoading()"
            (rowClick)="openDetailView('order', $event)"
            emptyTitle="No purchase orders"
            emptyMessage="No supplier purchase orders created yet."
          ></app-data-table>
        </div>
      }

      <!-- TAB 2: Vendor Bills List -->
      @if (activeTab() === 'bills') {
        <div class="space-y-4 animate-fade-in">
          <app-data-table
            [data]="bills()"
            [columns]="billTableColumns"
            [loading]="isLoading()"
            (rowClick)="openDetailView('bill', $event)"
            emptyTitle="No vendor bills"
            emptyMessage="No incoming supplier bills recorded yet."
          ></app-data-table>
        </div>
      }

      <!-- Document Form Dialog (Create / Edit using LineItemEditorComponent) -->
      <app-form-dialog
        [isOpen]="isFormModalOpen()"
        [title]="modalTitle"
        subtitle="Specify vendor supplier party, document dates, and purchase line items"
        submitText="Create Document"
        [loading]="isSubmitting()"
        [submitDisabled]="documentForm.invalid"
        maxWidth="2xl"
        (formSubmit)="saveDocument()"
        (cancel)="closeFormModal()"
      >
        <form [formGroup]="documentForm" class="space-y-5 text-xs">
          <!-- Vendor Selection & Date Controls -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="sm:col-span-1">
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
                Vendor Supplier <span class="text-rose-500">*</span>
              </label>
              <select
                formControlName="vendorId"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              >
                <option value="">-- Select Vendor --</option>
                @for (vend of vendors(); track vend.id) {
                  <option [value]="vend.id">{{ vend.name }}</option>
                }
              </select>
            </div>

            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
                Document Date <span class="text-rose-500">*</span>
              </label>
              <input
                type="date"
                formControlName="documentDate"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400 font-mono"
              />
            </div>

            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
                Due / Delivery Date
              </label>
              <input
                type="date"
                formControlName="dueDate"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400 font-mono"
              />
            </div>
          </div>

          <div>
            <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
              Notes / Delivery Remarks
            </label>
            <input
              type="text"
              formControlName="notes"
              placeholder="e.g. Vendor Invoice #POS-8891 / Net 30 terms"
              class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
            />
          </div>

          <!-- Shared FormArray LineItemEditor Component -->
          <div class="pt-2">
            <h4 class="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-espresso-400 mb-2">
              Purchase Line Items
            </h4>
            
            <app-line-item-editor
              [parentForm]="documentForm"
              formArrayName="items"
              [config]="lineItemEditorConfig"
              (totalsChange)="onTotalsChange($event)"
            ></app-line-item-editor>
          </div>
        </form>
      </app-form-dialog>

      <!-- Detail View Modal with State Machine Action Buttons & Bill Running Balance -->
      <app-form-dialog
        [isOpen]="isDetailModalOpen()"
        [title]="detailTitle"
        subtitle="Purchase document overview and valid state machine transition actions"
        submitText="Close View"
        [submitDisabled]="false"
        maxWidth="2xl"
        (formSubmit)="closeDetailModal()"
        (cancel)="closeDetailModal()"
      >
        @if (activeDetailItem) {
          <div class="space-y-6 text-xs">
            
            <!-- Status Badge & Action Toolbar (Reusing OrderStatusActionsComponent pattern) -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-800">
              <div class="flex items-center space-x-3">
                <span class="font-medium text-stone-500">Current Status:</span>
                <app-status-badge [status]="activeDetailItem.status"></app-status-badge>
              </div>

              <!-- Shared OrderStatusActions Component -->
              <app-order-status-actions
                [type]="detailType === 'order' ? 'purchase_order' : 'bill'"
                [status]="activeDetailItem.status"
                [documentId]="activeDetailItem.id"
                [balanceDue]="activeDetailItem.balanceDue || 0"
                (actionTriggered)="handlePurchaseAction($event)"
              ></app-order-status-actions>
            </div>

            <!-- Running Balance Summary Card for Bill -->
            @if (detailType === 'bill') {
              <div class="p-4 rounded-xl bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-800 grid grid-cols-3 gap-4 text-center">
                <div>
                  <span class="block text-[11px] font-semibold text-stone-500 uppercase">Total Bill Amount</span>
                  <app-currency-display [amount]="activeDetailItem.totalAmount" size="md"></app-currency-display>
                </div>
                <div>
                  <span class="block text-[11px] font-semibold text-stone-500 uppercase">Amount Paid</span>
                  <app-currency-display [amount]="activeDetailItem.amountPaid" size="md" forceColor="success"></app-currency-display>
                </div>
                <div>
                  <span class="block text-[11px] font-semibold text-stone-500 uppercase">Balance Payable</span>
                  <app-currency-display [amount]="activeDetailItem.balanceDue" size="md" forceColor="danger"></app-currency-display>
                </div>
              </div>
            }

            <!-- Document Details Summary -->
            <div class="grid grid-cols-2 gap-4 text-stone-700 dark:text-stone-300">
              <div>
                <span class="block font-semibold text-stone-500 text-[11px] uppercase">Vendor Supplier</span>
                <p class="font-bold text-sm text-stone-900 dark:text-stone-100 mt-0.5">{{ activeDetailItem.vendorName }}</p>
              </div>
              <div>
                <span class="block font-semibold text-stone-500 text-[11px] uppercase">Document Date</span>
                <p class="font-mono text-xs mt-0.5">{{ activeDetailItem.orderDate || activeDetailItem.billDate }}</p>
              </div>
            </div>

            <!-- Line Items Table -->
            <div class="rounded-xl border border-stone-200 dark:border-espresso-800 overflow-hidden">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-stone-50 dark:bg-espresso-950 text-[11px] font-semibold uppercase text-stone-500">
                    <th class="py-2.5 px-3">Item / Material</th>
                    <th class="py-2.5 px-3 text-right">Qty</th>
                    <th class="py-2.5 px-3 text-right">Unit Price</th>
                    <th class="py-2.5 px-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-stone-200 dark:divide-espresso-800/60 font-mono">
                  @for (item of activeDetailItem.items; track item.itemName) {
                    <tr>
                      <td class="py-2.5 px-3 font-sans font-medium text-stone-900 dark:text-stone-100">{{ item.itemName }}</td>
                      <td class="py-2.5 px-3 text-right">{{ item.quantity }}</td>
                      <td class="py-2.5 px-3 text-right">
                        <app-currency-display [amount]="item.unitPrice" size="xs"></app-currency-display>
                      </td>
                      <td class="py-2.5 px-3 text-right font-bold">
                        <app-currency-display [amount]="item.lineTotal || (item.quantity * item.unitPrice)" size="xs"></app-currency-display>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

          </div>
        }
      </app-form-dialog>

    </div>
  `
})
export class PurchasesComponent implements OnInit {
  readonly purchasesService = inject(PurchasesService);
  readonly partiesService = inject(PartiesService);
  readonly itemsService = inject(ItemsService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly activeTab = signal<PurchasesTab>('orders');
  readonly orders = signal<PurchaseOrder[]>([]);
  readonly bills = signal<Bill[]>([]);
  readonly vendors = signal<Party[]>([]);
  readonly availableItems = signal<Item[]>([]);

  readonly isLoading = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);

  // Modals
  readonly isFormModalOpen = signal<boolean>(false);
  readonly isDetailModalOpen = signal<boolean>(false);

  documentType: 'order' | 'bill' = 'order';
  detailType: 'order' | 'bill' = 'order';
  activeDetailItem: any = null;

  computedTotals: LineItemTotals = { subtotal: 0, taxTotal: 0, discountTotal: 0, grandTotal: 0 };

  documentForm: FormGroup = this.createDocumentForm();

  lineItemEditorConfig: LineItemConfig = {
    showItemPicker: true,
    showDescription: true,
    showQuantity: true,
    showUnitPrice: true,
    showDiscount: true,
    showTax: true,
    currencyCode: 'USD'
  };

  // Table Columns
  orderTableColumns: ColumnDef<PurchaseOrder>[] = [
    { key: 'orderNumber', header: 'PO #', width: '140px' },
    { key: 'vendorName', header: 'Vendor Supplier' },
    { key: 'orderDate', header: 'Date', width: '120px' },
    { key: 'expectedDate', header: 'Expected Date', width: '120px' },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      align: 'right',
      width: '140px',
      cell: (po) => `$${po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      width: '130px',
      cell: (po) => po.status
    }
  ];

  billTableColumns: ColumnDef<Bill>[] = [
    { key: 'billNumber', header: 'Bill #', width: '140px' },
    { key: 'vendorName', header: 'Vendor Supplier' },
    { key: 'billDate', header: 'Date', width: '110px' },
    { key: 'dueDate', header: 'Due Date', width: '110px' },
    {
      key: 'totalAmount',
      header: 'Total',
      align: 'right',
      width: '120px',
      cell: (b) => `$${b.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    {
      key: 'balanceDue',
      header: 'Balance Payable',
      align: 'right',
      width: '130px',
      cell: (b) => `$${b.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      width: '130px',
      cell: (b) => b.status
    }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    this.purchasesService.getPurchaseOrders().subscribe(po => this.orders.set(po));
    this.purchasesService.getBills().subscribe(b => this.bills.set(b));
    this.partiesService.getVendors().subscribe(vends => this.vendors.set(vends));
    this.itemsService.getItems().subscribe(items => {
      this.availableItems.set(items);
      this.lineItemEditorConfig = {
        ...this.lineItemEditorConfig,
        itemsList: items.map(i => ({ id: i.id, name: i.name, sku: i.sku, unitPrice: i.purchasePrice || i.salePrice, taxRate: i.taxRate }))
      };
      this.isLoading.set(false);
    });
  }

  setTab(tab: PurchasesTab): void {
    this.activeTab.set(tab);
  }

  createDocumentForm(): FormGroup {
    return this.fb.group({
      vendorId: ['', Validators.required],
      documentDate: [new Date().toISOString().split('T')[0], Validators.required],
      dueDate: [new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]],
      notes: [''],
      items: this.fb.array([])
    });
  }

  get modalTitle(): string {
    return this.documentType === 'order' ? 'Create Purchase Order' : 'Record Vendor Bill';
  }

  get detailTitle(): string {
    if (!this.activeDetailItem) return 'Document Detail';
    return `${this.activeDetailItem.orderNumber || this.activeDetailItem.billNumber} Overview`;
  }

  openCreateModal(type: 'order' | 'bill'): void {
    this.documentType = type;
    this.documentForm = this.createDocumentForm();
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    this.isFormModalOpen.set(false);
  }

  openDetailView(type: 'order' | 'bill', item: any): void {
    this.detailType = type;
    this.activeDetailItem = item;
    this.isDetailModalOpen.set(true);
  }

  closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.activeDetailItem = null;
  }

  onTotalsChange(totals: LineItemTotals): void {
    this.computedTotals = totals;
  }

  saveDocument(): void {
    if (this.documentForm.invalid) return;

    this.isSubmitting.set(true);
    const formVal = this.documentForm.value;
    const vend = this.vendors().find(v => v.id === formVal.vendorId);

    const docReq: any = {
      vendorId: formVal.vendorId,
      vendorName: vend?.name || 'Vendor Account',
      notes: formVal.notes,
      subtotal: this.computedTotals.subtotal,
      taxAmount: this.computedTotals.taxTotal,
      totalAmount: this.computedTotals.grandTotal,
      items: formVal.items
    };

    if (this.documentType === 'order') {
      docReq.orderDate = formVal.documentDate;
      docReq.expectedDate = formVal.dueDate;

      this.purchasesService.createPurchaseOrder(docReq).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeFormModal();
          this.toast.success('Purchase order created in DRAFT state', 'Success');
          this.loadData();
        },
        error: () => this.isSubmitting.set(false)
      });
    } else {
      docReq.billDate = formVal.documentDate;
      docReq.dueDate = formVal.dueDate;

      this.purchasesService.createBill(docReq).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeFormModal();
          this.toast.success('Vendor bill recorded in DRAFT state', 'Success');
          this.loadData();
        },
        error: () => this.isSubmitting.set(false)
      });
    }
  }

  // State Machine Action Handlers
  handlePurchaseAction(action: string): void {
    if (!this.activeDetailItem) return;
    const item = this.activeDetailItem;
    switch (action) {
      case 'SUBMIT': this.transitionOrderStatus(item.id, 'SUBMITTED'); break;
      case 'APPROVE': this.transitionOrderStatus(item.id, 'APPROVED'); break;
      case 'ORDER': this.transitionOrderStatus(item.id, 'ORDERED'); break;
      case 'RECEIVE': this.transitionOrderStatus(item.id, 'RECEIVED'); break;
      case 'CONVERT_TO_BILL': this.convertOrderToBill(item); break;
      case 'RECORD': this.transitionBillStatus(item.id, 'RECORDED'); break;
      case 'VOID': this.transitionBillStatus(item.id, 'VOID'); break;
      case 'CANCEL': 
        if (this.detailType === 'order') this.transitionOrderStatus(item.id, 'CANCELLED');
        else this.transitionBillStatus(item.id, 'CANCELLED');
        break;
      case 'REJECT':
        if (this.detailType === 'order') this.transitionOrderStatus(item.id, 'CANCELLED');
        break;
    }
  }

  transitionOrderStatus(id: string, status: PurchaseOrderStatus): void {
    this.purchasesService.updatePurchaseOrderStatus(id, status).subscribe(() => {
      this.toast.success(`Purchase Order status updated to ${status}`, 'State Updated');
      this.closeDetailModal();
      this.loadData();
    });
  }

  convertOrderToBill(po: PurchaseOrder): void {
    const billReq: Partial<Bill> = {
      purchaseOrderId: po.id,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      billDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      subtotal: po.subtotal,
      taxAmount: po.taxAmount,
      totalAmount: po.totalAmount,
      notes: `Generated from Purchase Order ${po.orderNumber}`,
      items: po.items
    };

    this.purchasesService.createBill(billReq).subscribe(() => {
      this.purchasesService.updatePurchaseOrderStatus(po.id, 'RECEIVED').subscribe();
      this.toast.success('Purchase Order converted to Vendor Bill', 'Conversion Success');
      this.closeDetailModal();
      this.loadData();
    });
  }

  transitionBillStatus(id: string, status: BillStatus): void {
    this.purchasesService.updateBillStatus(id, status).subscribe(() => {
      this.toast.success(`Bill status updated to ${status}`, 'State Updated');
      this.closeDetailModal();
      this.loadData();
    });
  }
}
