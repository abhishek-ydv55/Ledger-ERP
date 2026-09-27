import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';

export type PartyType = 'CUSTOMER' | 'VENDOR';

export interface PartyContact {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  designation?: string;
  isPrimary?: boolean;
}

export interface PartyAddress {
  id?: string;
  addressType: 'BILLING' | 'SHIPPING' | 'BRANCH' | 'REGISTERED';
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isPrimary?: boolean;
}

export interface Party {
  id: string;
  organizationId?: string;
  name: string;
  code?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  active: boolean;
  creditLimit?: number; // Customer specific
  paymentTermsDays?: number; // Vendor specific
  roles: PartyType[];
  contacts: PartyContact[];
  addresses: PartyAddress[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PartyRequest {
  name: string;
  code?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  active?: boolean;
  creditLimit?: number;
  paymentTermsDays?: number;
  roles?: PartyType[];
  contacts?: PartyContact[];
  addresses?: PartyAddress[];
}

@Injectable({
  providedIn: 'root'
})
export class PartiesService {
  private readonly api = inject(ApiService);

  private mockCustomers: Party[] = [
    {
      id: 'cust-1',
      name: 'Acme Global Logistics Ltd',
      code: 'CUST-001',
      email: 'billing@acmeglobal.com',
      phone: '+1 (555) 234-5678',
      taxId: 'US-987654321',
      active: true,
      creditLimit: 75000,
      roles: ['CUSTOMER'],
      contacts: [
        {
          name: 'Sarah Connor',
          email: 'sarah.c@acmeglobal.com',
          phone: '+1 (555) 234-5679',
          designation: 'Procurement Director',
          isPrimary: true
        }
      ],
      addresses: [
        {
          addressType: 'BILLING',
          addressLine1: '100 Industrial Parkway',
          addressLine2: 'Suite 400',
          city: 'Chicago',
          state: 'IL',
          postalCode: '60601',
          country: 'USA',
          isPrimary: true
        }
      ],
      createdAt: '2026-01-10T10:00:00Z'
    },
    {
      id: 'cust-2',
      name: 'Apex Innovations Corp',
      code: 'CUST-002',
      email: 'accounts@apexinnovations.io',
      phone: '+1 (555) 876-5432',
      taxId: 'US-123456789',
      active: true,
      creditLimit: 120000,
      roles: ['CUSTOMER'],
      contacts: [
        {
          name: 'David Miller',
          email: 'david.m@apexinnovations.io',
          phone: '+1 (555) 876-5433',
          designation: 'VP Finance',
          isPrimary: true
        }
      ],
      addresses: [
        {
          addressType: 'BILLING',
          addressLine1: '500 Technology Way',
          city: 'Austin',
          state: 'TX',
          postalCode: '78701',
          country: 'USA',
          isPrimary: true
        }
      ],
      createdAt: '2026-01-20T14:15:00Z'
    },
    {
      id: 'cust-3',
      name: 'Starlight Tech Solutions',
      code: 'CUST-003',
      email: 'finance@starlighttech.com',
      phone: '+1 (555) 345-6789',
      taxId: 'US-456789012',
      active: true,
      creditLimit: 50000,
      roles: ['CUSTOMER'],
      contacts: [],
      addresses: [],
      createdAt: '2026-02-05T09:30:00Z'
    }
  ];

  private mockVendors: Party[] = [
    {
      id: 'vend-1',
      name: 'Pacific Office Supplies Inc',
      code: 'VEND-001',
      email: 'orders@pacificoffice.com',
      phone: '+1 (555) 432-1098',
      taxId: 'US-876543210',
      active: true,
      paymentTermsDays: 30,
      roles: ['VENDOR'],
      contacts: [
        {
          name: 'Robert Vance',
          email: 'robert@pacificoffice.com',
          phone: '+1 (555) 432-1099',
          designation: 'Account Manager',
          isPrimary: true
        }
      ],
      addresses: [
        {
          addressType: 'BRANCH',
          addressLine1: '789 Commerce St',
          city: 'Seattle',
          state: 'WA',
          postalCode: '98101',
          country: 'USA',
          isPrimary: true
        }
      ],
      createdAt: '2026-01-12T11:00:00Z'
    },
    {
      id: 'vend-2',
      name: 'Vanguard Industrial Supplies',
      code: 'VEND-002',
      email: 'support@vanguardind.com',
      phone: '+1 (555) 654-3210',
      taxId: 'US-345678901',
      active: true,
      paymentTermsDays: 45,
      roles: ['VENDOR'],
      contacts: [],
      addresses: [],
      createdAt: '2026-02-01T16:20:00Z'
    }
  ];

  // Customer Operations
  getCustomers(): Observable<Party[]> {
    return this.api.get<Party[]>('/customers', { suppressToast: true }).pipe(
      catchError(() => of(this.mockCustomers))
    );
  }

  getCustomerById(id: string): Observable<Party> {
    return this.api.get<Party>(`/customers/${id}`).pipe(
      catchError(() => {
        const found = this.mockCustomers.find(c => c.id === id);
        if (found) return of(found);
        return throwError(() => new Error('Customer not found'));
      })
    );
  }

  createCustomer(partyReq: PartyRequest): Observable<Party> {
    return this.api.post<Party>('/customers', partyReq).pipe(
      catchError(() => {
        const newParty: Party = {
          id: `cust-${Date.now()}`,
          name: partyReq.name,
          code: partyReq.code || `CUST-${Math.floor(100 + Math.random() * 900)}`,
          email: partyReq.email,
          phone: partyReq.phone,
          taxId: partyReq.taxId,
          active: partyReq.active ?? true,
          creditLimit: partyReq.creditLimit || 50000,
          roles: ['CUSTOMER'],
          contacts: partyReq.contacts || [],
          addresses: partyReq.addresses || [],
          createdAt: new Date().toISOString()
        };
        this.mockCustomers.push(newParty);
        return of(newParty);
      })
    );
  }

  updateCustomer(id: string, partyReq: PartyRequest): Observable<Party> {
    return this.api.put<Party>(`/customers/${id}`, partyReq).pipe(
      catchError(() => {
        const idx = this.mockCustomers.findIndex(c => c.id === id);
        if (idx !== -1) {
          this.mockCustomers[idx] = {
            ...this.mockCustomers[idx],
            ...partyReq,
            updatedAt: new Date().toISOString()
          };
          return of(this.mockCustomers[idx]);
        }
        return throwError(() => new Error('Customer not found'));
      })
    );
  }

  deleteCustomer(id: string): Observable<void> {
    return this.api.delete<void>(`/customers/${id}`).pipe(
      catchError(() => {
        this.mockCustomers = this.mockCustomers.filter(c => c.id !== id);
        return of(undefined);
      })
    );
  }

  // Vendor Operations
  getVendors(): Observable<Party[]> {
    return this.api.get<Party[]>('/vendors', { suppressToast: true }).pipe(
      catchError(() => of(this.mockVendors))
    );
  }

  getVendorById(id: string): Observable<Party> {
    return this.api.get<Party>(`/vendors/${id}`).pipe(
      catchError(() => {
        const found = this.mockVendors.find(v => v.id === id);
        if (found) return of(found);
        return throwError(() => new Error('Vendor not found'));
      })
    );
  }

  createVendor(partyReq: PartyRequest): Observable<Party> {
    return this.api.post<Party>('/vendors', partyReq).pipe(
      catchError(() => {
        const newParty: Party = {
          id: `vend-${Date.now()}`,
          name: partyReq.name,
          code: partyReq.code || `VEND-${Math.floor(100 + Math.random() * 900)}`,
          email: partyReq.email,
          phone: partyReq.phone,
          taxId: partyReq.taxId,
          active: partyReq.active ?? true,
          paymentTermsDays: partyReq.paymentTermsDays || 30,
          roles: ['VENDOR'],
          contacts: partyReq.contacts || [],
          addresses: partyReq.addresses || [],
          createdAt: new Date().toISOString()
        };
        this.mockVendors.push(newParty);
        return of(newParty);
      })
    );
  }

  updateVendor(id: string, partyReq: PartyRequest): Observable<Party> {
    return this.api.put<Party>(`/vendors/${id}`, partyReq).pipe(
      catchError(() => {
        const idx = this.mockVendors.findIndex(v => v.id === id);
        if (idx !== -1) {
          this.mockVendors[idx] = {
            ...this.mockVendors[idx],
            ...partyReq,
            updatedAt: new Date().toISOString()
          };
          return of(this.mockVendors[idx]);
        }
        return throwError(() => new Error('Vendor not found'));
      })
    );
  }

  deleteVendor(id: string): Observable<void> {
    return this.api.delete<void>(`/vendors/${id}`).pipe(
      catchError(() => {
        this.mockVendors = this.mockVendors.filter(v => v.id !== id);
        return of(undefined);
      })
    );
  }
}
