import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService, AuditLogItem } from './audit.service';
import { DataTableComponent, ColumnDef } from '../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { FormDialogComponent } from '../../shared/components/form-dialog/form-dialog.component';

export interface DiffRow {
  key: string;
  status: 'UNCHANGED' | 'MODIFIED' | 'ADDED' | 'REMOVED';
  oldValStr: string;
  newValStr: string;
}

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTableComponent,
    StatusBadgeComponent,
    ButtonComponent,
    FormDialogComponent
  ],
  template: `
    <div class="space-y-6 sm:space-y-8">
      
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            System Audit & Activity Logs
          </h1>
          <p class="text-xs sm:text-sm text-stone-500 dark:text-espresso-400 mt-1">
            Tamper-evident system activity trail, entity state snapshots, and side-by-side JSON diffs.
          </p>
        </div>

        <div class="flex items-center space-x-2">
          <app-button variant="outline" size="sm" (click)="loadData()">
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh Logs
          </app-button>
        </div>
      </div>

      <!-- Filter Bar (Entity Type, Action, Date Range, User) -->
      <div class="p-4 sm:p-5 rounded-2xl bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-800 shadow-sm space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
            Filter Activity Logs
          </h3>
          @if (hasActiveFilters) {
            <button (click)="resetFilters()" class="text-xs font-medium text-brass-600 hover:underline">
              Clear All Filters
            </button>
          }
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          <!-- Entity Type Filter -->
          <div>
            <label class="block font-medium text-stone-500 dark:text-espresso-400 mb-1">Entity Type</label>
            <select
              [(ngModel)]="filterEntityType"
              class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
            >
              <option value="">All Entity Types</option>
              <option value="INVOICE">INVOICE</option>
              <option value="PURCHASE_ORDER">PURCHASE ORDER</option>
              <option value="JOURNAL_ENTRY">JOURNAL ENTRY</option>
              <option value="PARTY">PARTY / CUSTOMER</option>
              <option value="ITEM">ITEM / SKU</option>
            </select>
          </div>

          <!-- Action Filter -->
          <div>
            <label class="block font-medium text-stone-500 dark:text-espresso-400 mb-1">Action Type</label>
            <select
              [(ngModel)]="filterAction"
              class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="STATUS_CHANGE">STATUS CHANGE</option>
              <option value="POST">POST</option>
              <option value="VOID">VOID</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <!-- User / Actor Filter -->
          <div>
            <label class="block font-medium text-stone-500 dark:text-espresso-400 mb-1">User / Actor</label>
            <input
              type="text"
              [(ngModel)]="filterActor"
              placeholder="Search user name..."
              class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
            />
          </div>

          <!-- Date Range Filter -->
          <div>
            <label class="block font-medium text-stone-500 dark:text-espresso-400 mb-1">Date Range</label>
            <div class="flex items-center space-x-2">
              <input
                type="date"
                [(ngModel)]="filterFromDate"
                class="w-1/2 bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-2.5 py-2 text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              />
              <span class="text-stone-400">-</span>
              <input
                type="date"
                [(ngModel)]="filterToDate"
                class="w-1/2 bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-2.5 py-2 text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              />
            </div>
          </div>

        </div>
      </div>

      <!-- Filtered DataTable -->
      <div class="space-y-4 animate-fade-in">
        <app-data-table
          [data]="filteredLogs()"
          [columns]="tableColumns"
          [loading]="isLoading()"
          (rowClick)="openDiffModal($event)"
          emptyTitle="No audit logs found"
          emptyMessage="No system audit log entries match the selected filter criteria."
        ></app-data-table>
      </div>

      <!-- Side-by-Side Code-Like Monospace JSON Diff Modal -->
      <app-form-dialog
        [isOpen]="isDiffModalOpen()"
        [title]="'Audit Log Snapshot Diff: ' + (activeLog?.entityName || activeLog?.entityType)"
        subtitle="Side-by-side JSON snapshot diff highlighting modified, added, and removed keys"
        submitText="Close Inspector"
        [submitDisabled]="false"
        maxWidth="2xl"
        (formSubmit)="closeDiffModal()"
        (cancel)="closeDiffModal()"
      >
        @if (activeLog) {
          <div class="space-y-4 text-xs font-sans">
            
            <!-- Metadata Bar -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-xl bg-stone-100 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-800">
              <div class="flex items-center space-x-3">
                <app-status-badge [status]="activeLog.action"></app-status-badge>
                <span class="font-mono text-stone-500">{{ activeLog.createdAt }}</span>
              </div>
              <div class="text-right">
                <span class="text-stone-500 font-medium">Actor User:</span>
                <span class="font-bold text-stone-900 dark:text-stone-100 ml-1.5">{{ activeLog.actorName || 'System' }}</span>
              </div>
            </div>

            <!-- Key Diff Summary Statistics -->
            <div class="flex items-center space-x-4 text-xs font-mono">
              <span class="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                {{ modifiedCount }} Modified Keys
              </span>
              <span class="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                {{ addedCount }} Added Keys
              </span>
              <span class="px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-bold">
                {{ removedCount }} Removed Keys
              </span>
            </div>

            <!-- Code Editor Side-by-Side Monospace JSON Diff Viewer -->
            <div class="rounded-xl border border-stone-800 bg-espresso-950 text-stone-200 font-mono text-[11px] overflow-hidden shadow-2xl">
              
              <!-- Editor Header -->
              <div class="grid grid-cols-2 bg-espresso-900 border-b border-stone-800 py-2 px-4 font-bold text-[10px] uppercase tracking-wider text-stone-400">
                <div class="flex items-center space-x-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                  <span>Old State Snapshot (Before)</span>
                </div>
                <div class="flex items-center space-x-2 pl-4 border-l border-stone-800">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  <span>New State Snapshot (After)</span>
                </div>
              </div>

              <!-- Side-by-Side Diff Lines -->
              <div class="divide-y divide-stone-800/60 max-h-[420px] overflow-y-auto font-mono">
                @for (row of diffRows; track row.key) {
                  <div class="grid grid-cols-2">
                    
                    <!-- Left Pane: Old State -->
                    <div
                      class="py-1.5 px-4 overflow-x-auto"
                      [ngClass]="{
                        'bg-rose-500/15 text-rose-300 border-l-2 border-rose-500': row.status === 'REMOVED',
                        'bg-amber-500/15 text-amber-300 border-l-2 border-amber-500': row.status === 'MODIFIED'
                      }"
                    >
                      @if (row.status !== 'ADDED') {
                        <span class="text-stone-500 font-semibold mr-2">"{{ row.key }}":</span>
                        <span class="font-mono">{{ row.oldValStr }}</span>
                      } @else {
                        <span class="text-stone-700 italic select-none">&mdash; (key absent)</span>
                      }
                    </div>

                    <!-- Right Pane: New State -->
                    <div
                      class="py-1.5 px-4 border-l border-stone-800 overflow-x-auto"
                      [ngClass]="{
                        'bg-emerald-500/15 text-emerald-300 border-l-2 border-emerald-500': row.status === 'ADDED',
                        'bg-amber-500/15 text-amber-300 border-l-2 border-amber-500': row.status === 'MODIFIED'
                      }"
                    >
                      @if (row.status !== 'REMOVED') {
                        <span class="text-stone-400 font-semibold mr-2">"{{ row.key }}":</span>
                        <span class="font-mono font-bold">{{ row.newValStr }}</span>
                      } @else {
                        <span class="text-stone-700 italic select-none">&mdash; (key removed)</span>
                      }
                    </div>

                  </div>
                }
              </div>

            </div>

          </div>
        }
      </app-form-dialog>

    </div>
  `
})
export class AuditComponent implements OnInit {
  private readonly auditService = inject(AuditService);

