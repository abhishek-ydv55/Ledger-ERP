import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../button/button.component';

export type DocumentType = 'estimate' | 'sales_order' | 'sales_invoice' | 'purchase_order' | 'bill';

@Component({
  selector: 'app-order-status-actions',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent],
  template: `
    <div class="flex items-center space-x-2 flex-wrap gap-y-2">
      
      <!-- ESTIMATE ACTIONS -->
      @if (type === 'estimate') {
        @if (status === 'DRAFT') {
          <app-button variant="brass" size="sm" (click)="emitAction('SEND')">Send Estimate</app-button>
          <app-button variant="secondary" size="sm" (click)="emitAction('ACCEPT')">Accept</app-button>
        }
        @if (status === 'SENT') {
          <app-button variant="brass" size="sm" (click)="emitAction('ACCEPT')">Accept Estimate</app-button>
          <app-button variant="outline" size="sm" (click)="emitAction('REJECT')">Reject</app-button>
        }
        @if (status === 'ACCEPTED' || status === 'SENT') {
          <app-button variant="brass" size="sm" (click)="emitAction('CONVERT_TO_ORDER')">Convert to Sales Order</app-button>
        }
      }

      <!-- SALES ORDER ACTIONS -->
      @if (type === 'sales_order') {
        @if (status === 'DRAFT') {
          <app-button variant="brass" size="sm" (click)="emitAction('CONFIRM')">Confirm Order</app-button>
          <app-button variant="outline" size="sm" (click)="emitAction('CANCEL')">Cancel Order</app-button>
        }
        @if (status === 'CONFIRMED') {
          <app-button variant="brass" size="sm" (click)="emitAction('CONVERT_TO_INVOICE')">Generate Invoice</app-button>
          <app-button variant="outline" size="sm" (click)="emitAction('CANCEL')">Cancel Order</app-button>
        }
      }

      <!-- SALES INVOICE ACTIONS -->
      @if (type === 'sales_invoice') {
        @if (status === 'DRAFT') {
          <app-button variant="brass" size="sm" (click)="emitAction('ISSUE')">Issue Invoice</app-button>
        }
        @if (status === 'ISSUED' || status === 'PARTIALLY_PAID') {
          <a
            [routerLink]="['/payments']"
            [queryParams]="{ invoiceId: documentId, amount: balanceDue }"
            class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center space-x-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span>Record Payment</span>
          </a>
          <app-button variant="outline" size="sm" (click)="emitAction('VOID')">Mark Void</app-button>
        }
      }

      <!-- PURCHASE ORDER ACTIONS -->
      @if (type === 'purchase_order') {
        @if (status === 'DRAFT') {
          <app-button variant="brass" size="sm" (click)="emitAction('SUBMIT')">Submit for Approval</app-button>
          <app-button variant="secondary" size="sm" (click)="emitAction('APPROVE')">Approve PO</app-button>
          <app-button variant="outline" size="sm" (click)="emitAction('CANCEL')">Cancel PO</app-button>
        }
        @if (status === 'SUBMITTED') {
          <app-button variant="brass" size="sm" (click)="emitAction('APPROVE')">Approve PO</app-button>
          <app-button variant="outline" size="sm" (click)="emitAction('REJECT')">Reject</app-button>
          <app-button variant="outline" size="sm" (click)="emitAction('CANCEL')">Cancel PO</app-button>
        }
        @if (status === 'APPROVED') {
          <app-button variant="brass" size="sm" (click)="emitAction('ORDER')">Send to Vendor</app-button>
          <app-button variant="secondary" size="sm" (click)="emitAction('CONVERT_TO_BILL')">Generate Vendor Bill</app-button>
        }
        @if (status === 'ORDERED' || status === 'APPROVED') {
          <app-button variant="brass" size="sm" (click)="emitAction('RECEIVE')">Mark Received</app-button>
          <app-button variant="secondary" size="sm" (click)="emitAction('CONVERT_TO_BILL')">Generate Vendor Bill</app-button>
        }
      }

      <!-- VENDOR BILL ACTIONS -->
      @if (type === 'bill') {
        @if (status === 'DRAFT') {
          <app-button variant="brass" size="sm" (click)="emitAction('RECORD')">Record & Approve Bill</app-button>
        }
        @if (status === 'RECORDED' || status === 'APPROVED' || status === 'ISSUED' || status === 'PARTIALLY_PAID') {
          <a
            [routerLink]="['/payments']"
            [queryParams]="{ billId: documentId, amount: balanceDue }"
            class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center space-x-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span>Record Payout</span>
          </a>
          <app-button variant="outline" size="sm" (click)="emitAction('VOID')">Mark Void</app-button>
        }
      }

    </div>
  `
})
export class OrderStatusActionsComponent {
  @Input() type: DocumentType = 'estimate';
  @Input() status: string = '';
  @Input() documentId: string = '';
  @Input() balanceDue: number = 0;

  @Output() actionTriggered = new EventEmitter<string>();

  emitAction(action: string): void {
    this.actionTriggered.emit(action);
  }
}
