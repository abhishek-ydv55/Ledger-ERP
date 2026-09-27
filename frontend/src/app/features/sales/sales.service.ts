import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';

export type EstimateStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
export type SalesOrderStatus = 'DRAFT' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'INVOICED';
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIALLY_PAID' | 'VOID' | 'OVERDUE' | 'CANCELLED';

export interface SalesItem {
  id?: string;
  itemId?: string;
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
  lineTotal?: number;
}

export interface Estimate {
  id: string;
  estimateNumber: string;
  customerId: string;
  customerName: string;
  estimateDate: string;
  expiryDate?: string;
  status: EstimateStatus;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  items: SalesItem[];
  createdAt?: string;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  estimateId?: string;
  customerId: string;
  customerName: string;
  orderDate: string;
  status: SalesOrderStatus;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  items: SalesItem[];
  createdAt?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  salesOrderId?: string;
  customerId: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string;
  items: SalesItem[];
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private readonly api = inject(ApiService);

  private mockEstimates: Estimate[] = [
    {
      id: 'est-1',
      estimateNumber: 'EST-2026-001',
      customerId: 'cust-1',
      customerName: 'Acme Global Logistics Ltd',
      estimateDate: '2026-09-20',
      expiryDate: '2026-10-20',
      status: 'SENT',
      subtotal: 12000.00,
      taxAmount: 2160.00,
      totalAmount: 14160.00,
      notes: 'Quotation for Q4 server upgrade blade infrastructure',
      items: [
        { itemName: 'High Performance Server Blade X1', quantity: 5, unitPrice: 2400.00, taxRate: 18, lineTotal: 14160.00 }
      ],
      createdAt: '2026-09-20T10:00:00Z'
    },
    {
      id: 'est-2',
      estimateNumber: 'EST-2026-002',
      customerId: 'cust-2',
      customerName: 'Apex Innovations Corp',
      estimateDate: '2026-09-25',
      expiryDate: '2026-10-25',
      status: 'ACCEPTED',
      subtotal: 4500.00,
      taxAmount: 225.00,
      totalAmount: 4725.00,
      notes: 'Industrial aluminum raw material quotation',
      items: [
        { itemName: 'Industrial Aluminum Ingot', quantity: 360, unitPrice: 12.50, taxRate: 5, lineTotal: 4725.00 }
      ],
      createdAt: '2026-09-25T14:30:00Z'
    }
  ];

  private mockOrders: SalesOrder[] = [
    {
      id: 'so-1',
      orderNumber: 'SO-2026-001',
      estimateId: 'est-2',
      customerId: 'cust-2',
      customerName: 'Apex Innovations Corp',
      orderDate: '2026-09-26',
      status: 'CONFIRMED',
      subtotal: 4500.00,
      taxAmount: 225.00,
      totalAmount: 4725.00,
      notes: 'Confirmed sales order from estimate EST-2026-002',
      items: [
        { itemName: 'Industrial Aluminum Ingot', quantity: 360, unitPrice: 12.50, taxRate: 5, lineTotal: 4725.00 }
      ],
      createdAt: '2026-09-26T09:00:00Z'
    }
  ];

  private mockInvoices: Invoice[] = [
    {
      id: 'inv-1',
      invoiceNumber: 'INV-2026-0042',
      customerId: 'cust-1',
      customerName: 'Acme Global Logistics Ltd',
      invoiceDate: '2026-09-27',
      dueDate: '2026-10-27',
      status: 'ISSUED',
      subtotal: 12288.14,
      taxAmount: 2211.86,
      totalAmount: 14500.00,
      amountPaid: 0.00,
      balanceDue: 14500.00,
      notes: 'Payment due within 30 days of invoice date',
      items: [
        { itemName: 'High Performance Server Blade X1', quantity: 5, unitPrice: 2450.00, taxRate: 18, lineTotal: 14455.00 }
      ],
      createdAt: '2026-09-27T10:00:00Z'
    },
    {
      id: 'inv-2',
      invoiceNumber: 'INV-2026-0039',
      customerId: 'cust-3',
      customerName: 'Starlight Tech Solutions',
      invoiceDate: '2026-09-10',
      dueDate: '2026-09-25',
      status: 'PARTIALLY_PAID',
      subtotal: 18728.81,
      taxAmount: 3371.19,
      totalAmount: 22100.00,
      amountPaid: 10000.00,
      balanceDue: 12100.00,
      notes: 'Partial payment received $10,000 on Sept 20',
      items: [
        { itemName: 'Ergonomic Executive Chair', quantity: 60, unitPrice: 350.00, taxRate: 18, lineTotal: 22100.00 }
      ],
      createdAt: '2026-09-10T12:00:00Z'
    }
  ];

  // Estimates API
  getEstimates(): Observable<Estimate[]> {
    return this.api.get<Estimate[]>('/estimates', { suppressToast: true }).pipe(
      catchError(() => of(this.mockEstimates))
    );
  }