  readonly logs = signal<AuditLogItem[]>([]);
  readonly isLoading = signal<boolean>(true);

  // Filters
  filterEntityType = '';
  filterAction = '';
  filterActor = '';
  filterFromDate = '';
  filterToDate = '';

  // Modal
  readonly isDiffModalOpen = signal<boolean>(false);
  activeLog: AuditLogItem | null = null;
  diffRows: DiffRow[] = [];

  // Table Columns
  tableColumns: ColumnDef<AuditLogItem>[] = [
    {
      key: 'createdAt',
      header: 'Timestamp',
      width: '170px',
      cell: (l) => l.createdAt
    },
    {
      key: 'entityType',
      header: 'Entity Type',
      width: '140px',
      cell: (l) => l.entityType
    },
    {
      key: 'entityName',
      header: 'Target Document / Entity',
      cell: (l) => l.entityName || l.entityId
    },
    {
      key: 'action',
      header: 'Action',
      align: 'center',
      width: '140px',
      cell: (l) => l.action
    },
    {
      key: 'actorName',
      header: 'User / Actor',
      width: '150px',
      cell: (l) => l.actorName || 'System'
    }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.auditService.getAuditLogs().subscribe(logs => {
      this.logs.set(logs);
      this.isLoading.set(false);
    });
  }

