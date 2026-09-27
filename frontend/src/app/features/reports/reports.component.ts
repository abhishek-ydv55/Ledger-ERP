import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsService, ProfitAndLossReport, BalanceSheetReport, AgedReport, AgedReportItem } from './reports.service';
import { CurrencyDisplayComponent } from '../../shared/components/currency-display/currency-display.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

export type ReportTab = 'pnl' | 'balance_sheet' | 'aged_ar' | 'aged_ap';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyDisplayComponent,
    StatusBadgeComponent,
    ButtonComponent
  ],
  template: `
    <div class="space-y-6 sm:space-y-8">
      
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Financial Statements & Reporting
          </h1>
          <p class="text-xs sm:text-sm text-stone-500 dark:text-espresso-400 mt-1">
            Executive financial position, P&L income statements, and aged accounts ledger.
          </p>
        </div>

        <div class="flex items-center space-x-2">
          <app-button variant="outline" size="sm" (click)="loadReports()">
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh Statements
          </app-button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="border-b border-stone-200 dark:border-espresso-800">
        <nav class="flex space-x-8" aria-label="Financial Report Tabs">
          
          <button
            (click)="setTab('pnl')"
            [class.border-brass-500]="activeTab() === 'pnl'"
            [class.text-brass-600]="activeTab() === 'pnl'"
            [class.dark:text-brass-400]="activeTab() === 'pnl'"
            [class.border-transparent]="activeTab() !== 'pnl'"
            [class.text-stone-500]="activeTab() !== 'pnl'"
            class="py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-150 flex items-center space-x-2 focus:outline-none"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            <span>Profit & Loss Statement</span>
          </button>

          <button
            (click)="setTab('balance_sheet')"
            [class.border-brass-500]="activeTab() === 'balance_sheet'"
            [class.text-brass-600]="activeTab() === 'balance_sheet'"
            [class.dark:text-brass-400]="activeTab() === 'balance_sheet'"
            [class.border-transparent]="activeTab() !== 'balance_sheet'"
            [class.text-stone-500]="activeTab() !== 'balance_sheet'"
            class="py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-150 flex items-center space-x-2 focus:outline-none"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5 5 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5 5 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>
            </svg>
            <span>Balance Sheet</span>
          </button>

          <button
            (click)="setTab('aged_ar')"
            [class.border-brass-500]="activeTab() === 'aged_ar'"
            [class.text-brass-600]="activeTab() === 'aged_ar'"
            [class.dark:text-brass-400]="activeTab() === 'aged_ar'"
            [class.border-transparent]="activeTab() !== 'aged_ar'"
            [class.text-stone-500]="activeTab() !== 'aged_ar'"
            class="py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-150 flex items-center space-x-2 focus:outline-none"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Aged Receivables (AR)</span>
          </button>

          <button
            (click)="setTab('aged_ap')"
            [class.border-brass-500]="activeTab() === 'aged_ap'"
            [class.text-brass-600]="activeTab() === 'aged_ap'"
            [class.dark:text-brass-400]="activeTab() === 'aged_ap'"
            [class.border-transparent]="activeTab() !== 'aged_ap'"
            [class.text-stone-500]="activeTab() !== 'aged_ap'"
            class="py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-150 flex items-center space-x-2 focus:outline-none"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span>Aged Payables (AP)</span>
          </button>

        </nav>
      </div>

      <!-- TAB 1: PROFIT & LOSS STATEMENT (Clean Statement Layout with Fraunces Numerals) -->
      @if (activeTab() === 'pnl' && pnlData()) {
        <div class="space-y-6 animate-fade-in">
          
          <!-- Date Range Picker Toolbar -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-800 text-xs">
            <div class="flex items-center space-x-3">
              <span class="font-semibold text-stone-700 dark:text-stone-300">Statement Period:</span>
              <span class="font-mono text-stone-600 dark:text-espresso-300">{{ pnlData()?.fromDate }} to {{ pnlData()?.toDate }}</span>
            </div>

            <div class="flex items-center space-x-3">
              <label class="font-medium text-stone-500">From:</label>
              <input
                type="date"
                [(ngModel)]="pnlFromDate"
                (change)="loadPnl()"
                class="bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-2.5 py-1 text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              />
              <label class="font-medium text-stone-500">To:</label>
              <input
                type="date"
                [(ngModel)]="pnlToDate"
                (change)="loadPnl()"
                class="bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-2.5 py-1 text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              />
            </div>
          </div>

          <!-- Clean Financial Statement Paper Layout -->
          <div class="p-8 sm:p-12 rounded-2xl bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-800 shadow-md space-y-8 max-w-4xl mx-auto">
            
            <!-- Statement Header -->
            <div class="text-center pb-6 border-b border-stone-200 dark:border-espresso-800">
              <h2 class="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">Statement of Profit & Loss</h2>
              <p class="text-xs text-stone-500 dark:text-espresso-400 mt-1 uppercase tracking-wider font-semibold">For the Period Ended {{ pnlData()?.toDate }}</p>
            </div>

            <!-- REVENUE SECTION -->
            <div class="space-y-4">
              <div class="flex items-center justify-between border-b border-stone-200 dark:border-espresso-800 pb-2">
                <h3 class="font-serif font-bold text-lg text-brass-700 dark:text-brass-400 tracking-wide uppercase">Operating Revenue</h3>
                <span class="text-xs font-semibold text-stone-400">Account Type: REVENUE</span>
              </div>

              <div class="space-y-2 pl-4 text-xs">
                @for (item of pnlData()?.revenues; track item.accountName) {
                  <div class="flex items-center justify-between py-1 hover:bg-stone-50 dark:hover:bg-espresso-950/40 rounded px-2">
                    <span class="text-stone-700 dark:text-stone-300 font-medium">
                      <span class="font-mono text-brass-600 dark:text-brass-400 mr-2">{{ item.accountCode }}</span>
                      {{ item.accountName }}
                    </span>
                    <app-currency-display [amount]="item.amount" size="sm"></app-currency-display>
                  </div>
                }
              </div>

              <div class="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-espresso-800 bg-stone-50/60 dark:bg-espresso-950/60 p-3 rounded-xl">
                <span class="font-serif font-bold text-base text-stone-900 dark:text-stone-100">Total Operating Revenue</span>
                <span class="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
                  <app-currency-display [amount]="pnlData()?.totalRevenue || 0" size="lg"></app-currency-display>
                </span>
              </div>
            </div>

            <!-- OPERATING EXPENSES SECTION -->
            <div class="space-y-4 pt-4">
              <div class="flex items-center justify-between border-b border-stone-200 dark:border-espresso-800 pb-2">
                <h3 class="font-serif font-bold text-lg text-stone-800 dark:text-stone-200 tracking-wide uppercase">Operating Expenses</h3>
                <span class="text-xs font-semibold text-stone-400">Account Type: EXPENSE</span>
              </div>

              <div class="space-y-2 pl-4 text-xs">
                @for (item of pnlData()?.expenses; track item.accountName) {
                  <div class="flex items-center justify-between py-1 hover:bg-stone-50 dark:hover:bg-espresso-950/40 rounded px-2">
                    <span class="text-stone-700 dark:text-stone-300 font-medium">
                      <span class="font-mono text-stone-500 mr-2">{{ item.accountCode }}</span>
                      {{ item.accountName }}
                    </span>
                    <app-currency-display [amount]="item.amount" size="sm"></app-currency-display>
                  </div>
                }
              </div>

              <div class="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-espresso-800 bg-stone-50/60 dark:bg-espresso-950/60 p-3 rounded-xl">
                <span class="font-serif font-bold text-base text-stone-900 dark:text-stone-100">Total Operating Expenses</span>
                <span class="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
                  <app-currency-display [amount]="pnlData()?.totalExpense || 0" size="lg"></app-currency-display>
                </span>
              </div>
            </div>

            <!-- NET PROFIT SUMMARY BANNER (Fraunces Display Font Highlight) -->
            <div class="p-6 rounded-2xl bg-brass-500/10 dark:bg-brass-500/15 border-2 border-brass-500/30 flex items-center justify-between">
              <div>
                <h3 class="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">Net Profit / Income</h3>
                <p class="text-xs text-stone-500 dark:text-espresso-400 mt-0.5">Gross revenue minus total operating expenses</p>
              </div>

              <div class="text-right">
                <span class="font-serif font-bold text-3xl sm:text-4xl text-brass-700 dark:text-brass-400 tracking-tight">
                  <app-currency-display [amount]="pnlData()?.netProfit || 0" size="xl" forceColor="success"></app-currency-display>
                </span>
              </div>
            </div>

          </div>
        </div>
      }

      <!-- TAB 2: BALANCE SHEET STATEMENT (Clean Layout with Fraunces Numerals) -->
      @if (activeTab() === 'balance_sheet' && bsData()) {
        <div class="space-y-6 animate-fade-in">
          
          <!-- As Of Date Toolbar -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-800 text-xs">
            <div class="flex items-center space-x-3">
              <span class="font-semibold text-stone-700 dark:text-stone-300">Statement Date:</span>
              <span class="font-mono text-stone-600 dark:text-espresso-300">As of {{ bsData()?.asOfDate }}</span>
            </div>

            <div class="flex items-center space-x-3">
              <label class="font-medium text-stone-500">As of Date:</label>
              <input
                type="date"
                [(ngModel)]="bsAsOfDate"
                (change)="loadBs()"
                class="bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-2.5 py-1 text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              />
            </div>
          </div>

          <!-- Clean Financial Statement Paper Layout -->
          <div class="p-8 sm:p-12 rounded-2xl bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-800 shadow-md space-y-8 max-w-4xl mx-auto">
            
            <!-- Statement Header -->
            <div class="text-center pb-6 border-b border-stone-200 dark:border-espresso-800">
              <h2 class="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">Statement of Financial Position (Balance Sheet)</h2>
              <p class="text-xs text-stone-500 dark:text-espresso-400 mt-1 uppercase tracking-wider font-semibold">As of {{ bsData()?.asOfDate }}</p>
            </div>

            <!-- ASSETS SECTION -->
            <div class="space-y-4">
              <div class="flex items-center justify-between border-b border-stone-200 dark:border-espresso-800 pb-2">
                <h3 class="font-serif font-bold text-lg text-sky-600 dark:text-sky-400 tracking-wide uppercase">Assets</h3>
                <span class="text-xs font-semibold text-stone-400">Account Type: ASSET</span>
              </div>

              <div class="space-y-2 pl-4 text-xs">
                @for (item of bsData()?.assets; track item.accountName) {
                  <div class="flex items-center justify-between py-1 hover:bg-stone-50 dark:hover:bg-espresso-950/40 rounded px-2">
                    <span class="text-stone-700 dark:text-stone-300 font-medium">
                      <span class="font-mono text-sky-600 dark:text-sky-400 mr-2">{{ item.accountCode }}</span>
                      {{ item.accountName }}
                    </span>
                    <app-currency-display [amount]="item.amount" size="sm"></app-currency-display>
                  </div>
                }
              </div>

              <div class="flex items-center justify-between pt-3 border-t-2 border-stone-900 dark:border-stone-100 bg-sky-500/10 p-3 rounded-xl">
                <span class="font-serif font-bold text-base text-stone-900 dark:text-stone-100">Total Assets</span>
                <span class="font-serif font-bold text-2xl text-sky-700 dark:text-sky-400">
                  <app-currency-display [amount]="bsData()?.totalAssets || 0" size="lg"></app-currency-display>
                </span>
              </div>
            </div>

            <!-- LIABILITIES SECTION -->
            <div class="space-y-4 pt-4">
              <div class="flex items-center justify-between border-b border-stone-200 dark:border-espresso-800 pb-2">
                <h3 class="font-serif font-bold text-lg text-amber-600 dark:text-amber-400 tracking-wide uppercase">Liabilities</h3>
                <span class="text-xs font-semibold text-stone-400">Account Type: LIABILITY</span>
              </div>

              <div class="space-y-2 pl-4 text-xs">
                @for (item of bsData()?.liabilities; track item.accountName) {
                  <div class="flex items-center justify-between py-1 hover:bg-stone-50 dark:hover:bg-espresso-950/40 rounded px-2">
                    <span class="text-stone-700 dark:text-stone-300 font-medium">
                      <span class="font-mono text-amber-600 dark:text-amber-400 mr-2">{{ item.accountCode }}</span>
                      {{ item.accountName }}
                    </span>
                    <app-currency-display [amount]="item.amount" size="sm"></app-currency-display>
                  </div>
                }
              </div>

              <div class="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-espresso-800 bg-stone-50/60 dark:bg-espresso-950/60 p-3 rounded-xl">
                <span class="font-serif font-bold text-base text-stone-900 dark:text-stone-100">Total Liabilities</span>
                <span class="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
                  <app-currency-display [amount]="bsData()?.totalLiabilities || 0" size="lg"></app-currency-display>
                </span>
              </div>
            </div>

            <!-- EQUITY SECTION -->
            <div class="space-y-4 pt-4">
              <div class="flex items-center justify-between border-b border-stone-200 dark:border-espresso-800 pb-2">
                <h3 class="font-serif font-bold text-lg text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">Equity</h3>
                <span class="text-xs font-semibold text-stone-400">Account Type: EQUITY</span>
              </div>

              <div class="space-y-2 pl-4 text-xs">
                @for (item of bsData()?.equity; track item.accountName) {
                  <div class="flex items-center justify-between py-1 hover:bg-stone-50 dark:hover:bg-espresso-950/40 rounded px-2">
                    <span class="text-stone-700 dark:text-stone-300 font-medium">
                      <span class="font-mono text-indigo-600 dark:text-indigo-400 mr-2">{{ item.accountCode }}</span>
                      {{ item.accountName }}
                    </span>
                    <app-currency-display [amount]="item.amount" size="sm"></app-currency-display>
                  </div>
                }
              </div>

              <div class="flex items-center justify-between pt-3 border-t border-stone-200 dark:border-espresso-800 bg-stone-50/60 dark:bg-espresso-950/60 p-3 rounded-xl">
                <span class="font-serif font-bold text-base text-stone-900 dark:text-stone-100">Total Equity</span>
                <span class="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
                  <app-currency-display [amount]="bsData()?.totalEquity || 0" size="lg"></app-currency-display>
                </span>
              </div>
            </div>

            <!-- TOTAL LIABILITIES & EQUITY BANNER (Fraunces Display Font Highlight) -->
            <div class="p-6 rounded-2xl bg-stone-900 dark:bg-espresso-950 text-white flex items-center justify-between border-2 border-brass-500">
              <div>
                <h3 class="font-serif font-bold text-xl text-stone-100">Total Liabilities & Equity</h3>
                <p class="text-xs text-stone-400 mt-0.5">Sum of organization liabilities plus total owner equity</p>
              </div>

              <div class="text-right">
                <span class="font-serif font-bold text-3xl sm:text-4xl text-brass-400 tracking-tight">
                  <app-currency-display [amount]="bsData()?.totalLiabilitiesAndEquity || 0" size="xl"></app-currency-display>
                </span>
              </div>
            </div>

          </div>
        </div>
      }

      <!-- TAB 3 & 4: AGED RECEIVABLES / AGED PAYABLES (Bucketed Table with Danger-Tinted Older Buckets) -->
      @if ((activeTab() === 'aged_ar' || activeTab() === 'aged_ap') && agedData()) {
        <div class="space-y-6 animate-fade-in">
          
          <!-- As Of Date Toolbar -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-800 text-xs">
            <div class="flex items-center space-x-3">
              <span class="font-semibold text-stone-700 dark:text-stone-300">Aged Statement Date:</span>
              <span class="font-mono text-stone-600 dark:text-espresso-300">As of {{ agedData()?.asOfDate }}</span>
            </div>

            <div class="flex items-center space-x-3">
              <label class="font-medium text-stone-500">As of Date:</label>
              <input
                type="date"
                [(ngModel)]="agedAsOfDate"
                (change)="loadAged()"
                class="bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-2.5 py-1 text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              />
            </div>
          </div>

          <!-- Bucketed Summary KPI Row -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div class="p-3.5 rounded-xl bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-800">
              <span class="block text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400">Current (0 Days)</span>
              <div class="mt-1 font-bold">
                <app-currency-display [amount]="agedData()?.currentTotal || 0" size="sm"></app-currency-display>
              </div>
            </div>

            <div class="p-3.5 rounded-xl bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-800">
              <span class="block text-[10px] uppercase font-semibold text-sky-600 dark:text-sky-400">1-30 Days Overdue</span>
              <div class="mt-1 font-bold">
                <app-currency-display [amount]="agedData()?.days1To30Total || 0" size="sm"></app-currency-display>
              </div>
            </div>

            <div class="p-3.5 rounded-xl bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-800">
              <span class="block text-[10px] uppercase font-semibold text-amber-600 dark:text-amber-400">31-60 Days Overdue</span>
              <div class="mt-1 font-bold">
                <app-currency-display [amount]="agedData()?.days31To60Total || 0" size="sm"></app-currency-display>
              </div>
            </div>

            <!-- Danger Tinted Buckets (61-90 and 90+) -->
            <div class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30">
              <span class="block text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">61-90 Days (High Risk)</span>
              <div class="mt-1 font-bold">
                <app-currency-display [amount]="agedData()?.days61To90Total || 0" size="sm" forceColor="danger"></app-currency-display>
              </div>
            </div>

            <div class="p-3.5 rounded-xl bg-rose-500/15 border-2 border-rose-500/40">
              <span class="block text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">90+ Days (Critical)</span>
              <div class="mt-1 font-bold">
                <app-currency-display [amount]="agedData()?.over90Total || 0" size="sm" forceColor="danger"></app-currency-display>
              </div>
            </div>

            <div class="p-3.5 rounded-xl bg-stone-900 dark:bg-espresso-950 text-white border border-stone-800">
              <span class="block text-[10px] uppercase font-bold text-brass-400">Grand Total</span>
              <div class="mt-1 font-bold">
                <app-currency-display [amount]="agedData()?.grandTotal || 0" size="sm"></app-currency-display>
              </div>
            </div>
          </div>

          <!-- Bucketed Table Statement View -->
          <div class="rounded-2xl border border-stone-200 dark:border-espresso-800 bg-white dark:bg-espresso-900 overflow-hidden shadow-sm text-xs">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-stone-50 dark:bg-espresso-950 text-[11px] font-semibold uppercase text-stone-500 border-b border-stone-200 dark:border-espresso-800">
                  <th class="py-3 px-3">Document #</th>
                  <th class="py-3 px-3">Party Name</th>
                  <th class="py-3 px-3">Due Date</th>
                  <th class="py-3 px-3 text-right">Current</th>
                  <th class="py-3 px-3 text-right">1-30 Days</th>
                  <th class="py-3 px-3 text-right">31-60 Days</th>
                  <!-- Danger Tinted Column Headers for 61-90 and 90+ -->
                  <th class="py-3 px-3 text-right bg-rose-500/5 text-rose-700 dark:text-rose-400">61-90 Days</th>
                  <th class="py-3 px-3 text-right bg-rose-500/10 text-rose-700 dark:text-rose-400">90+ Days</th>
                  <th class="py-3 px-3 text-right">Balance Due</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-200 dark:divide-espresso-800/60 font-mono">
                @for (item of agedData()?.items; track item.documentNumber) {
                  <tr class="hover:bg-stone-50/60 dark:hover:bg-espresso-950/40">
                    <td class="py-3 px-3 font-sans font-bold text-stone-900 dark:text-stone-100">{{ item.documentNumber }}</td>
                    <td class="py-3 px-3 font-sans font-medium text-stone-700 dark:text-stone-300">{{ item.partyName }}</td>
                    <td class="py-3 px-3 text-stone-500">{{ item.dueDate }}</td>

                    <!-- Current (0 days) -->
                    <td class="py-3 px-3 text-right font-bold">
                      @if (item.bucket === 'CURRENT') {
                        <app-currency-display [amount]="item.balanceDue" size="xs"></app-currency-display>
                      } @else {
                        <span class="text-stone-300 dark:text-espresso-700">-</span>
                      }
                    </td>

                    <!-- 1-30 days -->
                    <td class="py-3 px-3 text-right font-bold">
                      @if (item.bucket === '1-30') {
                        <app-currency-display [amount]="item.balanceDue" size="xs"></app-currency-display>
                      } @else {
                        <span class="text-stone-300 dark:text-espresso-700">-</span>
                      }
                    </td>

                    <!-- 31-60 days -->
                    <td class="py-3 px-3 text-right font-bold">
                      @if (item.bucket === '31-60') {
                        <app-currency-display [amount]="item.balanceDue" size="xs"></app-currency-display>
                      } @else {
                        <span class="text-stone-300 dark:text-espresso-700">-</span>
                      }
                    </td>

                    <!-- 61-90 days (Danger Tinted CurrencyDisplay) -->
                    <td class="py-3 px-3 text-right font-bold bg-rose-500/5">
                      @if (item.bucket === '61-90') {
                        <app-currency-display [amount]="item.balanceDue" size="xs" forceColor="danger"></app-currency-display>
                      } @else {
                        <span class="text-stone-300 dark:text-espresso-700">-</span>
                      }
                    </td>

                    <!-- 90+ days (Danger Tinted CurrencyDisplay) -->
                    <td class="py-3 px-3 text-right font-bold bg-rose-500/10">
                      @if (item.bucket === '90+') {
                        <app-currency-display [amount]="item.balanceDue" size="xs" forceColor="danger"></app-currency-display>
                      } @else {
                        <span class="text-stone-300 dark:text-espresso-700">-</span>
                      }
                    </td>

                    <!-- Balance Due -->
                    <td class="py-3 px-3 text-right font-bold">
                      <app-currency-display [amount]="item.balanceDue" size="xs"></app-currency-display>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

    </div>
  `
})
export class ReportsComponent implements OnInit {
  readonly reportsService = inject(ReportsService);

