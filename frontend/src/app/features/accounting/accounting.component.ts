import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdkTreeModule, NestedTreeControl } from '@angular/cdk/tree';
import { AccountingService, AccountNode, JournalEntry, JournalEntryLineItem, AccountType, JournalEntryStatus } from './accounting.service';
import { ToastService } from '../../core/services/toast.service';
import { DataTableComponent, ColumnDef } from '../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { CurrencyDisplayComponent } from '../../shared/components/currency-display/currency-display.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { FormDialogComponent } from '../../shared/components/form-dialog/form-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

export type AccountingTab = 'coa' | 'journal';

@Component({
  selector: 'app-accounting',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CdkTreeModule,
    DataTableComponent,
    StatusBadgeComponent,
    CurrencyDisplayComponent,
    ButtonComponent,
    FormDialogComponent,
    ConfirmDialogComponent
  ],
  template: `
    <div class="space-y-6">
      
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Chart of Accounts & General Ledger
          </h1>
          <p class="text-xs sm:text-sm text-stone-500 dark:text-espresso-400 mt-1">
            Hierarchical chart of accounts ledger and double-entry manual journal entry posting.
          </p>
        </div>

        <div class="flex items-center space-x-3">
          @if (activeTab() === 'coa') {
            <app-button variant="brass" size="sm" (click)="openCreateAccountModal()">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Add Account
            </app-button>
          } @else {
            <app-button variant="brass" size="sm" (click)="openCreateEntryModal()">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              New Journal Entry
            </app-button>
          }
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="border-b border-stone-200 dark:border-espresso-800">
        <nav class="flex space-x-8" aria-label="Accounting Workflow Tabs">
          
          <button
            (click)="setTab('coa')"
            [class.border-brass-500]="activeTab() === 'coa'"
            [class.text-brass-600]="activeTab() === 'coa'"
            [class.dark:text-brass-400]="activeTab() === 'coa'"
            [class.border-transparent]="activeTab() !== 'coa'"
            [class.text-stone-500]="activeTab() !== 'coa'"
            class="py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-150 flex items-center space-x-2 focus:outline-none"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            <span>Chart of Accounts Hierarchy</span>
          </button>

          <button
            (click)="setTab('journal')"
            [class.border-brass-500]="activeTab() === 'journal'"
            [class.text-brass-600]="activeTab() === 'journal'"
            [class.dark:text-brass-400]="activeTab() === 'journal'"
            [class.border-transparent]="activeTab() !== 'journal'"
            [class.text-stone-500]="activeTab() !== 'journal'"
            class="py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-150 flex items-center space-x-2 focus:outline-none"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span>General Journal Entries ({{ entries().length }})</span>
          </button>

        </nav>
      </div>

      <!-- TAB 1: Chart of Accounts CDK Tree View -->
      @if (activeTab() === 'coa') {
        <div class="p-6 rounded-2xl bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-800 shadow-sm space-y-4 animate-fade-in">
          
          <div class="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-espresso-800">
            <h3 class="text-sm font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              Account Structure & Hierarchy
            </h3>
            <div class="flex items-center space-x-2 text-xs">
              <app-button variant="outline" size="sm" (click)="expandAllTreeNodes()">Expand All</app-button>
              <app-button variant="outline" size="sm" (click)="collapseAllTreeNodes()">Collapse All</app-button>
            </div>
          </div>

          <!-- CDK Tree Component -->
          <cdk-tree [dataSource]="accountsTree()" [treeControl]="treeControl" class="block w-full">
            
            <!-- Leaf Node (No Children) -->
            <cdk-nested-tree-node *cdkTreeNodeDef="let node" class="block py-1.5 px-2 hover:bg-stone-50 dark:hover:bg-espresso-950/60 rounded-lg transition-colors">
              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center space-x-3 pl-8">
                  <span class="font-mono font-bold text-brass-600 dark:text-brass-400 w-16 shrink-0">{{ node.code }}</span>
                  <span class="font-medium text-stone-900 dark:text-stone-100">{{ node.name }}</span>
                  
                  <!-- Account Type Tag (Subtle Badge - Not a StatusBadge) -->
                  <span [class]="getAccountTypeTagClasses(node.type)">
                    {{ node.type }}
                  </span>
                </div>

                <div class="flex items-center space-x-4 font-mono">
                  <app-currency-display [amount]="node.balance" size="sm"></app-currency-display>
                  <button (click)="openCreateAccountModal(node.id)" class="text-stone-400 hover:text-brass-500 transition-colors p-1" title="Add Sub-Account">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                  </button>
                </div>
              </div>
            </cdk-nested-tree-node>

            <!-- Parent Node (With Children) -->
            <cdk-nested-tree-node *cdkTreeNodeDef="let node; when: hasChild" class="block py-1.5 px-2 hover:bg-stone-50 dark:hover:bg-espresso-950/60 rounded-lg transition-colors">
              <div class="flex items-center justify-between text-xs">
                <div class="flex items-center space-x-2">
                  <button cdkTreeNodeToggle [attr.aria-label]="'Toggle ' + node.name" class="p-1 text-stone-500 hover:text-brass-500 focus:outline-none transition-transform duration-150">
                    <svg
                      class="w-4 h-4 transition-transform duration-200"
                      [class.rotate-90]="treeControl.isExpanded(node)"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>

                  <span class="font-mono font-bold text-stone-900 dark:text-stone-100 w-16 shrink-0">{{ node.code }}</span>
                  <span class="font-semibold text-stone-900 dark:text-stone-100">{{ node.name }}</span>

                  <!-- Account Type Tag -->
                  <span [class]="getAccountTypeTagClasses(node.type)">
                    {{ node.type }}
                  </span>
                </div>

                <div class="flex items-center space-x-4 font-mono">
                  <app-currency-display [amount]="node.balance" size="sm"></app-currency-display>
                  <button (click)="openCreateAccountModal(node.id)" class="text-stone-400 hover:text-brass-500 transition-colors p-1" title="Add Sub-Account">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Nested Outlet for Child Accounts -->
              <div [class.hidden]="!treeControl.isExpanded(node)" class="pl-6 border-l border-stone-200 dark:border-espresso-800/80 ml-3 mt-1 space-y-1">
                <ng-container cdkTreeNodeOutlet></ng-container>
              </div>
            </cdk-nested-tree-node>

          </cdk-tree>
        </div>
      }

      <!-- TAB 2: General Journal Entries DataTable & Detail View -->
      @if (activeTab() === 'journal') {
        <div class="space-y-4 animate-fade-in">
          <app-data-table
            [data]="entries()"
            [columns]="journalTableColumns"
            [loading]="isLoading()"
            (rowClick)="openEntryDetail($event)"
            emptyTitle="No journal entries recorded"
            emptyMessage="No manual general ledger journal entries posted yet."
          ></app-data-table>
        </div>
      }

      <!-- Account Form Modal -->
      <app-form-dialog
        [isOpen]="isAccountModalOpen()"
        title="Add Account to Chart of Accounts"
        subtitle="Define new ledger account code, name, and hierarchy node"
        submitText="Save Account"
        [loading]="isSubmitting()"
        [submitDisabled]="accountForm.invalid"
        maxWidth="md"
        (formSubmit)="saveAccount()"
        (cancel)="closeAccountModal()"
      >
        <form [formGroup]="accountForm" class="space-y-4 text-xs">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
                Account Code <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                formControlName="code"
                placeholder="e.g. 1150"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              />
            </div>

            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
                Account Type <span class="text-rose-500">*</span>
              </label>
              <select
                formControlName="type"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              >
                <option value="ASSET">ASSET</option>
                <option value="LIABILITY">LIABILITY</option>
                <option value="EQUITY">EQUITY</option>
                <option value="REVENUE">REVENUE</option>
                <option value="EXPENSE">EXPENSE</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
              Account Name <span class="text-rose-500">*</span>
            </label>
            <input
              type="text"
              formControlName="name"
              placeholder="e.g. Short Term Investments"
              class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
            />
          </div>

          <div>
            <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
              Parent Account
            </label>
            <select
              formControlName="parentId"
              class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
            >
              <option [value]="null">-- None (Root Node) --</option>
              @for (acc of flatAccounts(); track acc.id) {
                <option [value]="acc.id">{{ acc.code }} - {{ acc.name }}</option>
              }
            </select>
          </div>
        </form>
      </app-form-dialog>

      <!-- Journal Entry Creation Form Modal with Live Debit-XOR-Credit & Zero-Balance Validation -->
      <app-form-dialog
        [isOpen]="isEntryModalOpen()"
        title="Create General Journal Entry"
        subtitle="Post balanced double-entry manual journal items into the general ledger"
        [submitText]="'Post Journal Entry'"
        [loading]="isSubmitting()"
        [submitDisabled]="!isJournalEntryValid"
        maxWidth="2xl"
        (formSubmit)="saveJournalEntry()"
        (cancel)="closeEntryModal()"
      >
        <form [formGroup]="journalForm" class="space-y-5 text-xs">
          
          <!-- Date & Reference Controls -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
                Posting Date <span class="text-rose-500">*</span>
              </label>
              <input
                type="date"
                formControlName="entryDate"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400 font-mono"
              />
            </div>

            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
                Reference / Memo
              </label>
              <input
                type="text"
                formControlName="reference"
                placeholder="e.g. End of Month Accrual Entry"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              />
            </div>
          </div>

          <!-- Live Running Balance Summary Bar -->
          <div
            class="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-150"
            [ngClass]="{
              'bg-emerald-500/10 border-emerald-500/30': isBalanceZero,
              'bg-amber-500/10 border-amber-500/30': !isBalanceZero
            }"
          >
            <div class="flex items-center space-x-3">
              @if (isBalanceZero) {
                <div class="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <span class="font-bold text-emerald-700 dark:text-emerald-400">Entry Balanced</span>
                  <p class="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">Sum debits equals sum credits. Ready for ledger posting.</p>
                </div>
              } @else {
                <div class="w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
                <div>
                  <span class="font-bold text-amber-700 dark:text-amber-400">Out of Balance</span>
                  <p class="text-[11px] text-amber-600/80 dark:text-amber-400/80">Debits and credits must balance before entry can be posted.</p>
                </div>
              }
            </div>

            <!-- Mono Live Running Totals -->
            <div class="flex items-center space-x-6 text-right font-mono text-xs">
              <div>
                <span class="block text-[10px] text-stone-500 uppercase font-sans">Total Debits</span>
                <app-currency-display [amount]="totalDebits" size="sm"></app-currency-display>
              </div>
              <div>
                <span class="block text-[10px] text-stone-500 uppercase font-sans">Total Credits</span>
                <app-currency-display [amount]="totalCredits" size="sm"></app-currency-display>
              </div>
              <div>
                <span class="block text-[10px] text-stone-500 uppercase font-sans">Difference</span>
                <app-currency-display [amount]="absOutOfBalanceDiff" size="sm" [forceColor]="isBalanceZero ? 'success' : 'danger'"></app-currency-display>
              </div>
            </div>
          </div>

          <!-- Journal Lines Repeating Rows Editor (FormArray) -->
          <div class="space-y-3 pt-1">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-espresso-400">
                Journal Entry Lines
              </h4>
              <app-button variant="outline" size="sm" (click)="addJournalLine()">
                <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Add Line Row
              </app-button>
            </div>

            <div class="rounded-xl border border-stone-200 dark:border-espresso-800 overflow-hidden">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-stone-50 dark:bg-espresso-950 text-[11px] font-semibold uppercase text-stone-500 border-b border-stone-200 dark:border-espresso-800">
                    <th class="py-2 px-3">Account <span class="text-rose-500">*</span></th>
                    <th class="py-2 px-3">Description / Memo</th>
                    <th class="py-2 px-3 text-right w-32">Debit ($)</th>
                    <th class="py-2 px-3 text-right w-32">Credit ($)</th>
                    <th class="py-2 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody formArrayName="lines" class="divide-y divide-stone-200 dark:divide-espresso-800/60 font-mono">
                  @for (line of lineControls; track $index) {
                    <tr [formGroupName]="$index" class="hover:bg-stone-50/50 dark:hover:bg-espresso-950/40">
                      
                      <!-- Account Picker -->
                      <td class="py-2 px-3 font-sans">
                        <select
                          formControlName="accountId"
                          class="w-full bg-transparent border-0 border-b border-stone-200 dark:border-espresso-700 py-1 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-brass-400"
                        >
                          <option value="">-- Select Account --</option>
                          @for (acc of flatAccounts(); track acc.id) {
                            <option [value]="acc.id">{{ acc.code }} - {{ acc.name }}</option>
                          }
                        </select>
                      </td>

                      <!-- Line Memo -->
                      <td class="py-2 px-3 font-sans">
                        <input
                          type="text"
                          formControlName="memo"
                          placeholder="Line memo..."
                          class="w-full bg-transparent border-0 border-b border-stone-200 dark:border-espresso-700 py-1 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-brass-400"
                        />
                      </td>

                      <!-- Debit (Enforces Debit-XOR-Credit rule: on Debit change, Credit resets to 0) -->
                      <td class="py-2 px-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          formControlName="debit"
                          (input)="onDebitInput($index)"
                          class="w-full bg-transparent border-0 border-b border-stone-200 dark:border-espresso-700 py-1 text-xs text-right font-mono font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:border-brass-400"
                        />
                      </td>

                      <!-- Credit (Enforces Debit-XOR-Credit rule: on Credit change, Debit resets to 0) -->
                      <td class="py-2 px-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          formControlName="credit"
                          (input)="onCreditInput($index)"
                          class="w-full bg-transparent border-0 border-b border-stone-200 dark:border-espresso-700 py-1 text-xs text-right font-mono font-bold text-stone-900 dark:text-stone-100 focus:outline-none focus:border-brass-400"
                        />
                      </td>

                      <!-- Remove Line Row -->
                      <td class="py-2 px-2 text-center">
                        @if (lineControls.length > 2) {
                          <button
                            type="button"
                            (click)="removeJournalLine($index)"
                            class="text-stone-400 hover:text-rose-500 transition-colors p-1"
                            title="Remove Line"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          </button>
                        }
                      </td>

                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

        </form>
      </app-form-dialog>

      <!-- Detail View Modal for Journal Entry (View/Post/Void flow) -->
      <app-form-dialog
        [isOpen]="isDetailModalOpen()"
        [title]="detailTitle"
        subtitle="General ledger journal entry details and posting status"
        submitText="Close View"
        [submitDisabled]="false"
        maxWidth="2xl"
        (formSubmit)="closeDetailModal()"
        (cancel)="closeDetailModal()"
      >
        @if (activeDetailEntry) {
          <div class="space-y-6 text-xs">
            
            <!-- Status Toolbar with Post / Void Actions -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-800">
              <div class="flex items-center space-x-3">
                <span class="font-medium text-stone-500">Posting Status:</span>
                <app-status-badge [status]="activeDetailEntry.status"></app-status-badge>
              </div>

              <div class="flex items-center space-x-2">
                @if (activeDetailEntry.status === 'DRAFT') {
                  <app-button variant="brass" size="sm" (click)="postEntry(activeDetailEntry.id)">Post to General Ledger</app-button>
                  <app-button variant="outline" size="sm" (click)="voidEntry(activeDetailEntry.id)">Void Entry</app-button>
                }
                @if (activeDetailEntry.status === 'POSTED') {
                  <app-button variant="outline" size="sm" (click)="voidEntry(activeDetailEntry.id)">Void Posted Entry</app-button>
                }
              </div>
            </div>

            <!-- Entry Details Summary -->
            <div class="grid grid-cols-2 gap-4 text-stone-700 dark:text-stone-300">
              <div>
                <span class="block font-semibold text-stone-500 text-[11px] uppercase">Reference / Description</span>
                <p class="font-bold text-sm text-stone-900 dark:text-stone-100 mt-0.5">{{ activeDetailEntry.reference || 'N/A' }}</p>
              </div>
              <div>
                <span class="block font-semibold text-stone-500 text-[11px] uppercase">Posting Date</span>
                <p class="font-mono text-xs mt-0.5">{{ activeDetailEntry.entryDate }}</p>
              </div>
            </div>

            <!-- Journal Lines Table -->
            <div class="rounded-xl border border-stone-200 dark:border-espresso-800 overflow-hidden">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-stone-50 dark:bg-espresso-950 text-[11px] font-semibold uppercase text-stone-500">
                    <th class="py-2.5 px-3">Account Code & Name</th>
                    <th class="py-2.5 px-3">Memo</th>
                    <th class="py-2.5 px-3 text-right">Debit</th>
                    <th class="py-2.5 px-3 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-stone-200 dark:divide-espresso-800/60 font-mono">
                  @for (line of activeDetailEntry.lines; track line.accountId) {
                    <tr>
                      <td class="py-2.5 px-3 font-sans font-medium text-stone-900 dark:text-stone-100">
                        <span class="font-mono text-brass-600 dark:text-brass-400 font-bold mr-2">{{ line.accountCode }}</span>
                        {{ line.accountName }}
                      </td>
                      <td class="py-2.5 px-3 text-stone-500 font-sans">{{ line.memo || '-' }}</td>
                      <td class="py-2.5 px-3 text-right font-bold">
                        @if (line.debit > 0) {
                          <app-currency-display [amount]="line.debit" size="xs"></app-currency-display>
                        } @else {
                          <span class="text-stone-400">-</span>
                        }
                      </td>
                      <td class="py-2.5 px-3 text-right font-bold">
                        @if (line.credit > 0) {
                          <app-currency-display [amount]="line.credit" size="xs"></app-currency-display>
                        } @else {
                          <span class="text-stone-400">-</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

          </div>
        }
      </app-form-dialog>

    </div>
  `
})
export class AccountingComponent implements OnInit {
  readonly accountingService = inject(AccountingService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly activeTab = signal<AccountingTab>('coa');
  readonly accountsTree = signal<AccountNode[]>([]);
  readonly flatAccounts = signal<AccountNode[]>([]);
  readonly entries = signal<JournalEntry[]>([]);

  readonly isLoading = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);

