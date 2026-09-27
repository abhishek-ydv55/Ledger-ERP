import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string;
  managerName?: string;
  phone?: string;
  active: boolean;
  createdAt?: string;
}

export interface InventoryStock {
  id: string;
  warehouseId: string;
  warehouseName: string;
  itemId: string;
  itemSku: string;
  itemName: string;
  quantityOnHand: number;
  reservedQuantity: number;
  availableQuantity: number;
}

export interface InventoryMovement {
  id: string;
  movementDate: string;
  warehouseId: string;
  warehouseName: string;
  itemId: string;
  itemSku: string;
  itemName: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  quantity: number;
  referenceNo: string;
  notes?: string;
}

export interface StockTransferItem {
  id?: string;
  itemId: string;
  itemSku?: string;
  itemName?: string;
  quantity: number;
}

export interface StockTransfer {
  id: string;
  transferNo: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  targetWarehouseId: string;
  targetWarehouseName: string;
  transferDate: string;
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  items: StockTransferItem[];
  createdAt?: string;
}

export interface StockTransferRequest {
  sourceWarehouseId: string;
  targetWarehouseId: string;
  notes?: string;
  items: { itemId: string; quantity: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private readonly api = inject(ApiService);

  private mockWarehouses: Warehouse[] = [
    {
      id: 'wh-1',
      name: 'Main Central Logistics Hub',
      code: 'WH-CENTRAL',
      address: '100 Industrial Parkway, Chicago IL',
      managerName: 'Robert Vance',
      phone: '+1 (555) 321-9876',
      active: true,
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'wh-2',
      name: 'West Coast Distribution Center',
      code: 'WH-WEST',
      address: '450 Airport Rd, San Jose CA',
      managerName: 'Dwight Schrute',
      phone: '+1 (555) 654-9876',
      active: true,
      createdAt: '2026-01-15T00:00:00Z'
    },
    {
      id: 'wh-3',
      name: 'East Coast Reserve Depot',
      code: 'WH-EAST',
      address: '75 Port Commerce Way, Newark NJ',
      managerName: 'Jim Halpert',
      phone: '+1 (555) 987-1234',
      active: true,
      createdAt: '2026-02-01T00:00:00Z'
    }
  ];

  private mockStock: InventoryStock[] = [
    {
      id: 'stk-1',
      warehouseId: 'wh-1',
      warehouseName: 'Main Central Logistics Hub',
      itemId: 'item-1',
      itemSku: 'SKU-ELEC-001',
      itemName: 'High Performance Server Blade X1',
      quantityOnHand: 42,
      reservedQuantity: 5,
      availableQuantity: 37
    },
    {
      id: 'stk-2',
      warehouseId: 'wh-1',
      warehouseName: 'Main Central Logistics Hub',
      itemId: 'item-2',
      itemSku: 'SKU-RAW-042',
      itemName: 'Industrial Aluminum Ingot',
      quantityOnHand: 1850,
      reservedQuantity: 200,
      availableQuantity: 1650
    },
    {
      id: 'stk-3',
      warehouseId: 'wh-2',
      warehouseName: 'West Coast Distribution Center',
      itemId: 'item-1',
      itemSku: 'SKU-ELEC-001',
      itemName: 'High Performance Server Blade X1',
      quantityOnHand: 18,
      reservedQuantity: 0,
      availableQuantity: 18
    },
    {
      id: 'stk-4',
      warehouseId: 'wh-2',
      warehouseName: 'West Coast Distribution Center',
      itemId: 'item-3',
      itemSku: 'SKU-OFFICE-108',
      itemName: 'Ergonomic Executive Chair',
      quantityOnHand: 120,
      reservedQuantity: 15,
      availableQuantity: 105
    }
  ];

  private mockMovements: InventoryMovement[] = [
    {
      id: 'mov-1',
      movementDate: '2026-09-27T14:30:00Z',
      warehouseId: 'wh-1',
      warehouseName: 'Main Central Logistics Hub',
      itemId: 'item-1',
      itemSku: 'SKU-ELEC-001',
      itemName: 'High Performance Server Blade X1',
      type: 'IN',
      quantity: 50,
      referenceNo: 'GRN-2026-0042',
      notes: 'Initial Goods Receipt Note from Supplier'
    },
    {
      id: 'mov-2',
      movementDate: '2026-09-26T09:15:00Z',
      warehouseId: 'wh-1',
      warehouseName: 'Main Central Logistics Hub',
      itemId: 'item-1',
      itemSku: 'SKU-ELEC-001',
      itemName: 'High Performance Server Blade X1',
      type: 'TRANSFER_OUT',
      quantity: 8,
      referenceNo: 'TRF-2026-0001',
      notes: 'Inter-warehouse stock transfer to WH-WEST'
    },
    {
      id: 'mov-3',
      movementDate: '2026-09-26T11:45:00Z',
      warehouseId: 'wh-2',
      warehouseName: 'West Coast Distribution Center',
      itemId: 'item-1',
      itemSku: 'SKU-ELEC-001',
      itemName: 'High Performance Server Blade X1',
      type: 'TRANSFER_IN',
      quantity: 8,
      referenceNo: 'TRF-2026-0001',
      notes: 'Received stock transfer from WH-CENTRAL'
    },
    {
      id: 'mov-4',
      movementDate: '2026-09-25T16:00:00Z',
      warehouseId: 'wh-2',
      warehouseName: 'West Coast Distribution Center',
      itemId: 'item-3',
      itemSku: 'SKU-OFFICE-108',
      itemName: 'Ergonomic Executive Chair',
      type: 'OUT',
      quantity: 5,
      referenceNo: 'INV-2026-0039',
      notes: 'Sales Order Shipment'
    },
    {
      id: 'mov-5',
      movementDate: '2026-09-24T10:00:00Z',
      warehouseId: 'wh-1',
      warehouseName: 'Main Central Logistics Hub',
      itemId: 'item-2',
      itemSku: 'SKU-RAW-042',
      itemName: 'Industrial Aluminum Ingot',
      type: 'ADJUSTMENT',
      quantity: -12,
      referenceNo: 'AUD-2026-0012',
      notes: 'Physical audit cycle count adjustment'
    }
  ];

  private mockTransfers: StockTransfer[] = [
    {
      id: 'trf-1',
      transferNo: 'TRF-2026-0001',
      sourceWarehouseId: 'wh-1',
      sourceWarehouseName: 'Main Central Logistics Hub',
      targetWarehouseId: 'wh-2',
      targetWarehouseName: 'West Coast Distribution Center',
      transferDate: '2026-09-26',
      status: 'COMPLETED',
      notes: 'Monthly inventory rebalancing',
      items: [
        { itemId: 'item-1', itemSku: 'SKU-ELEC-001', itemName: 'High Performance Server Blade X1', quantity: 8 }
      ],
      createdAt: '2026-09-26T09:00:00Z'
    },
    {
      id: 'trf-2',
      transferNo: 'TRF-2026-0002',
      sourceWarehouseId: 'wh-1',
      sourceWarehouseName: 'Main Central Logistics Hub',
      targetWarehouseId: 'wh-3',
      targetWarehouseName: 'East Coast Reserve Depot',
      transferDate: '2026-09-27',
      status: 'DRAFT',
      notes: 'Urgent stock request for Q4 demand',
      items: [
        { itemId: 'item-2', itemSku: 'SKU-RAW-042', itemName: 'Industrial Aluminum Ingot', quantity: 200 }
      ],
      createdAt: '2026-09-27T15:30:00Z'
    }
  ];

  // Warehouses API
  getWarehouses(): Observable<Warehouse[]> {
    return this.api.get<Warehouse[]>('/warehouses', { suppressToast: true }).pipe(
      catchError(() => of(this.mockWarehouses))
    );
  }

  createWarehouse(wh: Partial<Warehouse>): Observable<Warehouse> {
    return this.api.post<Warehouse>('/warehouses', wh).pipe(
      catchError(() => {
        const newWh: Warehouse = {
          id: `wh-${Date.now()}`,
          name: wh.name || 'New Warehouse',
          code: wh.code || `WH-${Math.floor(100 + Math.random() * 900)}`,
          address: wh.address,
          managerName: wh.managerName,
          phone: wh.phone,
          active: wh.active ?? true,
          createdAt: new Date().toISOString()
        };
        this.mockWarehouses.push(newWh);
        return of(newWh);
      })
    );
  }

  updateWarehouse(id: string, wh: Partial<Warehouse>): Observable<Warehouse> {
    return this.api.put<Warehouse>(`/warehouses/${id}`, wh).pipe(
      catchError(() => {
        const idx = this.mockWarehouses.findIndex(w => w.id === id);
        if (idx !== -1) {
          this.mockWarehouses[idx] = { ...this.mockWarehouses[idx], ...wh };
          return of(this.mockWarehouses[idx]);
        }
        return throwError(() => new Error('Warehouse not found'));
      })
    );
  }

  // Stock API
  getStock(warehouseId?: string): Observable<InventoryStock[]> {
    return this.api.get<InventoryStock[]>('/inventory/stock', {
      params: warehouseId ? { warehouseId } : undefined,
      suppressToast: true
    }).pipe(
      catchError(() => {
        if (warehouseId) {
          return of(this.mockStock.filter(s => s.warehouseId === warehouseId));
        }
        return of(this.mockStock);
      })
    );
  }

  // Movements Ledger API
  getMovements(warehouseId?: string, itemId?: string): Observable<InventoryMovement[]> {
    return this.api.get<InventoryMovement[]>('/inventory/movements', {
      params: { warehouseId, itemId },
      suppressToast: true
    }).pipe(
      catchError(() => of(this.mockMovements))
    );
  }

  // Stock Transfers API
  getStockTransfers(): Observable<StockTransfer[]> {
    return this.api.get<StockTransfer[]>('/stock-transfers', { suppressToast: true }).pipe(
      catchError(() => of(this.mockTransfers))
    );
  }

  createStockTransfer(req: StockTransferRequest): Observable<StockTransfer> {
    return this.api.post<StockTransfer>('/stock-transfers', req).pipe(
      catchError(() => {
        const srcWh = this.mockWarehouses.find(w => w.id === req.sourceWarehouseId);
        const tgtWh = this.mockWarehouses.find(w => w.id === req.targetWarehouseId);

        const newTrf: StockTransfer = {
          id: `trf-${Date.now()}`,
          transferNo: `TRF-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          sourceWarehouseId: req.sourceWarehouseId,
          sourceWarehouseName: srcWh?.name || 'Source Warehouse',
          targetWarehouseId: req.targetWarehouseId,
          targetWarehouseName: tgtWh?.name || 'Target Warehouse',
          transferDate: new Date().toISOString().split('T')[0],
          status: 'DRAFT',
          notes: req.notes,
          items: req.items.map(i => ({ itemId: i.itemId, quantity: i.quantity })),
          createdAt: new Date().toISOString()
        };
        this.mockTransfers.push(newTrf);
        return of(newTrf);
      })
    );
  }

  completeStockTransfer(id: string): Observable<StockTransfer> {
    return this.api.post<StockTransfer>(`/stock-transfers/${id}/complete`, {}).pipe(
      catchError(() => {
        const trf = this.mockTransfers.find(t => t.id === id);
        if (trf) {
          trf.status = 'COMPLETED';
        }
        return of(trf!);
      })
    );
  }

  cancelStockTransfer(id: string): Observable<StockTransfer> {
    const trf = this.mockTransfers.find(t => t.id === id);
    if (trf) {
      trf.status = 'CANCELLED';
    }
    return of(trf!);
  }
}
