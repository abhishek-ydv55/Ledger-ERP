import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SalesService, Estimate, SalesOrder, Invoice, EstimateStatus, SalesOrderStatus, InvoiceStatus } from './sales.service';
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

export type SalesTab = 'estimates' | 'orders' | 'invoices';

@Component({
  selector: 'app-sales',
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
      
      <!-- Page Title & Header Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Sales & Invoicing Workflow
          </h1>
          <p class="text-xs sm:text-sm text-stone-500 dark:text-espresso-400 mt-1">
            Manage estimates, confirmed sales orders, and issued customer billing invoices.
          </p>
        </div>

        <div class="flex items-center space-x-3">
          @if (activeTab() === 'estimates') {
            <app-button variant="brass" size="sm" (click)="openCreateModal('estimate')">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              New Quotation / Estimate
            </app-button>
          } @else if (activeTab() === 'orders') {
            <app-button variant="brass" size="sm" (click)="openCreateModal('order')">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              New Sales Order
            </app-button>
          } @else {
            <app-button variant="brass" size="sm" (click)="openCreateModal('invoice')">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              New Invoice
            </app-button>
          }
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="border-b border-stone-200 dark:border-espresso-800">
        <nav class="flex space-x-8" aria-label="Sales Workflow Tabs">
          
          <button
            (click)="setTab('estimates')"
            [class.border-brass-500]="activeTab() === 'estimates'"
            [class.text-brass-600]="activeTab() === 'estimates'"
            [class.dark:text-brass-400]="activeTab() === 'estimates'"
            [class.border-transparent]="activeTab() !== 'estimates'"
            [class.text-stone-500]="activeTab() !== 'estimates'"
            class="py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-150 flex items-center space-x-2 focus:outline-none"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span>Estimates / Quotations ({{ estimates().length }})</span>
          </button>

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
            <span>Sales Orders ({{ orders().length }})</span>
          </button>

          <button
            (click)="setTab('invoices')"
            [class.border-brass-500]="activeTab() === 'invoices'"
            [class.text-brass-600]="activeTab() === 'invoices'"
            [class.dark:text-brass-400]="activeTab() === 'invoices'"
            [class.border-transparent]="activeTab() !== 'invoices'"
            [class.text-stone-500]="activeTab() !== 'invoices'"
            class="py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-150 flex items-center space-x-2 focus:outline-none"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span>Invoices & Billing ({{ invoices().length }})</span>
          </button>

        </nav>
      </div>

      <!-- Tab Contents -->
      
      <!-- TAB 1: Estimates List -->
      @if (activeTab() === 'estimates') {
        <div class="space-y-4 animate-fade-in">
          <app-data-table
            [data]="estimates()"
            [columns]="estimateTableColumns"
            [loading]="isLoading()"
            (rowClick)="openDetailView('estimate', $event)"
            emptyTitle="No estimates created"
            emptyMessage="No sales quotations created yet."
          ></app-data-table>
        </div>
      }

      <!-- TAB 2: Sales Orders List -->
      @if (activeTab() === 'orders') {
        <div class="space-y-4 animate-fade-in">
          <app-data-table
            [data]="orders()"
            [columns]="orderTableColumns"
            [loading]="isLoading()"
            (rowClick)="openDetailView('order', $event)"
            emptyTitle="No sales orders"
            emptyMessage="No confirmed sales orders created yet."
          ></app-data-table>
        </div>
      }

      <!-- TAB 3: Invoices List -->
      @if (activeTab() === 'invoices') {
        <div class="space-y-4 animate-fade-in">
          <app-data-table
            [data]="invoices()"
            [columns]="invoiceTableColumns"
            [loading]="isLoading()"
            (rowClick)="openDetailView('invoice', $event)"
            emptyTitle="No billing invoices"
            emptyMessage="No customer invoices created yet."
          ></app-data-table>
        </div>
      }

      <!-- Document Form Dialog (Create / Edit using LineItemEditorComponent) -->
      <app-form-dialog
        [isOpen]="isFormModalOpen()"
        [title]="modalTitle"
        [subtitle]="'Specify customer party, document dates, and line items breakdown'"
        [submitText]="'Create Document'"
        [loading]="isSubmitting()"
        [submitDisabled]="documentForm.invalid"
        maxWidth="2xl"
        (formSubmit)="saveDocument()"
        (cancel)="closeFormModal()"
      >
        <form [formGroup]="documentForm" class="space-y-5 text-xs">
          <!-- Customer Selection & Date Controls -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="sm:col-span-1">
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
                Customer Party <span class="text-rose-500">*</span>
              </label>
              <select
                formControlName="customerId"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              >
                <option value="">-- Select Customer --</option>
                @for (cust of customers(); track cust.id) {
                  <option [value]="cust.id">{{ cust.name }}</option>
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
                Due / Expiry Date
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
              Notes / Terms
            </label>
            <input
              type="text"
              formControlName="notes"
              placeholder="e.g. Payment due within 30 days of invoice date"
              class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
            />
          </div>

          <!-- Shared FormArray LineItemEditor Component -->
          <div class="pt-2">
            <h4 class="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-espresso-400 mb-2">
              Document Line Items
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

      <!-- Detail View Modal with State Machine Action Buttons & Invoice Running Balance -->
      <app-form-dialog
        [isOpen]="isDetailModalOpen()"
        [title]="detailTitle"
        subtitle="Document overview and valid state machine transition actions"
        submitText="Close View"
        [submitDisabled]="false"
        maxWidth="2xl"
        (formSubmit)="closeDetailModal()"
        (cancel)="closeDetailModal()"
      >
        @if (activeDetailItem) {
          <div class="space-y-6 text-xs">
            
            <!-- Status Badge & Action Toolbar (Valid State Machine Transitions ONLY) -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-800">
              <div class="flex items-center space-x-3">
                <span class="font-medium text-stone-500">Current Status:</span>
                <app-status-badge [status]="activeDetailItem.status"></app-status-badge>
              </div>

              <!-- State Machine Action Transition Buttons -->
              <app-order-status-actions
                [type]="detailType === 'estimate' ? 'estimate' : (detailType === 'order' ? 'sales_order' : 'sales_invoice')"
                [status]="activeDetailItem.status"
                [documentId]="activeDetailItem.id"
                [balanceDue]="activeDetailItem.balanceDue || 0"
                (actionTriggered)="handleSalesAction($event)"
              ></app-order-status-actions>
            </div>

            <!-- Running Balance Summary Card for Invoice -->
            @if (detailType === 'invoice') {
              <div class="p-4 rounded-xl bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-800 grid grid-cols-3 gap-4 text-center">
                <div>
                  <span class="block text-[11px] font-semibold text-stone-500 uppercase">Total Amount</span>
                  <app-currency-display [amount]="activeDetailItem.totalAmount" size="md"></app-currency-display>
                </div>
                <div>
                  <span class="block text-[11px] font-semibold text-stone-500 uppercase">Amount Paid</span>
                  <app-currency-display [amount]="activeDetailItem.amountPaid" size="md" forceColor="success"></app-currency-display>
                </div>
                <div>
                  <span class="block text-[11px] font-semibold text-stone-500 uppercase">Balance Due</span>
                  <app-currency-display [amount]="activeDetailItem.balanceDue" size="md" forceColor="danger"></app-currency-display>
                </div>
              </div>
            }

            <!-- Document Details Summary -->
            <div class="grid grid-cols-2 gap-4 text-stone-700 dark:text-stone-300">
              <div>
                <span class="block font-semibold text-stone-500 text-[11px] uppercase">Customer Party</span>
                <p class="font-bold text-sm text-stone-900 dark:text-stone-100 mt-0.5">{{ activeDetailItem.customerName }}</p>
              </div>
              <div>
                <span class="block font-semibold text-stone-500 text-[11px] uppercase">Document Date</span>
                <p class="font-mono text-xs mt-0.5">{{ activeDetailItem.estimateDate || activeDetailItem.orderDate || activeDetailItem.invoiceDate }}</p>
              </div>
            </div>

            <!-- Line Items Table -->
            <div class="rounded-xl border border-stone-200 dark:border-espresso-800 overflow-hidden">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-stone-50 dark:bg-espresso-950 text-[11px] font-semibold uppercase text-stone-500">
                    <th class="py-2.5 px-3">Item / Service</th>
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
export class SalesComponent implements OnInit {
  readonly salesService = inject(SalesService);
  readonly partiesService = inject(PartiesService);
  readonly itemsService = inject(ItemsService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly activeTab = signal<SalesTab>('estimates');
  readonly estimates = signal<Estimate[]>([]);
  readonly orders = signal<SalesOrder[]>([]);
  readonly invoices = signal<Invoice[]>([]);
  readonly customers = signal<Party[]>([]);
  readonly availableItems = signal<Item[]>([]);

  readonly isLoading = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);

  // Modals
  readonly isFormModalOpen = signal<boolean>(false);
  readonly isDetailModalOpen = signal<boolean>(false);

  documentType: 'estimate' | 'order' | 'invoice' = 'estimate';
  detailType: 'estimate' | 'order' | 'invoice' = 'estimate';
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
  estimateTableColumns: ColumnDef<Estimate>[] = [
    { key: 'estimateNumber', header: 'Estimate #', width: '140px' },
    { key: 'customerName', header: 'Customer Party' },
    { key: 'estimateDate', header: 'Date', width: '120px' },
    { key: 'expiryDate', header: 'Expiry Date', width: '120px' },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      align: 'right',
      width: '140px',
      cell: (e) => `$${e.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      width: '120px',
      cell: (e) => e.status
    }
  ];

  orderTableColumns: ColumnDef<SalesOrder>[] = [
    { key: 'orderNumber', header: 'Order #', width: '140px' },
    { key: 'customerName', header: 'Customer Party' },
    { key: 'orderDate', header: 'Date', width: '120px' },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      align: 'right',
      width: '140px',
      cell: (so) => `$${so.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      width: '120px',
      cell: (so) => so.status
    }
  ];

  invoiceTableColumns: ColumnDef<Invoice>[] = [
    { key: 'invoiceNumber', header: 'Invoice #', width: '140px' },
    { key: 'customerName', header: 'Customer Party' },
    { key: 'invoiceDate', header: 'Date', width: '110px' },
    { key: 'dueDate', header: 'Due Date', width: '110px' },
    {
      key: 'totalAmount',
      header: 'Total',
      align: 'right',
      width: '120px',
      cell: (inv) => `$${inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    {
      key: 'balanceDue',
      header: 'Balance Due',
      align: 'right',
      width: '130px',
      cell: (inv) => `$${inv.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      width: '120px',
      cell: (inv) => inv.status
    }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    this.salesService.getEstimates().subscribe(est => this.estimates.set(est));
    this.salesService.getSalesOrders().subscribe(so => this.orders.set(so));
    this.salesService.getInvoices().subscribe(inv => this.invoices.set(inv));
    this.partiesService.getCustomers().subscribe(custs => this.customers.set(custs));
    this.itemsService.getItems().subscribe(items => {
      this.availableItems.set(items);
      this.lineItemEditorConfig = {
        ...this.lineItemEditorConfig,
        itemsList: items.map(i => ({ id: i.id, name: i.name, sku: i.sku, unitPrice: i.salePrice, taxRate: i.taxRate }))
      };
      this.isLoading.set(false);
    });
  }

  setTab(tab: SalesTab): void {
    this.activeTab.set(tab);
  }

  createDocumentForm(): FormGroup {
    return this.fb.group({
      customerId: ['', Validators.required],
      documentDate: [new Date().toISOString().split('T')[0], Validators.required],
      dueDate: [new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]],
      notes: [''],
      items: this.fb.array([])
    });
  }

  get modalTitle(): string {
    switch (this.documentType) {
      case 'estimate': return 'Create Sales Estimate / Quotation';
      case 'order': return 'Create Confirmed Sales Order';
      case 'invoice': return 'Create Customer Invoice';
    }
  }

  get detailTitle(): string {
    if (!this.activeDetailItem) return 'Document Detail';
    return `${this.activeDetailItem.estimateNumber || this.activeDetailItem.orderNumber || this.activeDetailItem.invoiceNumber} Overview`;
  }

  openCreateModal(type: 'estimate' | 'order' | 'invoice'): void {
    this.documentType = type;
    this.documentForm = this.createDocumentForm();
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    this.isFormModalOpen.set(false);
  }

  openDetailView(type: 'estimate' | 'order' | 'invoice', item: any): void {
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
    const cust = this.customers().find(c => c.id === formVal.customerId);

    const docReq: any = {
      customerId: formVal.customerId,
      customerName: cust?.name || 'Customer Account',
      notes: formVal.notes,
      subtotal: this.computedTotals.subtotal,
      taxAmount: this.computedTotals.taxTotal,
      totalAmount: this.computedTotals.grandTotal,
      items: formVal.items
    };

    if (this.documentType === 'estimate') {
      docReq.estimateDate = formVal.documentDate;
      docReq.expiryDate = formVal.dueDate;

      this.salesService.createEstimate(docReq).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeFormModal();
          this.toast.success('Sales estimate created', 'Success');
          this.loadData();
        },
        error: () => this.isSubmitting.set(false)
      });
    } else if (this.documentType === 'order') {
      docReq.orderDate = formVal.documentDate;

      this.salesService.createSalesOrder(docReq).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeFormModal();
          this.toast.success('Sales order created', 'Success');
          this.loadData();
        },
        error: () => this.isSubmitting.set(false)
      });
    } else {
      docReq.invoiceDate = formVal.documentDate;
      docReq.dueDate = formVal.dueDate;

      this.salesService.createInvoice(docReq).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeFormModal();
          this.toast.success('Customer invoice created in DRAFT state', 'Success');
          this.loadData();
        },
        error: () => this.isSubmitting.set(false)
      });
    }
  }

  // State Machine Action Handlers
  handleSalesAction(action: string): void {
    if (!this.activeDetailItem) return;
    const item = this.activeDetailItem;
    switch (action) {
      case 'SEND': this.transitionEstimateStatus(item.id, 'SENT'); break;
      case 'ACCEPT': this.transitionEstimateStatus(item.id, 'ACCEPTED'); break;
      case 'REJECT': this.transitionEstimateStatus(item.id, 'REJECTED'); break;
      case 'CONVERT_TO_ORDER': this.convertEstimateToOrder(item); break;
      case 'CONFIRM': this.transitionOrderStatus(item.id, 'CONFIRMED'); break;
      case 'CANCEL': this.transitionOrderStatus(item.id, 'CANCELLED'); break;
      case 'CONVERT_TO_INVOICE': this.convertOrderToInvoice(item); break;
      case 'ISSUE': this.issueInvoiceAction(item.id); break;
      case 'VOID': this.transitionInvoiceStatus(item.id, 'VOID'); break;
    }
  }

  transitionEstimateStatus(id: string, status: EstimateStatus): void {
    this.salesService.updateEstimateStatus(id, status).subscribe(() => {
      this.toast.success(`Estimate status updated to ${status}`, 'State Updated');
      this.closeDetailModal();
      this.loadData();
    });
  }

  convertEstimateToOrder(est: Estimate): void {
    const orderReq: Partial<SalesOrder> = {
      estimateId: est.id,
      customerId: est.customerId,
      customerName: est.customerName,
      orderDate: new Date().toISOString().split('T')[0],
      subtotal: est.subtotal,
      taxAmount: est.taxAmount,
      totalAmount: est.totalAmount,
      notes: `Converted from estimate ${est.estimateNumber}`,
      items: est.items
    };

    this.salesService.createSalesOrder(orderReq).subscribe(() => {
      this.salesService.updateEstimateStatus(est.id, 'ACCEPTED').subscribe();
      this.toast.success('Estimate converted to Sales Order', 'Conversion Success');
      this.closeDetailModal();
      this.loadData();
    });
  }

  transitionOrderStatus(id: string, status: SalesOrderStatus): void {
    this.salesService.updateSalesOrderStatus(id, status).subscribe(() => {
      this.toast.success(`Sales Order status updated to ${status}`, 'State Updated');
      this.closeDetailModal();
      this.loadData();
    });
  }

  convertOrderToInvoice(so: SalesOrder): void {
    const invReq: Partial<Invoice> = {
      salesOrderId: so.id,
      customerId: so.customerId,
      customerName: so.customerName,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      subtotal: so.subtotal,
      taxAmount: so.taxAmount,
      totalAmount: so.totalAmount,
      notes: `Generated from Sales Order ${so.orderNumber}`,
      items: so.items
    };

    this.salesService.createInvoice(invReq).subscribe(() => {
      this.salesService.updateSalesOrderStatus(so.id, 'INVOICED').subscribe();
      this.toast.success('Sales Order converted to Invoice', 'Conversion Success');
      this.closeDetailModal();
      this.loadData();
    });
  }

  issueInvoiceAction(id: string): void {
    this.salesService.issueInvoice(id).subscribe(() => {
      this.toast.success('Invoice issued successfully', 'Invoice Issued');
      this.closeDetailModal();
      this.loadData();
    });
  }

  transitionInvoiceStatus(id: string, status: InvoiceStatus): void {
    this.salesService.updateInvoiceStatus(id, status).subscribe(() => {
      this.toast.success(`Invoice status updated to ${status}`, 'State Updated');
      this.closeDetailModal();
      this.loadData();
    });
  }
}
