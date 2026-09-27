import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';

export interface ItemCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Unit {
  id: string;
  name: string;
  code: string;
  symbol?: string;
}

export interface TaxRate {
  id: string;
  name: string;
  code: string;
  rate: number;
}

export interface Item {
  id: string;
  name: string;
  sku: string;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  unitId?: string;
  unitCode?: string;
  taxRateId?: string;
  taxRate?: number;
  salePrice: number;
  purchasePrice: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ItemRequest {
  name: string;
  sku: string;
  description?: string;
  categoryId?: string;
  unitId?: string;
  taxRateId?: string;
  salePrice: number;
  purchasePrice: number;
  active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ItemsService {
  private readonly api = inject(ApiService);

  private mockCategories: ItemCategory[] = [
    { id: 'cat-1', name: 'Raw Materials', code: 'RAW_MAT', description: 'Primary manufacturing input materials' },
    { id: 'cat-2', name: 'Finished Goods', code: 'FIN_GOODS', description: 'Packaged products ready for sale' },
    { id: 'cat-3', name: 'Electronics', code: 'ELEC', description: 'Electronic components and devices' },
    { id: 'cat-4', name: 'Office Supplies', code: 'OFFICE', description: 'Consumables and office stationery' }
  ];

  private mockUnits: Unit[] = [
    { id: 'unit-1', name: 'Pieces', code: 'PCS', symbol: 'pc' },
    { id: 'unit-2', name: 'Kilograms', code: 'KG', symbol: 'kg' },
    { id: 'unit-3', name: 'Liters', code: 'LTR', symbol: 'L' },
    { id: 'unit-4', name: 'Box', code: 'BOX', symbol: 'box' },
    { id: 'unit-5', name: 'Meters', code: 'MTR', symbol: 'm' }
  ];

  private mockTaxRates: TaxRate[] = [
    { id: 'tax-1', name: 'Standard GST / VAT (18%)', code: 'STD_18', rate: 18.0 },
    { id: 'tax-2', name: 'Reduced Rate (5%)', code: 'RED_5', rate: 5.0 },
    { id: 'tax-3', name: 'Zero Rate (0%)', code: 'ZERO_0', rate: 0.0 },
    { id: 'tax-4', name: 'Exempt', code: 'EXEMPT', rate: 0.0 }
  ];

  private mockItems: Item[] = [
    {
      id: 'item-1',
      name: 'High Performance Server Blade X1',
      sku: 'SKU-ELEC-001',
      description: 'Dual socket rackmount server blade',
      categoryId: 'cat-3',
      categoryName: 'Electronics',
      unitId: 'unit-1',
      unitCode: 'PCS',
      taxRateId: 'tax-1',
      taxRate: 18.0,
      salePrice: 2450.00,
      purchasePrice: 1800.00,
      active: true,
      createdAt: '2026-01-15T10:00:00Z'
    },
    {
      id: 'item-2',
      name: 'Industrial Aluminum Ingot',
      sku: 'SKU-RAW-042',
      description: '99.7% pure aluminum ingot per kg',
      categoryId: 'cat-1',
      categoryName: 'Raw Materials',
      unitId: 'unit-2',
      unitCode: 'KG',
      taxRateId: 'tax-2',
      taxRate: 5.0,
      salePrice: 12.50,
      purchasePrice: 8.75,
      active: true,
      createdAt: '2026-01-20T14:30:00Z'
    },
    {
      id: 'item-3',
      name: 'Ergonomic Executive Chair',
      sku: 'SKU-OFFICE-108',
      description: 'Breathable mesh lumbar support chair',
      categoryId: 'cat-4',
      categoryName: 'Office Supplies',
      unitId: 'unit-1',
      unitCode: 'PCS',
      taxRateId: 'tax-1',
      taxRate: 18.0,
      salePrice: 350.00,
      purchasePrice: 210.00,
      active: true,
      createdAt: '2026-02-01T09:15:00Z'
    },
    {
      id: 'item-4',
      name: 'Synthetic Lubricant Oil 20L',
      sku: 'SKU-RAW-088',
      description: 'Heavy duty machinery lubricant drum',
      categoryId: 'cat-1',
      categoryName: 'Raw Materials',
      unitId: 'unit-3',
      unitCode: 'LTR',
      taxRateId: 'tax-1',
      taxRate: 18.0,
      salePrice: 145.00,
      purchasePrice: 95.00,
      active: true,
      createdAt: '2026-02-12T11:00:00Z'
    }
  ];

  // Items API
  getItems(): Observable<Item[]> {
    return this.api.get<Item[]>('/items', { suppressToast: true }).pipe(
      catchError(() => of(this.mockItems))
    );
  }

  createItem(itemReq: ItemRequest): Observable<Item> {
    return this.api.post<Item>('/items', itemReq).pipe(
      catchError(() => {
        const cat = this.mockCategories.find(c => c.id === itemReq.categoryId);
        const unit = this.mockUnits.find(u => u.id === itemReq.unitId);
        const tax = this.mockTaxRates.find(t => t.id === itemReq.taxRateId);

        const newItem: Item = {
          id: `item-${Date.now()}`,
          name: itemReq.name,
          sku: itemReq.sku,
          description: itemReq.description,
          categoryId: itemReq.categoryId,
          categoryName: cat?.name || 'General',
          unitId: itemReq.unitId,
          unitCode: unit?.code || 'PCS',
          taxRateId: itemReq.taxRateId,
          taxRate: tax?.rate || 0,
          salePrice: itemReq.salePrice,
          purchasePrice: itemReq.purchasePrice,
          active: itemReq.active ?? true,
          createdAt: new Date().toISOString()
        };
        this.mockItems.push(newItem);
        return of(newItem);
      })
    );
  }

  updateItem(id: string, itemReq: ItemRequest): Observable<Item> {
    return this.api.put<Item>(`/items/${id}`, itemReq).pipe(
      catchError(() => {
        const idx = this.mockItems.findIndex(i => i.id === id);
        if (idx !== -1) {
          const cat = this.mockCategories.find(c => c.id === itemReq.categoryId);
          const unit = this.mockUnits.find(u => u.id === itemReq.unitId);
          const tax = this.mockTaxRates.find(t => t.id === itemReq.taxRateId);

          this.mockItems[idx] = {
            ...this.mockItems[idx],
            ...itemReq,
            categoryName: cat?.name || this.mockItems[idx].categoryName,
            unitCode: unit?.code || this.mockItems[idx].unitCode,
            taxRate: tax?.rate ?? this.mockItems[idx].taxRate,
            updatedAt: new Date().toISOString()
          };
          return of(this.mockItems[idx]);
        }
        return throwError(() => new Error('Item not found'));
      })
    );
  }

  deleteItem(id: string): Observable<void> {
    return this.api.delete<void>(`/items/${id}`).pipe(
      catchError(() => {
        this.mockItems = this.mockItems.filter(i => i.id !== id);
        return of(undefined);
      })
    );
  }

  // Categories API
  getCategories(): Observable<ItemCategory[]> {
    return this.api.get<ItemCategory[]>('/item-categories', { suppressToast: true }).pipe(
      catchError(() => of(this.mockCategories))
    );
  }

  saveCategory(cat: ItemCategory): Observable<ItemCategory> {
    const idx = this.mockCategories.findIndex(c => c.id === cat.id);
    if (idx !== -1) {
      this.mockCategories[idx] = cat;
    } else {
      cat.id = `cat-${Date.now()}`;
      this.mockCategories.push(cat);
    }
    return of(cat);
  }

  deleteCategory(id: string): Observable<void> {
    this.mockCategories = this.mockCategories.filter(c => c.id !== id);
    return of(undefined);
  }

  // Units API
  getUnits(): Observable<Unit[]> {
    return this.api.get<Unit[]>('/units', { suppressToast: true }).pipe(
      catchError(() => of(this.mockUnits))
    );
  }

  saveUnit(unit: Unit): Observable<Unit> {
    const idx = this.mockUnits.findIndex(u => u.id === unit.id);
    if (idx !== -1) {
      this.mockUnits[idx] = unit;
    } else {
      unit.id = `unit-${Date.now()}`;
      this.mockUnits.push(unit);
    }
    return of(unit);
  }

  deleteUnit(id: string): Observable<void> {
    this.mockUnits = this.mockUnits.filter(u => u.id !== id);
    return of(undefined);
  }

  // Tax Rates API
  getTaxRates(): Observable<TaxRate[]> {
    return this.api.get<TaxRate[]>('/tax-rates', { suppressToast: true }).pipe(
      catchError(() => of(this.mockTaxRates))
    );
  }

  saveTaxRate(rate: TaxRate): Observable<TaxRate> {
    const idx = this.mockTaxRates.findIndex(t => t.id === rate.id);
    if (idx !== -1) {
      this.mockTaxRates[idx] = rate;
    } else {
      rate.id = `tax-${Date.now()}`;
      this.mockTaxRates.push(rate);
    }
    return of(rate);
  }

  deleteTaxRate(id: string): Observable<void> {
    this.mockTaxRates = this.mockTaxRates.filter(t => t.id !== id);
    return of(undefined);
  }
}
