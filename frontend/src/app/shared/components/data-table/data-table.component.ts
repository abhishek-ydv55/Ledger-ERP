import { Component, Input, Output, EventEmitter, TemplateRef, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  cell?: (item: T) => any;
  template?: TemplateRef<any>;
}

export interface SortEvent {
  key: string;
  direction: 'asc' | 'desc';
}

export interface PageEvent {
  pageIndex: number;
  pageSize: number;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full space-y-4">
      
      <!-- Table Container -->
      <div class="w-full overflow-x-auto rounded-xl border border-stone-200 dark:border-espresso-800 bg-white dark:bg-espresso-900 shadow-xs">
        <table class="w-full text-left border-collapse">
          
          <!-- Table Header -->
          <thead>
            <tr class="border-b border-stone-200 dark:border-espresso-800/80 bg-stone-50/80 dark:bg-espresso-950/50 text-[11px] font-semibold text-stone-500 dark:text-espresso-400 uppercase tracking-wider select-none">
              @for (col of columns; track col.key) {
                <th
                  [style.width]="col.width"
                  [class.text-left]="!col.align || col.align === 'left'"
                  [class.text-center]="col.align === 'center'"
                  [class.text-right]="col.align === 'right'"
                  [class.cursor-pointer]="col.sortable"
                  [class.hover:text-stone-800]="col.sortable"
                  [class.dark:hover:text-stone-200]="col.sortable"
                  (click)="onHeaderClick(col)"
                  class="px-4 py-3.5 transition-colors"
                >
                  <div class="inline-flex items-center space-x-1" [class.justify-end]="col.align === 'right'" [class.justify-center]="col.align === 'center'">
                    <span>{{ col.header }}</span>
                    @if (col.sortable) {
                      <svg
                        class="w-3.5 h-3.5 transition-transform duration-150"
                        [class.text-brass-500]="activeSortKey === col.key"
                        [class.text-stone-400]="activeSortKey !== col.key"
                        [class.rotate-180]="activeSortKey === col.key && activeSortDirection === 'desc'"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
                      </svg>
                    }
                  </div>
                </th>
              }
            </tr>
          </thead>

          <!-- Table Body -->
          <tbody class="divide-y divide-stone-200 dark:divide-espresso-800/60 text-xs text-stone-800 dark:text-stone-200">
            
            <!-- Loading Skeleton Rows (Matching actual table structure with shimmers) -->
            @if (loading) {
              @for (rowIdx of skeletonArray; track rowIdx) {
                <tr class="animate-pulse">
                  @for (col of columns; track col.key) {
                    <td class="px-4 py-4">
                      <div class="h-4 bg-stone-200 dark:bg-espresso-800/80 rounded-md w-3/4"></div>
                    </td>
                  }
                </tr>
              }
            }

            <!-- Data Rows -->
            @else if (displayData.length > 0) {
              @for (item of displayData; track $index) {
                <tr
                  (click)="onRowClick(item)"
                  class="hover:bg-stone-50/80 dark:hover:bg-espresso-800/40 transition-colors duration-150 group cursor-pointer"
                >
                  @for (col of columns; track col.key) {
                    <td
                      [class.text-left]="!col.align || col.align === 'left'"
                      [class.text-center]="col.align === 'center'"
                      [class.text-right]="col.align === 'right'"
                      class="px-4 py-3.5 whitespace-nowrap"
                    >
                      @if (col.template) {
                        <ng-container *ngTemplateOutlet="col.template; context: { $implicit: item, row: item }"></ng-container>
                      } @else if (col.cell) {
                        {{ col.cell(item) }}
                      } @else {
                        {{ getNestedValue(item, col.key) }}
                      }
                    </td>
                  }
                </tr>
              }
            }