  // CDK Tree Control
  treeControl = new NestedTreeControl<AccountNode>(node => node.children);
  hasChild = (_: number, node: AccountNode) => !!node.children && node.children.length > 0;

  // Modals
  readonly isAccountModalOpen = signal<boolean>(false);
  readonly isEntryModalOpen = signal<boolean>(false);
  readonly isDetailModalOpen = signal<boolean>(false);

  activeDetailEntry: JournalEntry | null = null;

  accountForm: FormGroup = this.fb.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    type: ['ASSET', Validators.required],
    parentId: [null]
  });

  journalForm: FormGroup = this.createJournalForm();

  // Table Columns
  journalTableColumns: ColumnDef<JournalEntry>[] = [
    { key: 'entryNumber', header: 'Entry #', width: '140px' },
    { key: 'entryDate', header: 'Date', width: '120px' },
    { key: 'reference', header: 'Reference / Description' },
    {
      key: 'totalDebit',
      header: 'Total Amount',
      align: 'right',
      width: '140px',
      cell: (je) => `$${je.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      width: '120px',
      cell: (je) => je.status
    }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    this.accountingService.getAccountsTree().subscribe(tree => {
      this.accountsTree.set(tree);
      this.flatAccounts.set(this.accountingService.getFlatAccounts());
      this.expandAllTreeNodes();
    });

    this.accountingService.getJournalEntries().subscribe(e => {
      this.entries.set(e);
      this.isLoading.set(false);
    });
  }

  setTab(tab: AccountingTab): void {
    this.activeTab.set(tab);
  }

  expandAllTreeNodes(): void {
    this.treeControl.dataNodes = this.accountsTree();
    this.treeControl.expandAll();
  }

  collapseAllTreeNodes(): void {
    this.treeControl.collapseAll();
  }

  getAccountTypeTagClasses(type: AccountType): string {
    const base = 'px-2 py-0.5 text-[10px] font-bold rounded-md tracking-wider uppercase inline-block';
    switch (type) {
      case 'ASSET': return `${base} bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20`;
      case 'LIABILITY': return `${base} bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20`;
      case 'EQUITY': return `${base} bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20`;
      case 'REVENUE': return `${base} bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20`;
      case 'EXPENSE': return `${base} bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20`;
    }
  }

  // Account Modal
  openCreateAccountModal(parentId?: string): void {
    this.accountForm.reset({
      code: '',
      name: '',
      type: 'ASSET',
      parentId: parentId || null
    });
    this.isAccountModalOpen.set(true);
  }

  closeAccountModal(): void {
    this.isAccountModalOpen.set(false);
  }

  saveAccount(): void {
    if (this.accountForm.invalid) return;

    this.isSubmitting.set(true);
    this.accountingService.createAccount(this.accountForm.value).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeAccountModal();
        this.toast.success('Ledger account created successfully', 'Account Created');
        this.loadData();
      },
      error: () => this.isSubmitting.set(false)
    });
  }

  // Journal Entry Form Setup
  createJournalForm(): FormGroup {
    return this.fb.group({
      entryDate: [new Date().toISOString().split('T')[0], Validators.required],
      reference: [''],
      lines: this.fb.array([
        this.createLineGroup(),
        this.createLineGroup()
      ])
    });
  }

  createLineGroup(): FormGroup {
    return this.fb.group({
      accountId: ['', Validators.required],
      memo: [''],
      debit: [0, [Validators.required, Validators.min(0)]],
      credit: [0, [Validators.required, Validators.min(0)]]
    });
  }

  get linesArray(): FormArray {
    return this.journalForm.get('lines') as FormArray;
  }

  get lineControls(): FormGroup[] {
    return this.linesArray.controls as FormGroup[];
  }

  addJournalLine(): void {
    this.linesArray.push(this.createLineGroup());
  }

  removeJournalLine(index: number): void {
    if (this.linesArray.length > 2) {
      this.linesArray.removeAt(index);
    }
  }

  // Enforces Debit-XOR-Credit rule: inputting Debit resets Credit for that row to 0
  onDebitInput(index: number): void {
    const row = this.lineControls[index];
    const val = Number(row.get('debit')?.value || 0);
    if (val > 0) {
      row.get('credit')?.setValue(0, { emitEvent: false });
    }
  }

  // Enforces Debit-XOR-Credit rule: inputting Credit resets Debit for that row to 0
  onCreditInput(index: number): void {
    const row = this.lineControls[index];
    const val = Number(row.get('credit')?.value || 0);
    if (val > 0) {
      row.get('debit')?.setValue(0, { emitEvent: false });
    }
  }

  // Live Running Balance Computations
  get totalDebits(): number {
    return this.lineControls.reduce((sum, row) => sum + Number(row.get('debit')?.value || 0), 0);
  }

  get totalCredits(): number {
    return this.lineControls.reduce((sum, row) => sum + Number(row.get('credit')?.value || 0), 0);
  }

  get outOfBalanceDiff(): number {
    return Math.round((this.totalDebits - this.totalCredits) * 100) / 100;
  }

  get absOutOfBalanceDiff(): number {
    return Math.abs(this.outOfBalanceDiff);
  }

  get isBalanceZero(): boolean {
    return Math.abs(this.outOfBalanceDiff) < 0.001;
  }

  get isJournalEntryValid(): boolean {
    if (this.journalForm.invalid) return false;
    if (this.totalDebits <= 0) return false;
    return this.isBalanceZero;
  }

  openCreateEntryModal(): void {
    this.journalForm = this.createJournalForm();
    this.isEntryModalOpen.set(true);
  }

  closeEntryModal(): void {
    this.isEntryModalOpen.set(false);
  }

  saveJournalEntry(): void {
    if (!this.isJournalEntryValid) return;

    this.isSubmitting.set(true);
    const formVal = this.journalForm.value;
    const flatAccs = this.flatAccounts();

    const preparedLines: JournalEntryLineItem[] = formVal.lines
      .filter((l: any) => l.debit > 0 || l.credit > 0)
      .map((l: any) => {
        const acc = flatAccs.find(a => a.id === l.accountId);
        return {
          accountId: l.accountId,
          accountCode: acc?.code,
          accountName: acc?.name,
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0),
          memo: l.memo
        };
      });

    const entryReq: Partial<JournalEntry> = {
      entryDate: formVal.entryDate,
      reference: formVal.reference,
      totalDebit: this.totalDebits,
      totalCredit: this.totalCredits,
      lines: preparedLines
    };

    this.accountingService.createJournalEntry(entryReq).subscribe({
      next: (created) => {
        this.accountingService.postJournalEntry(created.id).subscribe(() => {
          this.isSubmitting.set(false);
          this.closeEntryModal();
          this.toast.success('Journal entry posted into general ledger', 'Entry Posted');
          this.loadData();
        });
      },
      error: () => this.isSubmitting.set(false)
    });
  }

  // Detail View & Actions
  openEntryDetail(entry: JournalEntry): void {
    this.activeDetailEntry = entry;
    this.isDetailModalOpen.set(true);
  }

  closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.activeDetailEntry = null;
  }

  get detailTitle(): string {
    if (!this.activeDetailEntry) return 'Journal Entry Detail';
    return `${this.activeDetailEntry.entryNumber} Overview`;
  }

  postEntry(id: string): void {
    this.accountingService.postJournalEntry(id).subscribe(() => {
      this.toast.success('Journal entry posted to General Ledger', 'Entry Posted');
      this.closeDetailModal();
      this.loadData();
    });
  }

  voidEntry(id: string): void {
    this.accountingService.voidJournalEntry(id).subscribe(() => {
      this.toast.success('Journal entry voided', 'Entry Voided');
      this.closeDetailModal();
      this.loadData();
    });
  }
}
