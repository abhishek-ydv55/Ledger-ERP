import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PartiesService, Party, PartyType, PartyRequest } from './parties.service';
import { ToastService } from '../../core/services/toast.service';
import { DataTableComponent, ColumnDef } from '../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { CurrencyDisplayComponent } from '../../shared/components/currency-display/currency-display.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { FormDialogComponent } from '../../shared/components/form-dialog/form-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { PartyFormComponent } from './party-form.component';

export type PartyTab = 'customers' | 'vendors';

@Component({
  selector: 'app-parties',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DataTableComponent,
    StatusBadgeComponent,
    CurrencyDisplayComponent,
    ButtonComponent,
    FormDialogComponent,
    ConfirmDialogComponent,
    PartyFormComponent
  ],
  template: `
    <div class="space-y-6">
      
      <!-- Page Header & Action Controls -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Parties Directory
          </h1>
          <p class="text-xs sm:text-sm text-stone-500 dark:text-espresso-400 mt-1">
            Manage customer accounts, vendor suppliers, primary contacts, and billing addresses.
          </p>
        </div>

        <div class="flex items-center space-x-3">
          @if (activeTab() === 'customers') {
            <app-button variant="brass" size="sm" (click)="openCreateModal('CUSTOMER')">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
              </svg>
              Add Customer
            </app-button>
          } @else {
            <app-button variant="brass" size="sm" (click)="openCreateModal('VENDOR')">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-6 0h6"/>
              </svg>
              Add Vendor
            </app-button>
          }
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="border-b border-stone-200 dark:border-espresso-800">
        <nav class="flex space-x-8" aria-label="Parties Sub Tabs">
          <button
            (click)="setTab('customers')"
            [class.border-brass-500]="activeTab() === 'customers'"
            [class.text-brass-600]="activeTab() === 'customers'"
            [class.dark:text-brass-400]="activeTab() === 'customers'"
            [class.border-transparent]="activeTab() !== 'customers'"
            [class.text-stone-500]="activeTab() !== 'customers'"
            class="py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-150 flex items-center space-x-2 focus:outline-none"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span>Customers ({{ customers().length }})</span>
          </button>

          <button
            (click)="setTab('vendors')"
            [class.border-brass-500]="activeTab() === 'vendors'"
            [class.text-brass-600]="activeTab() === 'vendors'"
            [class.dark:text-brass-400]="activeTab() === 'vendors'"
            [class.border-transparent]="activeTab() !== 'vendors'"
            [class.text-stone-500]="activeTab() !== 'vendors'"
            class="py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-150 flex items-center space-x-2 focus:outline-none"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-6 0h6"/>
            </svg>
            <span>Vendor Suppliers ({{ vendors().length }})</span>
          </button>
        </nav>
      </div>

      <!-- Tab Content Area -->
      
      <!-- TAB 1: Customers List View -->
      @if (activeTab() === 'customers') {
        <div class="space-y-4 animate-fade-in">
          <app-data-table
            [data]="customers()"
            [columns]="customerTableColumns"
            [loading]="isLoading()"
            emptyTitle="No customer accounts"
            emptyMessage="No customer records found in the directory."
          ></app-data-table>
        </div>
      }

      <!-- TAB 2: Vendors List View -->
      @if (activeTab() === 'vendors') {
        <div class="space-y-4 animate-fade-in">
          <app-data-table
            [data]="vendors()"
            [columns]="vendorTableColumns"
            [loading]="isLoading()"
            emptyTitle="No vendor suppliers"
            emptyMessage="No vendor supplier records found in the directory."
          ></app-data-table>
        </div>
      }

      <!-- Shared Party Form Modal Dialog -->
      <app-form-dialog
        [isOpen]="isFormModalOpen()"
        [title]="selectedParty() ? 'Edit ' + (partyType() === 'CUSTOMER' ? 'Customer' : 'Vendor') : 'New ' + (partyType() === 'CUSTOMER' ? 'Customer' : 'Vendor')"
        [subtitle]="'Configure party profile, primary contact representatives, and addresses'"
        [submitText]="selectedParty() ? 'Save Changes' : 'Create Party'"
        [loading]="isSubmitting()"
        [submitDisabled]="partyForm.invalid"
        maxWidth="2xl"
        (formSubmit)="saveParty()"
        (cancel)="closeFormModal()"
      >
        <app-party-form
          [partyForm]="partyForm"
          [partyType]="partyType()"
          [initialData]="selectedParty()"
        ></app-party-form>
      </app-form-dialog>

      <!-- Delete Confirmation Modal -->
      <app-confirm-dialog
        [isOpen]="isDeleteModalOpen()"
        [title]="partyType() === 'CUSTOMER' ? 'Delete Customer?' : 'Delete Vendor?'"
        [message]="'Are you sure you want to permanently delete ' + (itemToDelete?.name || 'this party') + '?'"
        variant="danger"
        confirmText="Delete Party"
        [loading]="isSubmitting()"
        (confirm)="confirmDelete()"
        (cancel)="closeDeleteModal()"
      ></app-confirm-dialog>

    </div>
  `
})
export class PartiesComponent implements OnInit {
  readonly partiesService = inject(PartiesService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly activeTab = signal<PartyTab>('customers');
  readonly partyType = signal<PartyType>('CUSTOMER');
  
  readonly customers = signal<Party[]>([]);
  readonly vendors = signal<Party[]>([]);
  
  readonly isLoading = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);
  
