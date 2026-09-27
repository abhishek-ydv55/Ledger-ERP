import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Party, PartyType } from './parties.service';

@Component({
  selector: 'app-party-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div [formGroup]="partyForm" class="space-y-6 text-xs">
      
      <!-- Basic Information Section -->
      <div class="space-y-4">
        <h4 class="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-espresso-400 border-b border-stone-200 dark:border-espresso-800 pb-2">
          Basic {{ partyType === 'CUSTOMER' ? 'Customer' : 'Vendor' }} Details
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Company / Party Name -->
          <div class="sm:col-span-2">
            <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
              Legal / Trading Name <span class="text-rose-500">*</span>
            </label>
            <input
              type="text"
              formControlName="name"
              placeholder="e.g. Acme Global Logistics Ltd"
              class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
            />
          </div>

          <!-- Code -->
          <div>
            <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
              {{ partyType === 'CUSTOMER' ? 'Customer Code' : 'Vendor Code' }}
            </label>
            <input
              type="text"
              formControlName="code"
              placeholder="Auto-generated if empty"
              class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brass-400"
            />
          </div>

          <!-- Tax ID -->
          <div>
            <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
              Tax / VAT ID
            </label>
            <input
              type="text"
              formControlName="taxId"
              placeholder="e.g. US-987654321"
              class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:ring-2 focus:ring-brass-400"
            />
          </div>

          <!-- Email -->
          <div>
            <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
              Primary Email
            </label>
            <input
              type="email"
              formControlName="email"
              placeholder="billing@company.com"
              class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
            />
          </div>

          <!-- Phone -->
          <div>
            <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
              Primary Phone
            </label>
            <input
              type="text"
              formControlName="phone"
              placeholder="+1 (555) 000-0000"
              class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
            />
          </div>

          <!-- Role-Appropriate Field (Credit Limit vs Payment Terms) -->
          @if (partyType === 'CUSTOMER') {
            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
                Credit Limit ($)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                formControlName="creditLimit"
                placeholder="50000"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:ring-2 focus:ring-brass-400"
              />
            </div>
          } @else {
            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
                Payment Terms (Days)
              </label>
              <select
                formControlName="paymentTermsDays"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400 font-mono"
              >
                <option [value]="0">Immediate / Cash on Delivery</option>
                <option [value]="15">Net 15 Days</option>
                <option [value]="30">Net 30 Days</option>
                <option [value]="45">Net 45 Days</option>
                <option [value]="60">Net 60 Days</option>
                <option [value]="90">Net 90 Days</option>
              </select>
            </div>
          }

          <!-- Active status toggle -->
          <div class="flex items-center space-x-2 pt-5">
            <input
              type="checkbox"
              id="activeCheckbox"
              formControlName="active"
              class="w-4 h-4 rounded text-brass-500 bg-stone-50 dark:bg-espresso-950 border-stone-300 dark:border-espresso-700 focus:ring-brass-400 accent-brass-500"
            />
            <label for="activeCheckbox" class="font-medium text-stone-700 dark:text-stone-300 cursor-pointer">
              Active Party Account
            </label>
          </div>
        </div>
      </div>

      <!-- Nested FormArray 1: Contacts Section -->
      <div class="space-y-3">
        <div class="flex items-center justify-between border-b border-stone-200 dark:border-espresso-800 pb-2">
          <h4 class="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-espresso-400">
            Contact Persons ({{ contactsFormArray.length }})
          </h4>
          
          <button
            (click)="addContactRow()"
            type="button"
            class="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-stone-100 dark:bg-espresso-800 hover:bg-brass-500/10 text-brass-600 dark:text-brass-400 text-xs font-semibold transition-colors"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span>Add Contact</span>
          </button>
        </div>

        <div formArrayName="contacts" class="space-y-3">
          @for (contact of contactsFormArray.controls; track contact; let idx = $index) {
            <div
              [formGroupName]="idx"
              class="p-3 bg-stone-50 dark:bg-espresso-950 rounded-xl border border-stone-200 dark:border-espresso-800 relative space-y-3 animate-fade-in"
            >
              <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label class="block text-[10px] uppercase font-medium text-stone-500 mb-1">Contact Name *</label>
                  <input
                    type="text"
                    formControlName="name"
                    placeholder="John Doe"
                    class="w-full bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-700 rounded-md px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brass-400"
                  />
                </div>

                <div>
                  <label class="block text-[10px] uppercase font-medium text-stone-500 mb-1">Email</label>
                  <input
                    type="email"
                    formControlName="email"
                    placeholder="john@company.com"
                    class="w-full bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-700 rounded-md px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brass-400"
                  />
                </div>

                <div>
                  <label class="block text-[10px] uppercase font-medium text-stone-500 mb-1">Phone</label>
                  <input
                    type="text"
                    formControlName="phone"
                    placeholder="+1 (555) 000-0000"
                    class="w-full bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-700 rounded-md px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brass-400"
                  />
                </div>

                <div>
                  <label class="block text-[10px] uppercase font-medium text-stone-500 mb-1">Designation / Role</label>
                  <input
                    type="text"
                    formControlName="designation"
                    placeholder="Account Manager"
                    class="w-full bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-700 rounded-md px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brass-400"
                  />
                </div>
              </div>

              <div class="flex items-center justify-between pt-1 border-t border-stone-200/60 dark:border-espresso-800/60">
                <label class="flex items-center space-x-1.5 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    formControlName="isPrimary"
                    class="w-3.5 h-3.5 rounded text-brass-500 focus:ring-brass-400 accent-brass-500"
                  />
                  <span class="text-stone-600 dark:text-espresso-300 font-medium text-[11px]">Primary Representative</span>
                </label>

                <button
                  (click)="removeContactRow(idx)"
                  type="button"
                  class="p-1 rounded text-stone-400 hover:text-rose-500 transition-colors"
                  title="Remove contact"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Nested FormArray 2: Addresses Section -->
      <div class="space-y-3">
        <div class="flex items-center justify-between border-b border-stone-200 dark:border-espresso-800 pb-2">
          <h4 class="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-espresso-400">
            Addresses ({{ addressesFormArray.length }})
          </h4>
          
          <button
            (click)="addAddressRow()"
            type="button"
            class="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-stone-100 dark:bg-espresso-800 hover:bg-brass-500/10 text-brass-600 dark:text-brass-400 text-xs font-semibold transition-colors"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span>Add Address</span>
          </button>
        </div>

        <div formArrayName="addresses" class="space-y-3">
          @for (address of addressesFormArray.controls; track address; let idx = $index) {
            <div
              [formGroupName]="idx"
              class="p-3 bg-stone-50 dark:bg-espresso-950 rounded-xl border border-stone-200 dark:border-espresso-800 relative space-y-3 animate-fade-in"
            >
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-[10px] uppercase font-medium text-stone-500 mb-1">Address Type *</label>
                  <select
                    formControlName="addressType"
                    class="w-full bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-700 rounded-md px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brass-400 font-mono"
                  >
                    <option value="BILLING">Billing Address</option>
                    <option value="SHIPPING">Shipping Address</option>
                    <option value="BRANCH">Branch Office</option>
                    <option value="REGISTERED">Registered HQ</option>
                  </select>
                </div>

                <div class="sm:col-span-2">
                  <label class="block text-[10px] uppercase font-medium text-stone-500 mb-1">Street Address Line 1 *</label>
                  <input
                    type="text"
                    formControlName="addressLine1"
                    placeholder="100 Industrial Parkway"
                    class="w-full bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-700 rounded-md px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brass-400"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label class="block text-[10px] uppercase font-medium text-stone-500 mb-1">City</label>
                  <input
                    type="text"
                    formControlName="city"
                    placeholder="Chicago"
                    class="w-full bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-700 rounded-md px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brass-400"
                  />
                </div>

                <div>
                  <label class="block text-[10px] uppercase font-medium text-stone-500 mb-1">State / Province</label>
                  <input
                    type="text"
                    formControlName="state"
                    placeholder="IL"
                    class="w-full bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-700 rounded-md px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brass-400"
                  />
                </div>

                <div>
                  <label class="block text-[10px] uppercase font-medium text-stone-500 mb-1">Postal Code</label>
                  <input
                    type="text"
                    formControlName="postalCode"
                    placeholder="60601"
                    class="w-full bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-700 rounded-md px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100 font-mono focus:outline-none focus:ring-1 focus:ring-brass-400"
                  />
                </div>

                <div>
                  <label class="block text-[10px] uppercase font-medium text-stone-500 mb-1">Country</label>
                  <input
                    type="text"
                    formControlName="country"
                    placeholder="USA"
                    class="w-full bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-700 rounded-md px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-brass-400"
                  />
                </div>
              </div>

              <div class="flex items-center justify-between pt-1 border-t border-stone-200/60 dark:border-espresso-800/60">
                <label class="flex items-center space-x-1.5 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    formControlName="isPrimary"
                    class="w-3.5 h-3.5 rounded text-brass-500 focus:ring-brass-400 accent-brass-500"
                  />
                  <span class="text-stone-600 dark:text-espresso-300 font-medium text-[11px]">Primary Address Location</span>
                </label>

                <button
                  (click)="removeAddressRow(idx)"
                  type="button"
                  class="p-1 rounded text-stone-400 hover:text-rose-500 transition-colors"
                  title="Remove address"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
          }
        </div>
      </div>

    </div>
  `
})
export class PartyFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  @Input() partyForm!: FormGroup;
  @Input() partyType: PartyType = 'CUSTOMER';
  @Input() initialData?: Party | null;

  get contactsFormArray(): FormArray {
    return this.partyForm.get('contacts') as FormArray;
  }

  get addressesFormArray(): FormArray {
    return this.partyForm.get('addresses') as FormArray;
  }

  ngOnInit(): void {
    if (!this.contactsFormArray) {
      this.partyForm.addControl('contacts', this.fb.array([]));
    }
    if (!this.addressesFormArray) {
      this.partyForm.addControl('addresses', this.fb.array([]));
    }

    if (this.initialData) {
      this.populateForm(this.initialData);
    }
  }

  createContactGroup(contact?: any): FormGroup {
    return this.fb.group({
      name: [contact?.name || '', Validators.required],
      email: [contact?.email || ''],
      phone: [contact?.phone || ''],
      designation: [contact?.designation || ''],
      isPrimary: [contact?.isPrimary ?? false]
    });
  }

  createAddressGroup(address?: any): FormGroup {
    return this.fb.group({
      addressType: [address?.addressType || 'BILLING', Validators.required],
      addressLine1: [address?.addressLine1 || '', Validators.required],
      addressLine2: [address?.addressLine2 || ''],
      city: [address?.city || ''],
      state: [address?.state || ''],
      postalCode: [address?.postalCode || ''],
      country: [address?.country || 'USA'],
      isPrimary: [address?.isPrimary ?? false]
    });
  }

  addContactRow(): void {
    this.contactsFormArray.push(this.createContactGroup());
  }

  removeContactRow(index: number): void {
    this.contactsFormArray.removeAt(index);
  }

  addAddressRow(): void {
    this.addressesFormArray.push(this.createAddressGroup());
  }

  removeAddressRow(index: number): void {
    this.addressesFormArray.removeAt(index);
  }

  private populateForm(data: Party): void {
    this.partyForm.patchValue({
      name: data.name,
      code: data.code || '',
      email: data.email || '',
      phone: data.phone || '',
      taxId: data.taxId || '',
      active: data.active,
      creditLimit: data.creditLimit || 50000,
      paymentTermsDays: data.paymentTermsDays || 30
    });

    this.contactsFormArray.clear();
    if (data.contacts && data.contacts.length > 0) {
      data.contacts.forEach(c => this.contactsFormArray.push(this.createContactGroup(c)));
    }

    this.addressesFormArray.clear();
    if (data.addresses && data.addresses.length > 0) {
      data.addresses.forEach(a => this.addressesFormArray.push(this.createAddressGroup(a)));
    }
  }
}