            <!-- Empty State -->
            @else {
              <tr>
                <td [attr.colspan]="columns.length" class="px-4 py-12 text-center">
                  <div class="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div class="w-12 h-12 rounded-full bg-stone-100 dark:bg-espresso-800 flex items-center justify-center text-stone-400 dark:text-espresso-400 mb-3">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                      </svg>
                    </div>
                    <h3 class="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-1">{{ emptyTitle }}</h3>
                    <p class="text-xs text-stone-500 dark:text-espresso-400 leading-relaxed">{{ emptyMessage }}</p>
                  </div>
                </td>
              </tr>
            }

          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      @if (showPagination && (totalItemCount > 0 || loading)) {
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 dark:text-espresso-400 px-1">
          
          <!-- Items count info -->
          <div>
            Showing <span class="font-semibold text-stone-800 dark:text-stone-200">{{ pageStart }}</span> to
            <span class="font-semibold text-stone-800 dark:text-stone-200">{{ pageEnd }}</span> of
            <span class="font-semibold text-stone-800 dark:text-stone-200">{{ totalItemCount }}</span> results
          </div>

          <!-- Pagination Controls -->
          <div class="flex items-center space-x-3">
            
            <!-- Page Size Selector -->
            <div class="flex items-center space-x-1.5">
              <span>Rows per page:</span>
              <select
                [value]="pageSize"
                (change)="onPageSizeChange($event)"
                class="bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-700 rounded-md px-2 py-1 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-brass-400"
              >
                @for (opt of pageSizeOptions; track opt) {
                  <option [value]="opt">{{ opt }}</option>
                }
              </select>
            </div>

            <!-- Prev / Next buttons -->
            <div class="flex items-center space-x-1">
              <button
                (click)="goToPage(pageIndex - 1)"
                [disabled]="pageIndex === 0 || loading"
                type="button"
                class="p-1.5 rounded-lg border border-stone-200 dark:border-espresso-700 bg-white dark:bg-espresso-900 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-espresso-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>

              <span class="px-2 font-medium text-stone-700 dark:text-stone-300">
                {{ pageIndex + 1 }} / {{ maxPage }}
              </span>

              <button
                (click)="goToPage(pageIndex + 1)"
                [disabled]="pageIndex >= maxPage - 1 || loading"
                type="button"
                class="p-1.5 rounded-lg border border-stone-200 dark:border-espresso-700 bg-white dark:bg-espresso-900 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-espresso-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class DataTableComponent<T> {
  @Input() data: T[] = [];
  @Input() columns: ColumnDef<T>[] = [];
  @Input() loading = false;
  @Input() skeletonRows = 5;
  @Input() totalItems?: number;
  @Input() pageSize = 10;
  @Input() pageIndex = 0;
  @Input() pageSizeOptions = [5, 10, 25, 50];
  @Input() emptyTitle = 'No records found';
  @Input() emptyMessage = 'There is no data matching your request at this time.';
  @Input() showPagination = true;

  @Output() sortChange = new EventEmitter<SortEvent>();
  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() rowClick = new EventEmitter<T>();

  activeSortKey = '';
  activeSortDirection: 'asc' | 'desc' = 'asc';

  get skeletonArray(): number[] {
    return Array.from({ length: this.skeletonRows }, (_, i) => i);
  }

  get totalItemCount(): number {
    return this.totalItems !== undefined ? this.totalItems : this.data.length;
  }

  get maxPage(): number {
    return Math.ceil(this.totalItemCount / this.pageSize) || 1;
  }

  get pageStart(): number {
    if (this.totalItemCount === 0) return 0;
    return this.pageIndex * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min((this.pageIndex + 1) * this.pageSize, this.totalItemCount);
  }

  get displayData(): T[] {
    // If client-side pagination / sorting (when totalItems is not provided)
    if (this.totalItems === undefined) {
      let result = [...this.data];

      if (this.activeSortKey) {
        result.sort((a, b) => {
          const valA = this.getNestedValue(a, this.activeSortKey);
          const valB = this.getNestedValue(b, this.activeSortKey);
          if (valA < valB) return this.activeSortDirection === 'asc' ? -1 : 1;
          if (valA > valB) return this.activeSortDirection === 'asc' ? 1 : -1;
          return 0;
        });
      }

      if (this.showPagination) {
        const start = this.pageIndex * this.pageSize;
        result = result.slice(start, start + this.pageSize);
      }

      return result;
    }

    return this.data;
  }

  onHeaderClick(col: ColumnDef<T>): void {
    if (!col.sortable) return;

    if (this.activeSortKey === col.key) {
      this.activeSortDirection = this.activeSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.activeSortKey = col.key;
      this.activeSortDirection = 'asc';
    }

    this.sortChange.emit({
      key: this.activeSortKey,
      direction: this.activeSortDirection
    });
  }

  onRowClick(item: T): void {
    this.rowClick.emit(item);
  }

  goToPage(idx: number): void {
    if (idx < 0 || idx >= this.maxPage) return;
    this.pageIndex = idx;
    this.pageChange.emit({ pageIndex: this.pageIndex, pageSize: this.pageSize });
  }

  onPageSizeChange(event: Event): void {
    const newSize = Number((event.target as HTMLSelectElement).value);
    this.pageSize = newSize;
    this.pageIndex = 0;
    this.pageChange.emit({ pageIndex: this.pageIndex, pageSize: this.pageSize });
  }

  getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return '';
    return path.split('.').reduce((acc, part) => acc && acc[part], obj) ?? '';
  }
}