  get hasActiveFilters(): boolean {
    return !!(this.filterEntityType || this.filterAction || this.filterActor || this.filterFromDate || this.filterToDate);
  }

  resetFilters(): void {
    this.filterEntityType = '';
    this.filterAction = '';
    this.filterActor = '';
    this.filterFromDate = '';
    this.filterToDate = '';
  }

  readonly filteredLogs = computed(() => {
    let result = this.logs();

    if (this.filterEntityType) {
      result = result.filter(l => l.entityType.toUpperCase() === this.filterEntityType.toUpperCase());
    }

    if (this.filterAction) {
      result = result.filter(l => l.action.toUpperCase() === this.filterAction.toUpperCase());
    }

    if (this.filterActor) {
      const term = this.filterActor.toLowerCase();
      result = result.filter(l => (l.actorName || '').toLowerCase().includes(term));
    }

    if (this.filterFromDate) {
      result = result.filter(l => l.createdAt >= this.filterFromDate);
    }

    if (this.filterToDate) {
      result = result.filter(l => l.createdAt <= this.filterToDate + 'T23:59:59');
    }

    return result;
  });

  openDiffModal(log: AuditLogItem): void {
    this.activeLog = log;
    this.diffRows = this.buildDiffRows(log.oldSnapshot, log.newSnapshot);
    this.isDiffModalOpen.set(true);
  }

  closeDiffModal(): void {
    this.isDiffModalOpen.set(false);
    this.activeLog = null;
    this.diffRows = [];
  }

  get modifiedCount(): number {
    return this.diffRows.filter(r => r.status === 'MODIFIED').length;
  }

  get addedCount(): number {
    return this.diffRows.filter(r => r.status === 'ADDED').length;
  }

  get removedCount(): number {
    return this.diffRows.filter(r => r.status === 'REMOVED').length;
  }

  private buildDiffRows(oldSnap: any, newSnap: any): DiffRow[] {
    const oldObj = typeof oldSnap === 'string' ? JSON.parse(oldSnap || '{}') : (oldSnap || {});
    const newObj = typeof newSnap === 'string' ? JSON.parse(newSnap || '{}') : (newSnap || {});

    const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]));

    return allKeys.map(key => {
      const hasOld = key in oldObj;
      const hasNew = key in newObj;
      const oldVal = oldObj[key];
      const newVal = newObj[key];

      let status: 'UNCHANGED' | 'MODIFIED' | 'ADDED' | 'REMOVED';
      if (hasOld && !hasNew) {
        status = 'REMOVED';
      } else if (!hasOld && hasNew) {
        status = 'ADDED';
      } else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        status = 'MODIFIED';
      } else {
        status = 'UNCHANGED';
      }

      return {
        key,
        status,
        oldValStr: hasOld ? JSON.stringify(oldVal) : '',
        newValStr: hasNew ? JSON.stringify(newVal) : ''
      };
    });
  }
}