  readonly isFormModalOpen = signal<boolean>(false);
  readonly isDeleteModalOpen = signal<boolean>(false);

  readonly selectedParty = signal<Party | null>(null);
  itemToDelete: Party | null = null;

  partyForm: FormGroup = this.createBaseForm();

  // Role-appropriate Customer Columns
  customerTableColumns: ColumnDef<Party>[] = [
    { key: 'code', header: 'Code', width: '110px' },
    { key: 'name', header: 'Customer Name', width: '220px' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone', width: '140px' },
    {
      key: 'creditLimit',
      header: 'Credit Limit',
      align: 'right',
      width: '140px',
      cell: (party) => `$${(party.creditLimit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    {
      key: 'active',
      header: 'Status',
      align: 'center',
      width: '100px',
      cell: (party) => party.active ? 'ACTIVE' : 'INACTIVE'
    }
  ];

  // Role-appropriate Vendor Columns
  vendorTableColumns: ColumnDef<Party>[] = [
    { key: 'code', header: 'Code', width: '110px' },
    { key: 'name', header: 'Vendor Name', width: '220px' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone', width: '140px' },
    {
      key: 'paymentTermsDays',
      header: 'Payment Terms',
      align: 'center',
      width: '140px',
      cell: (party) => party.paymentTermsDays ? `Net ${party.paymentTermsDays} Days` : 'Immediate'
    },
    {
      key: 'active',
      header: 'Status',
      align: 'center',
      width: '100px',
      cell: (party) => party.active ? 'ACTIVE' : 'INACTIVE'
    }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    this.partiesService.getCustomers().subscribe({
      next: (custs) => {
        this.customers.set(custs);

        this.partiesService.getVendors().subscribe({
          next: (vends) => {
            this.vendors.set(vends);
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false)
        });
      },
      error: () => this.isLoading.set(false)
    });
  }

  setTab(tab: PartyTab): void {
    this.activeTab.set(tab);
    this.partyType.set(tab === 'customers' ? 'CUSTOMER' : 'VENDOR');
  }

  createBaseForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      code: [''],
      email: [''],
      phone: [''],
      taxId: [''],
      active: [true],
      creditLimit: [50000],
      paymentTermsDays: [30],
      contacts: this.fb.array([]),
      addresses: this.fb.array([])
    });
  }

  openCreateModal(type: PartyType): void {
    this.partyType.set(type);
    this.selectedParty.set(null);
    this.partyForm = this.createBaseForm();
    this.isFormModalOpen.set(true);
  }

  openEditModal(party: Party, type: PartyType): void {
    this.partyType.set(type);
    this.selectedParty.set(party);
    this.partyForm = this.createBaseForm();
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    this.isFormModalOpen.set(false);
  }

  saveParty(): void {
    if (this.partyForm.invalid) return;

    this.isSubmitting.set(true);
    const formVal = this.partyForm.value;
    const req: PartyRequest = {
      name: formVal.name,
      code: formVal.code,
      email: formVal.email,
      phone: formVal.phone,
      taxId: formVal.taxId,
      active: formVal.active,
      creditLimit: Number(formVal.creditLimit) || 0,
      paymentTermsDays: Number(formVal.paymentTermsDays) || 0,
      roles: [this.partyType()],
      contacts: formVal.contacts || [],
      addresses: formVal.addresses || []
    };

    const type = this.partyType();
    const existing = this.selectedParty();

    if (type === 'CUSTOMER') {
      if (existing) {
        this.partiesService.updateCustomer(existing.id, req).subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closeFormModal();
            this.toast.success('Customer updated successfully', 'Success');
            this.loadData();
          },
          error: () => this.isSubmitting.set(false)
        });
      } else {
        this.partiesService.createCustomer(req).subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closeFormModal();
            this.toast.success('Customer account created successfully', 'Success');
            this.loadData();
          },
          error: () => this.isSubmitting.set(false)
        });
      }
    } else {
      if (existing) {
        this.partiesService.updateVendor(existing.id, req).subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closeFormModal();
            this.toast.success('Vendor supplier updated successfully', 'Success');
            this.loadData();
          },
          error: () => this.isSubmitting.set(false)
        });
      } else {
        this.partiesService.createVendor(req).subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closeFormModal();
            this.toast.success('Vendor supplier created successfully', 'Success');
            this.loadData();
          },
          error: () => this.isSubmitting.set(false)
        });
      }
    }
  }

  openDeleteModal(party: Party, type: PartyType): void {
    this.partyType.set(type);
    this.itemToDelete = party;
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
  }

  confirmDelete(): void {
    if (!this.itemToDelete) return;
    this.isSubmitting.set(true);

    const type = this.partyType();
    const id = this.itemToDelete.id;

    if (type === 'CUSTOMER') {
      this.partiesService.deleteCustomer(id).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeDeleteModal();
          this.toast.success('Customer deleted successfully', 'Success');
          this.loadData();
        },
        error: () => this.isSubmitting.set(false)
      });
    } else {
      this.partiesService.deleteVendor(id).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeDeleteModal();
          this.toast.success('Vendor deleted successfully', 'Success');
          this.loadData();
        },
        error: () => this.isSubmitting.set(false)
      });
    }
  }
}
