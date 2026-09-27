import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CurrencyDisplayComponent } from '../currency-display/currency-display.component';

export interface LineItemOption {
  id: string;
  sku?: string;
  name: string;
  unitPrice: number;
  taxRate?: number;
  description?: string;
}

export interface TaxOption {
  label: string;
  rate: number;
}

export interface LineItemConfig {
  showItemPicker?: boolean;
  showDescription?: boolean;
  showQuantity?: boolean;
  showUnitPrice?: boolean;
  showDiscount?: boolean;
  showTax?: boolean;
  taxOptions?: TaxOption[];
  itemsList?: LineItemOption[];
  currencyCode?: string;
}

export interface LineItemTotals {
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
}

@Component({
  selector: 'app-line-item-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyDisplayComponent],
  template: `
    <div class="space-y-4 w-full" [formGroup]="parentForm">
      
      <!-- Table / Editor Header -->
      <div class="w-full overflow-x-auto rounded-xl border border-stone-200 dark:border-espresso-800 bg-white dark:bg-espresso-900 shadow-xs">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-stone-200 dark:border-espresso-800 bg-stone-50/80 dark:bg-espresso-950/50 text-[11px] font-semibold text-stone-500 dark:text-espresso-400 uppercase tracking-wider select-none">
              <th class="px-3 py-3 w-10 text-center">#</th>
              
              @if (mergedConfig.showItemPicker) {
                <th class="px-3 py-3 min-w-[200px]">Item / Product</th>
              }
              
              @if (mergedConfig.showDescription) {
                <th class="px-3 py-3 min-w-[180px]">Description</th>
              }
              
              @if (mergedConfig.showQuantity) {
                <th class="px-3 py-3 w-28 text-right">Qty</th>
              }
              
              @if (mergedConfig.showUnitPrice) {
                <th class="px-3 py-3 w-32 text-right">Unit Price</th>
              }

              @if (mergedConfig.showDiscount) {
                <th class="px-3 py-3 w-28 text-right">Discount %</th>
              }
              
              @if (mergedConfig.showTax) {
                <th class="px-3 py-3 w-32 text-right">Tax Rate %</th>
              }
              
              <th class="px-3 py-3 w-36 text-right">Amount</th>
              <th class="px-3 py-3 w-12 text-center"></th>
            </tr>
          </thead>

          <tbody [formArrayName]="formArrayName" class="divide-y divide-stone-200 dark:divide-espresso-800/60 text-xs text-stone-800 dark:text-stone-200">
            @for (row of lineItemsFormArray.controls; track row; let idx = $index) {
              <tr
                [formGroupName]="idx"
                class="hover:bg-stone-50/60 dark:hover:bg-espresso-800/30 transition-all duration-200 animate-fade-in"
              >
                <!-- Row Number -->
                <td class="px-3 py-3 text-center text-stone-400 font-mono">
                  {{ idx + 1 }}
                </td>

                <!-- Item Picker / Name -->
                @if (mergedConfig.showItemPicker) {
                  <td class="px-3 py-3">
                    @if (mergedConfig.itemsList && mergedConfig.itemsList.length > 0) {
                      <select
                        formControlName="itemId"
                        (change)="onItemSelect(idx, $event)"
                        class="w-full bg-white dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
                      >
                        <option value="">-- Select Item --</option>
                        @for (itemOpt of mergedConfig.itemsList; track itemOpt.id) {
                          <option [value]="itemOpt.id">
                            {{ itemOpt.name }} {{ itemOpt.sku ? '(' + itemOpt.sku + ')' : '' }}
                          </option>
                        }
                      </select>
                    } @else {
                      <input
                        type="text"
                        formControlName="itemName"
                        placeholder="Item name or service"
                        class="w-full bg-white dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
                      />
                    }
                  </td>
                }

                <!-- Description -->
                @if (mergedConfig.showDescription) {
                  <td class="px-3 py-3">
                    <input
                      type="text"
                      formControlName="description"
                      placeholder="Line item details..."
                      class="w-full bg-white dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
                    />
                  </td>
                }

                <!-- Quantity -->
                @if (mergedConfig.showQuantity) {
                  <td class="px-3 py-3 text-right">
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      formControlName="quantity"
                      class="w-full text-right bg-white dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:ring-2 focus:ring-brass-400"
                    />
                  </td>
                }

                <!-- Unit Price -->
                @if (mergedConfig.showUnitPrice) {
                  <td class="px-3 py-3 text-right">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      formControlName="unitPrice"
                      class="w-full text-right bg-white dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:ring-2 focus:ring-brass-400"
                    />
                  </td>
                }

                <!-- Discount -->
                @if (mergedConfig.showDiscount) {
                  <td class="px-3 py-3 text-right">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      formControlName="discount"
                      placeholder="0"
                      class="w-full text-right bg-white dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:ring-2 focus:ring-brass-400"
                    />
                  </td>
                }

                <!-- Tax Rate -->
                @if (mergedConfig.showTax) {
                  <td class="px-3 py-3 text-right">
                    @if (mergedConfig.taxOptions && mergedConfig.taxOptions.length > 0) {
                      <select
                        formControlName="taxRate"
                        class="w-full text-right bg-white dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-2 py-1.5 text-xs text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:ring-2 focus:ring-brass-400"
                      >
                        @for (taxOpt of mergedConfig.taxOptions; track taxOpt.rate) {
                          <option [value]="taxOpt.rate">{{ taxOpt.label }} ({{ taxOpt.rate }}%)</option>
                        }
                      </select>
                    } @else {
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        formControlName="taxRate"
                        placeholder="0"
                        class="w-full text-right bg-white dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:ring-2 focus:ring-brass-400"
                      />
                    }
                  </td>
                }

                <!-- Line Total -->
                <td class="px-3 py-3 text-right font-mono font-medium text-stone-900 dark:text-stone-100">
                  <app-currency-display
                    [amount]="getRowTotal(row)"
                    [currencyCode]="mergedConfig.currencyCode || 'USD'"
                  ></app-currency-display>
                </td>

                <!-- Delete Action -->
                <td class="px-3 py-3 text-center">
                  <button
                    (click)="removeRow(idx)"
                    [disabled]="lineItemsFormArray.length <= 1"
                    type="button"
                    class="p-1 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Remove item line"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Footer: Add Line Button + Totals Summary -->
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pt-2">
        <!-- Add Line Button -->
        <button
          (click)="addRow()"
          type="button"
          class="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg border border-dashed border-stone-300 dark:border-espresso-700 hover:border-brass-500 dark:hover:border-brass-400 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-brass-600 dark:hover:text-brass-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brass-400 self-start"
        >
          <svg class="w-4 h-4 text-brass-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          <span>Add Line Item</span>
        </button>

        <!-- Totals Calculation Summary Box -->
        <div class="w-full sm:w-72 bg-white dark:bg-espresso-900 rounded-xl border border-stone-200 dark:border-espresso-800 p-4 space-y-2 text-xs">
          <div class="flex items-center justify-between text-stone-600 dark:text-espresso-300">
            <span>Subtotal</span>
            <app-currency-display [amount]="computedTotals.subtotal" [currencyCode]="mergedConfig.currencyCode || 'USD'"></app-currency-display>
          </div>

          @if (mergedConfig.showDiscount && computedTotals.discountTotal > 0) {
            <div class="flex items-center justify-between text-stone-600 dark:text-espresso-300">
              <span>Discount</span>
              <app-currency-display [amount]="-computedTotals.discountTotal" [currencyCode]="mergedConfig.currencyCode || 'USD'" forceColor="danger"></app-currency-display>
            </div>
          }

          @if (mergedConfig.showTax) {
            <div class="flex items-center justify-between text-stone-600 dark:text-espresso-300">
              <span>Tax Total</span>
              <app-currency-display [amount]="computedTotals.taxTotal" [currencyCode]="mergedConfig.currencyCode || 'USD'"></app-currency-display>
            </div>
          }

          <div class="pt-2 border-t border-stone-200 dark:border-espresso-800 flex items-center justify-between font-semibold text-sm text-stone-900 dark:text-stone-100">
            <span>Grand Total</span>
            <app-currency-display [amount]="computedTotals.grandTotal" [currencyCode]="mergedConfig.currencyCode || 'USD'" size="md" forceColor="success"></app-currency-display>
          </div>
        </div>
      </div>

    </div>
  `
})
export class LineItemEditorComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);

  @Input() parentForm!: FormGroup;
  @Input() formArrayName = 'items';
  @Input() config: LineItemConfig = {};

  @Output() totalsChange = new EventEmitter<LineItemTotals>();

  private valueChangeSub?: Subscription;

  get mergedConfig(): LineItemConfig {
    return {
      showItemPicker: true,
      showDescription: true,
      showQuantity: true,
      showUnitPrice: true,
      showDiscount: true,
      showTax: true,
      currencyCode: 'USD',
      ...this.config
    };
  }

  get lineItemsFormArray(): FormArray {
    return this.parentForm.get(this.formArrayName) as FormArray;
  }

  ngOnInit(): void {
    if (!this.lineItemsFormArray) {
      this.parentForm.addControl(this.formArrayName, this.fb.array([]));
    }

    if (this.lineItemsFormArray.length === 0) {
      this.addRow();
    }

    this.valueChangeSub = this.lineItemsFormArray.valueChanges.subscribe(() => {
      this.emitTotals();
    });

    this.emitTotals();
  }

  ngOnDestroy(): void {
    this.valueChangeSub?.unsubscribe();
  }

  createRowGroup(): FormGroup {
    return this.fb.group({
      itemId: [''],
      itemName: ['', Validators.required],
      description: [''],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      taxRate: [0, [Validators.min(0), Validators.max(100)]]
    });
  }

  addRow(): void {
    this.lineItemsFormArray.push(this.createRowGroup());
  }

  removeRow(index: number): void {
    if (this.lineItemsFormArray.length > 1) {
      this.lineItemsFormArray.removeAt(index);
    }
  }

  onItemSelect(rowIndex: number, event: Event): void {
    const selectedId = (event.target as HTMLSelectElement).value;
    if (!selectedId || !this.mergedConfig.itemsList) return;

    const selectedItem = this.mergedConfig.itemsList.find(i => i.id === selectedId);
    if (!selectedItem) return;

    const rowGroup = this.lineItemsFormArray.at(rowIndex) as FormGroup;
    rowGroup.patchValue({
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      description: selectedItem.description || rowGroup.get('description')?.value || '',
      unitPrice: selectedItem.unitPrice,
      taxRate: selectedItem.taxRate ?? rowGroup.get('taxRate')?.value ?? 0
    });
  }

  getRowTotal(row: any): number {
    const val = row.value || row;
    const qty = Number(val.quantity) || 0;
    const price = Number(val.unitPrice) || 0;
    const discount = Number(val.discount) || 0;
    const tax = Number(val.taxRate) || 0;

    const baseAmount = qty * price;
    const discountAmt = baseAmount * (discount / 100);
    const discountedBase = baseAmount - discountAmt;
    const taxAmt = discountedBase * (tax / 100);

    return discountedBase + taxAmt;
  }

  get computedTotals(): LineItemTotals {
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    let grandTotal = 0;

    if (this.lineItemsFormArray) {
      for (const ctrl of this.lineItemsFormArray.controls) {
        const val = ctrl.value;
        const qty = Number(val.quantity) || 0;
        const price = Number(val.unitPrice) || 0;
        const discount = Number(val.discount) || 0;
        const tax = Number(val.taxRate) || 0;

        const baseAmount = qty * price;
        const discountAmt = baseAmount * (discount / 100);
        const discountedBase = baseAmount - discountAmt;
        const taxAmt = discountedBase * (tax / 100);

        subtotal += baseAmount;
        discountTotal += discountAmt;
        taxTotal += taxAmt;
        grandTotal += (discountedBase + taxAmt);
      }
    }

    return { subtotal, discountTotal, taxTotal, grandTotal };
  }

  private emitTotals(): void {
    this.totalsChange.emit(this.computedTotals);
  }
}
