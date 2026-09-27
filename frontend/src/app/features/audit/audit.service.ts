import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';

export interface AuditLogItem {
  id: string;
  organizationId?: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  action: string;
  oldSnapshot?: string | object | null;
  newSnapshot?: string | object | null;
  actorId?: string;
  actorName?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private readonly api = inject(ApiService);

  private mockLogs: AuditLogItem[] = [
    {
      id: 'log-101',
      entityType: 'INVOICE',
      entityId: 'inv-1',
      entityName: 'INV-2026-0042',
      action: 'STATUS_CHANGE',
      actorId: 'usr-1',
      actorName: 'System Admin',
      oldSnapshot: {
        id: 'inv-1',
        invoiceNumber: 'INV-2026-0042',
        customerName: 'Acme Global Logistics Ltd',
        status: 'DRAFT',
        subtotal: 12288.14,
        taxAmount: 2211.86,
        totalAmount: 14500.00,
        amountPaid: 0.00,
        balanceDue: 14500.00
      },
      newSnapshot: {
        id: 'inv-1',
        invoiceNumber: 'INV-2026-0042',
        customerName: 'Acme Global Logistics Ltd',
        status: 'ISSUED',
        subtotal: 12288.14,
        taxAmount: 2211.86,
        totalAmount: 14500.00,
        amountPaid: 0.00,
        balanceDue: 14500.00,
        issuedAt: '2026-09-27T10:00:00Z'
      },
      createdAt: '2026-09-27T10:00:00Z'
    },
    {
      id: 'log-102',
      entityType: 'PARTY',
      entityId: 'cust-1',
      entityName: 'Acme Global Logistics Ltd',
      action: 'UPDATE',
      actorId: 'usr-2',
      actorName: 'Sarah Procurement',
      oldSnapshot: {
        id: 'cust-1',
        name: 'Acme Global Logistics Ltd',
        code: 'CUST-001',
        creditLimit: 50000.00,
        paymentTermsDays: 30,
        active: true
      },
      newSnapshot: {
        id: 'cust-1',
        name: 'Acme Global Logistics Ltd',
        code: 'CUST-001',
        creditLimit: 75000.00,
        paymentTermsDays: 45,
        active: true
      },
      createdAt: '2026-09-26T15:20:00Z'
    },
    {
      id: 'log-103',
      entityType: 'JOURNAL_ENTRY',
      entityId: 'je-1',
      entityName: 'JE-2026-0001',
      action: 'POST',
      actorId: 'usr-1',
      actorName: 'System Admin',
      oldSnapshot: {
        id: 'je-1',
        entryNumber: 'JE-2026-0001',
        reference: 'Q3 Equipment Depreciation',
        status: 'DRAFT',
        totalDebit: 1250.00,
        totalCredit: 1250.00
      },
      newSnapshot: {
        id: 'je-1',
        entryNumber: 'JE-2026-0001',
        reference: 'Q3 Equipment Depreciation',
        status: 'POSTED',
        totalDebit: 1250.00,
        totalCredit: 1250.00,
        postedAt: '2026-09-25T11:00:00Z'
      },
      createdAt: '2026-09-25T11:00:00Z'
    },
    {
      id: 'log-104',
      entityType: 'ITEM',
      entityId: 'item-1',
      entityName: 'High Performance Server Blade X1',
      action: 'UPDATE',
      actorId: 'usr-3',
      actorName: 'David Finance',
      oldSnapshot: {
        id: 'item-1',
        sku: 'SKU-SER-001',
        name: 'High Performance Server Blade X1',
        salePrice: 2400.00,
        purchasePrice: 1800.00,
        taxRate: 18
      },
      newSnapshot: {
        id: 'item-1',
        sku: 'SKU-SER-001',
        name: 'High Performance Server Blade X1',
        salePrice: 2450.00,
        purchasePrice: 1850.00,
        taxRate: 18
      },
      createdAt: '2026-09-24T09:45:00Z'
    },
    {
      id: 'log-105',
      entityType: 'PURCHASE_ORDER',
      entityId: 'po-1',
      entityName: 'PO-2026-0089',
      action: 'CREATE',
      actorId: 'usr-2',
      actorName: 'Sarah Procurement',
      oldSnapshot: null,
      newSnapshot: {
        id: 'po-1',
        orderNumber: 'PO-2026-0089',
        vendorName: 'Pacific Office Supplies Inc',
        status: 'DRAFT',
        totalAmount: 3776.00,
        itemsCount: 1
      },
      createdAt: '2026-09-22T09:15:00Z'
    }
  ];

  getAuditLogs(): Observable<AuditLogItem[]> {
    return this.api.get<AuditLogItem[]>('/audit/logs', { suppressToast: true }).pipe(
      catchError(() => of(this.mockLogs))
    );
  }

  getLogsByEntity(entityType: string, entityId: string): Observable<AuditLogItem[]> {
    return this.api.get<AuditLogItem[]>(`/audit/logs/${entityType}/${entityId}`).pipe(
      catchError(() => {
        const filtered = this.mockLogs.filter(l => l.entityType === entityType && l.entityId === entityId);
        return of(filtered);
      })
    );
  }
}