  readonly activeTab = signal<ReportTab>('pnl');

  readonly pnlData = signal<ProfitAndLossReport | null>(null);
  readonly bsData = signal<BalanceSheetReport | null>(null);
  readonly agedData = signal<AgedReport | null>(null);

  readonly isLoading = signal<boolean>(true);

  // Date filters
  pnlFromDate = '2026-01-01';
  pnlToDate = new Date().toISOString().split('T')[0];
  bsAsOfDate = new Date().toISOString().split('T')[0];
  agedAsOfDate = new Date().toISOString().split('T')[0];

  ngOnInit(): void {
    this.loadReports();
  }

  setTab(tab: ReportTab): void {
    this.activeTab.set(tab);
    this.loadReports();
  }

  loadReports(): void {
    this.isLoading.set(true);

    if (this.activeTab() === 'pnl') {
      this.loadPnl();
    } else if (this.activeTab() === 'balance_sheet') {
      this.loadBs();
    } else {
      this.loadAged();
    }
  }

  loadPnl(): void {
    this.reportsService.getProfitAndLoss(this.pnlFromDate, this.pnlToDate).subscribe(data => {
      this.pnlData.set(data);
      this.isLoading.set(false);
    });
  }

  loadBs(): void {
    this.reportsService.getBalanceSheet(this.bsAsOfDate).subscribe(data => {
      this.bsData.set(data);
      this.isLoading.set(false);
    });
  }

  loadAged(): void {
    if (this.activeTab() === 'aged_ar') {
      this.reportsService.getAgedReceivables(this.agedAsOfDate).subscribe(data => {
        this.agedData.set(data);
        this.isLoading.set(false);
      });
    } else {
      this.reportsService.getAgedPayables(this.agedAsOfDate).subscribe(data => {
        this.agedData.set(data);
        this.isLoading.set(false);
      });
    }
  }
}