  createEstimate(req: Partial<Estimate>): Observable<Estimate> {
    return this.api.post<Estimate>('/estimates', req).pipe(
      catchError(() => {
        const newEst: Estimate = {
          id: `est-${Date.now()}`,
          estimateNumber: `EST-2026-${Math.floor(100 + Math.random() * 900)}`,
          customerId: req.customerId || 'cust-1',
          customerName: req.customerName || 'Acme Global Logistics Ltd',
          estimateDate: req.estimateDate || new Date().toISOString().split('T')[0],
          expiryDate: req.expiryDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          status: 'DRAFT',
          subtotal: req.subtotal || 0,
          taxAmount: req.taxAmount || 0,
          totalAmount: req.totalAmount || 0,
          notes: req.notes,
          items: req.items || [],
          createdAt: new Date().toISOString()
        };
        this.mockEstimates.unshift(newEst);
        return of(newEst);
      })
    );
  }

  updateEstimateStatus(id: string, status: EstimateStatus): Observable<Estimate> {
    return this.api.put<Estimate>(`/estimates/${id}/status?status=${status}`, {}).pipe(
      catchError(() => {
        const est = this.mockEstimates.find(e => e.id === id);
        if (est) est.status = status;
        return of(est!);
      })
    );
  }

  deleteEstimate(id: string): Observable<void> {
    return this.api.delete<void>(`/estimates/${id}`).pipe(
      catchError(() => {
        this.mockEstimates = this.mockEstimates.filter(e => e.id !== id);
        return of(undefined);
      })
    );
  }

  // Sales Orders API
  getSalesOrders(): Observable<SalesOrder[]> {
    return this.api.get<SalesOrder[]>('/sales-orders', { suppressToast: true }).pipe(
      catchError(() => of(this.mockOrders))
    );
  }

  createSalesOrder(req: Partial<SalesOrder>): Observable<SalesOrder> {
    return this.api.post<SalesOrder>('/sales-orders', req).pipe(
      catchError(() => {
        const newSo: SalesOrder = {
          id: `so-${Date.now()}`,
          orderNumber: `SO-2026-${Math.floor(100 + Math.random() * 900)}`,
          customerId: req.customerId || 'cust-1',
          customerName: req.customerName || 'Customer Account',
          orderDate: req.orderDate || new Date().toISOString().split('T')[0],
          status: 'DRAFT',
          subtotal: req.subtotal || 0,
          taxAmount: req.taxAmount || 0,
          totalAmount: req.totalAmount || 0,
          notes: req.notes,
          items: req.items || [],
          createdAt: new Date().toISOString()
        };
        this.mockOrders.unshift(newSo);
        return of(newSo);
      })
    );
  }

  updateSalesOrderStatus(id: string, status: SalesOrderStatus): Observable<SalesOrder> {
    return this.api.put<SalesOrder>(`/sales-orders/${id}/status?status=${status}`, {}).pipe(
      catchError(() => {
        const so = this.mockOrders.find(s => s.id === id);
        if (so) so.status = status;
        return of(so!);
      })
    );
  }

  deleteSalesOrder(id: string): Observable<void> {
    return this.api.delete<void>(`/sales-orders/${id}`).pipe(
      catchError(() => {
        this.mockOrders = this.mockOrders.filter(s => s.id !== id);
        return of(undefined);
      })
    );
  }

  // Invoices API
  getInvoices(): Observable<Invoice[]> {
    return this.api.get<Invoice[]>('/invoices', { suppressToast: true }).pipe(
      catchError(() => of(this.mockInvoices))
    );
  }

  createInvoice(req: Partial<Invoice>): Observable<Invoice> {
    return this.api.post<Invoice>('/invoices', req).pipe(
      catchError(() => {
        const total = req.totalAmount || 0;
        const newInv: Invoice = {
          id: `inv-${Date.now()}`,
          invoiceNumber: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
          customerId: req.customerId || 'cust-1',
          customerName: req.customerName || 'Customer Account',
          invoiceDate: req.invoiceDate || new Date().toISOString().split('T')[0],
          dueDate: req.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          status: 'DRAFT',
          subtotal: req.subtotal || 0,
          taxAmount: req.taxAmount || 0,
          totalAmount: total,
          amountPaid: 0,
          balanceDue: total,
          notes: req.notes,
          items: req.items || [],
          createdAt: new Date().toISOString()
        };
        this.mockInvoices.unshift(newInv);
        return of(newInv);
      })
    );
  }

  issueInvoice(id: string): Observable<Invoice> {
    return this.api.post<Invoice>(`/invoices/${id}/issue`, {}).pipe(
      catchError(() => {
        const inv = this.mockInvoices.find(i => i.id === id);
        if (inv) inv.status = 'ISSUED';
        return of(inv!);
      })
    );
  }

  updateInvoiceStatus(id: string, status: InvoiceStatus): Observable<Invoice> {
    return this.api.put<Invoice>(`/invoices/${id}/status?status=${status}`, {}).pipe(
      catchError(() => {
        const inv = this.mockInvoices.find(i => i.id === id);
        if (inv) inv.status = status;
        return of(inv!);
      })
    );
  }

  deleteInvoice(id: string): Observable<void> {
    return this.api.delete<void>(`/invoices/${id}`).pipe(
      catchError(() => {
        this.mockInvoices = this.mockInvoices.filter(i => i.id !== id);
        return of(undefined);
      })
    );
  }
}
