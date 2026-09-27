import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';

export type PurchaseOrderStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
export type BillStatus = 'DRAFT' | 'RECORDED' | 'PAID' | 'PARTIALLY_PAID' | 'VOID' | 'CANCELLED';

export interface PurchaseItem {
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

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  vendorId: string;
  vendorName: string;
  orderDate: string;
  expectedDate?: string;
  status: PurchaseOrderStatus;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  items: PurchaseItem[];
  createdAt?: string;
}

export interface Bill {
  id: string;
  billNumber: string;
  purchaseOrderId?: string;
  vendorId: string;
  vendorName: string;
  billDate: string;
  dueDate: string;
  status: BillStatus;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string;
  items: PurchaseItem[];
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PurchasesService {
  private readonly api = inject(ApiService);

  private mockOrders: PurchaseOrder[] = [
    {
      id: 'po-1',
      orderNumber: 'PO-2026-0089',
      vendorId: 'vend-1',
      vendorName: 'Pacific Office Supplies Inc',
      orderDate: '2026-09-22',
      expectedDate: '2026-10-05',
      status: 'APPROVED',
      subtotal: 3200.00,
      taxAmount: 576.00,
      totalAmount: 3776.00,
      notes: 'Quarterly office ergonomic seating & supplies bulk purchase',
      items: [
        { itemName: 'Ergonomic Desk Accessories Kit', quantity: 40, unitPrice: 80.00, taxRate: 18, lineTotal: 3776.00 }
      ],
      createdAt: '2026-09-22T09:15:00Z'
    },
    {
      id: 'po-2',
      orderNumber: 'PO-2026-0092',
      vendorId: 'vend-2',
      vendorName: 'Vanguard Industrial Supplies',
      orderDate: '2026-09-26',
      expectedDate: '2026-10-10',
      status: 'SUBMITTED',
      subtotal: 18500.00,
      taxAmount: 925.00,
      totalAmount: 19425.00,
      notes: 'Raw metal extrusion materials order for manufacturing line',
      items: [
        { itemName: 'Industrial Steel Beam 12ft', quantity: 100, unitPrice: 185.00, taxRate: 5, lineTotal: 19425.00 }
      ],
      createdAt: '2026-09-26T11:40:00Z'
    }
  ];

  private mockBills: Bill[] = [
    {
      id: 'bill-1',
      billNumber: 'BILL-2026-0031',
      purchaseOrderId: 'po-1',
      vendorId: 'vend-1',
      vendorName: 'Pacific Office Supplies Inc',
      billDate: '2026-09-24',
      dueDate: '2026-10-24',
      status: 'RECORDED',
      subtotal: 3200.00,
      taxAmount: 576.00,
      totalAmount: 3776.00,
      amountPaid: 0.00,
      balanceDue: 3776.00,
      notes: 'Vendor Invoice #POS-8891 - Net 30 terms',
      items: [
        { itemName: 'Ergonomic Desk Accessories Kit', quantity: 40, unitPrice: 80.00, taxRate: 18, lineTotal: 3776.00 }
      ],
      createdAt: '2026-09-24T15:00:00Z'
    },
    {
      id: 'bill-2',
      billNumber: 'BILL-2026-0028',
      vendorId: 'vend-2',
      vendorName: 'Vanguard Industrial Supplies',
      billDate: '2026-09-01',
      dueDate: '2026-09-15',
      status: 'PARTIALLY_PAID',
      subtotal: 10000.00,
      taxAmount: 500.00,
      totalAmount: 10500.00,
      amountPaid: 5000.00,
      balanceDue: 5500.00,
      notes: 'First installment paid on Sept 10',
      items: [
        { itemName: 'Heavy Machinery Hydraulic Fluid', quantity: 50, unitPrice: 200.00, taxRate: 5, lineTotal: 10500.00 }
      ],
      createdAt: '2026-09-01T10:00:00Z'
    }
  ];

  // Purchase Orders API
  getPurchaseOrders(): Observable<PurchaseOrder[]> {
    return this.api.get<PurchaseOrder[]>('/purchase-orders', { suppressToast: true }).pipe(
      catchError(() => of(this.mockOrders))
    );
  }

  createPurchaseOrder(req: Partial<PurchaseOrder>): Observable<PurchaseOrder> {
    return this.api.post<PurchaseOrder>('/purchase-orders', req).pipe(
      catchError(() => {
        const newPo: PurchaseOrder = {
          id: `po-${Date.now()}`,
          orderNumber: `PO-2026-${Math.floor(100 + Math.random() * 900)}`,
          vendorId: req.vendorId || 'vend-1',
          vendorName: req.vendorName || 'Pacific Office Supplies Inc',
          orderDate: req.orderDate || new Date().toISOString().split('T')[0],
          expectedDate: req.expectedDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          status: 'DRAFT',
          subtotal: req.subtotal || 0,
          taxAmount: req.taxAmount || 0,
          totalAmount: req.totalAmount || 0,
          notes: req.notes,
          items: req.items || [],
          createdAt: new Date().toISOString()
        };
        this.mockOrders.unshift(newPo);
        return of(newPo);
      })
    );
  }

  updatePurchaseOrderStatus(id: string, status: PurchaseOrderStatus): Observable<PurchaseOrder> {
    return this.api.put<PurchaseOrder>(`/purchase-orders/${id}/status?status=${status}`, {}).pipe(
      catchError(() => {
        const po = this.mockOrders.find(p => p.id === id);
        if (po) po.status = status;
        return of(po!);
      })
    );
  }

  deletePurchaseOrder(id: string): Observable<void> {
    return this.api.delete<void>(`/purchase-orders/${id}`).pipe(
      catchError(() => {
        this.mockOrders = this.mockOrders.filter(p => p.id !== id);
        return of(undefined);
      })
    );
  }

  // Bills API
  getBills(): Observable<Bill[]> {
    return this.api.get<Bill[]>('/bills', { suppressToast: true }).pipe(
      catchError(() => of(this.mockBills))
    );
  }

  createBill(req: Partial<Bill>): Observable<Bill> {
    return this.api.post<Bill>('/bills', req).pipe(
      catchError(() => {
        const total = req.totalAmount || 0;
        const newBill: Bill = {
          id: `bill-${Date.now()}`,
          billNumber: `BILL-2026-${Math.floor(100 + Math.random() * 900)}`,
          vendorId: req.vendorId || 'vend-1',
          vendorName: req.vendorName || 'Vendor Account',
          billDate: req.billDate || new Date().toISOString().split('T')[0],
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
        this.mockBills.unshift(newBill);
        return of(newBill);
      })
    );
  }

  updateBillStatus(id: string, status: BillStatus): Observable<Bill> {
    return this.api.put<Bill>(`/bills/${id}/status?status=${status}`, {}).pipe(
      catchError(() => {
        const bill = this.mockBills.find(b => b.id === id);
        if (bill) bill.status = status;
        return of(bill!);
      })
    );
  }

  deleteBill(id: string): Observable<void> {
    return this.api.delete<void>(`/bills/${id}`).pipe(
      catchError(() => {
        this.mockBills = this.mockBills.filter(b => b.id !== id);
        return of(undefined);
      })
    );
  }
}
