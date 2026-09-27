import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { DashboardService, DashboardData } from './dashboard.service';
import { ThemeService } from '../../core/services/theme.service';
import { CurrencyDisplayComponent } from '../../shared/components/currency-display/currency-display.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { DataTableComponent, ColumnDef } from '../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NgxEchartsDirective,
    CurrencyDisplayComponent,
    StatusBadgeComponent,
    DataTableComponent
  ],
  template: `
    <div class="space-y-6 sm:space-y-8">
      
      <!-- Dashboard Title & Action Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Executive Overview
          </h1>
          <p class="text-xs sm:text-sm text-stone-500 dark:text-espresso-400 mt-1">
            Real-time financial performance, cash flow status, and ledger analytics.
          </p>
        </div>

        <div class="flex items-center space-x-3">
          <a
            routerLink="/sales"
            class="px-3.5 py-2 rounded-lg bg-brass-500 hover:bg-brass-400 text-espresso-950 font-semibold text-xs transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-brass-400 flex items-center space-x-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span>Create Invoice</span>
          </a>
          <a
            routerLink="/reports"
            class="px-3.5 py-2 rounded-lg border border-stone-200 dark:border-espresso-700 bg-white dark:bg-espresso-900 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-espresso-800 font-medium text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-brass-400"
          >
            Financial Reports
          </a>
        </div>
      </div>

      <!-- KPI Cards Row (Large Fraunces Numerals with Orchestrated Count-Up Animation) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        <!-- Card 1: Total Receivables -->
        <div class="p-5 rounded-2xl bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-800 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-stone-500 dark:text-espresso-400 uppercase tracking-wider">Total Receivables</span>
            <div class="p-2 rounded-xl bg-brass-500/10 text-brass-600 dark:text-brass-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
            </div>
          </div>
          
          <div class="mt-4">
            <div class="font-serif font-bold text-2xl sm:text-3xl lg:text-4xl text-stone-900 dark:text-stone-100 tracking-tight">
              <app-currency-display [amount]="animReceivables()" size="xl"></app-currency-display>
            </div>
            <div class="mt-2 flex items-center space-x-1.5 text-xs">
              <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                +{{ dashboardData()?.kpis?.totalReceivablesTrend }}%
              </span>
              <span class="text-stone-400 dark:text-espresso-400 text-[11px]">vs last month</span>
            </div>
          </div>
        </div>

        <!-- Card 2: Total Payables -->
        <div class="p-5 rounded-2xl bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-800 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-stone-500 dark:text-espresso-400 uppercase tracking-wider">Total Payables</span>
            <div class="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
            </div>
          </div>

          <div class="mt-4">
            <div class="font-serif font-bold text-2xl sm:text-3xl lg:text-4xl text-stone-900 dark:text-stone-100 tracking-tight">
              <app-currency-display [amount]="animPayables()" size="xl"></app-currency-display>
            </div>
            <div class="mt-2 flex items-center space-x-1.5 text-xs">
              <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                {{ dashboardData()?.kpis?.totalPayablesTrend }}%
              </span>
              <span class="text-stone-400 dark:text-espresso-400 text-[11px]">reduced payables</span>
            </div>
          </div>
        </div>

        <!-- Card 3: Cash Position -->
        <div class="p-5 rounded-2xl bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-800 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-stone-500 dark:text-espresso-400 uppercase tracking-wider">Cash Position</span>
            <div class="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>

          <div class="mt-4">
            <div class="font-serif font-bold text-2xl sm:text-3xl lg:text-4xl text-stone-900 dark:text-stone-100 tracking-tight">
              <app-currency-display [amount]="animCash()" size="xl" forceColor="success"></app-currency-display>
            </div>
            <div class="mt-2 flex items-center space-x-1.5 text-xs">
              <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                +{{ dashboardData()?.kpis?.cashPositionTrend }}%
              </span>
              <span class="text-stone-400 dark:text-espresso-400 text-[11px]">across 4 bank accounts</span>
            </div>
          </div>
        </div>

        <!-- Card 4: Monthly Revenue -->
        <div class="p-5 rounded-2xl bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-800 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-stone-500 dark:text-espresso-400 uppercase tracking-wider">This-Month Revenue</span>
            <div class="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
          </div>

          <div class="mt-4">
            <div class="font-serif font-bold text-2xl sm:text-3xl lg:text-4xl text-stone-900 dark:text-stone-100 tracking-tight">
              <app-currency-display [amount]="animRevenue()" size="xl"></app-currency-display>
            </div>
            <div class="mt-2 flex items-center space-x-1.5 text-xs">
              <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                +{{ dashboardData()?.kpis?.monthlyRevenueTrend }}%
              </span>
              <span class="text-stone-400 dark:text-espresso-400 text-[11px]">vs target benchmark</span>
            </div>
          </div>
        </div>

      </div>

      <!-- ECharts Charts Section (Styled with Ledger Palette: Brand/Success/Warning/Danger) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Revenue & Expense Trend Chart (2 Columns) -->
        <div class="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-800 shadow-xs flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-stone-100">Revenue & Expense Trend</h3>
              <p class="text-xs text-stone-500 dark:text-espresso-400 mt-0.5">Monthly breakdown of gross revenue vs operating expenses</p>
            </div>
            <span class="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-espresso-800 text-[11px] font-medium text-stone-600 dark:text-stone-300">
              6 Months
            </span>
          </div>

          <div class="flex-1 w-full min-h-[300px]">
            <div echarts [options]="revenueChartOptions" class="w-full h-full min-h-[300px]"></div>
          </div>
        </div>

        <!-- Aged Receivables Breakdown Chart (1 Column) -->
        <div class="p-5 sm:p-6 rounded-2xl bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-800 shadow-xs flex flex-col">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-sm font-semibold text-stone-900 dark:text-stone-100">Aged Receivables</h3>
              <p class="text-xs text-stone-500 dark:text-espresso-400 mt-0.5">Outstanding customer balance distribution</p>
            </div>
          </div>

          <div class="flex-1 w-full min-h-[300px]">
            <div echarts [options]="receivablesChartOptions" class="w-full h-full min-h-[300px]"></div>
          </div>
        </div>

      </div>

      <!-- Recent Activity Section using Compact Shared DataTable -->
      <div class="p-5 sm:p-6 rounded-2xl bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-800 shadow-xs space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-stone-900 dark:text-stone-100">Recent Financial Activity</h3>
            <p class="text-xs text-stone-500 dark:text-espresso-400 mt-0.5">Latest invoices, vendor bills, and posted transactions</p>
          </div>
          <a
            routerLink="/accounting"
            class="text-xs font-semibold text-brass-600 dark:text-brass-400 hover:text-brass-700 dark:hover:text-brass-300 transition-colors"
          >
            View All Ledger &rarr;
          </a>
        </div>

        <!-- Shared DataTable in Compact Mode -->
        <app-data-table
          [data]="dashboardData()?.recentActivities || []"
          [columns]="tableColumns"
          [loading]="isLoading()"
          [showPagination]="false"
          emptyTitle="No recent activity"
          emptyMessage="No financial transactions recorded recently."
        ></app-data-table>
      </div>

    </div>
  `
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  readonly themeService = inject(ThemeService);

  readonly dashboardData = signal<DashboardData | null>(null);
  readonly isLoading = signal<boolean>(true);

  // Animated KPI signals
  readonly animReceivables = signal<number>(0);
  readonly animPayables = signal<number>(0);
  readonly animCash = signal<number>(0);
  readonly animRevenue = signal<number>(0);

  private hasAnimated = false;

  // Shared DataTable Columns
  tableColumns: ColumnDef<any>[] = [
    { key: 'date', header: 'Date', width: '120px' },
    {
      key: 'type',
      header: 'Type',
      width: '110px',
      cell: (item) => item.type
    },
    { key: 'referenceNo', header: 'Reference #', width: '150px' },
    { key: 'partyName', header: 'Party / Description' },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      width: '140px',
      cell: (item) => `$${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      width: '120px',
      cell: (item) => item.status
    }
  ];

  ngOnInit(): void {
    this.dashboardService.getDashboardSummary().subscribe({
      next: (data: DashboardData) => {
        this.dashboardData.set(data);
        this.isLoading.set(false);
        this.triggerCountUpAnimation(data);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Orchestrated Count-Up Animation
   * Counts up each KPI value over ~600ms, staggered by ~80ms between cards on first load.
   */
  private triggerCountUpAnimation(data: DashboardData): void {
    if (this.hasAnimated) return;
    this.hasAnimated = true;

    const duration = 600; // 600ms count-up duration

    const animateValue = (target: number, delayMs: number, setter: (val: number) => void) => {
      setTimeout(() => {
        const startTime = performance.now();
        const step = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Cubic ease-out: 1 - (1 - t)^3
          const easeOut = 1 - Math.pow(1 - progress, 3);
          setter(easeOut * target);

          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            setter(target);
          }
        };
        requestAnimationFrame(step);
      }, delayMs);
    };

    animateValue(data.kpis.totalReceivables, 0, val => this.animReceivables.set(val));
    animateValue(data.kpis.totalPayables, 80, val => this.animPayables.set(val));
    animateValue(data.kpis.cashPosition, 160, val => this.animCash.set(val));
    animateValue(data.kpis.monthlyRevenue, 240, val => this.animRevenue.set(val));
  }

  // Revenue & Expense Trend Chart ECharts Options (Theme Aware, Ledger Palette)
  get revenueChartOptions(): EChartsOption {
    const isDark = this.themeService.theme() === 'dark';
    const textColor = isDark ? '#D0C4B4' : '#53453A';
    const borderColor = isDark ? 'rgba(83, 69, 58, 0.4)' : '#E4DDD4';
    const tooltipBg = isDark ? '#221C18' : '#ffffff';

    const trends = this.dashboardData()?.revenueTrends || [];

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: tooltipBg,
        borderColor: borderColor,
        textStyle: { color: textColor, fontSize: 12 },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          let res = `<div class="font-semibold mb-1.5 text-xs text-stone-900 dark:text-stone-100">${params[0].name}</div>`;
          for (const item of params) {
            const val = Number(item.value).toLocaleString(undefined, { minimumFractionDigits: 2 });
            res += `<div class="flex items-center justify-between text-xs gap-4 my-1">
                      <span>${item.marker} ${item.seriesName}</span>
                      <span class="font-mono font-semibold">$${val}</span>
                    </div>`;
          }
          return res;
        }
      },
      legend: {
        data: ['Revenue', 'Expenses', 'Net Profit'],
        textStyle: { color: textColor, fontSize: 12 },
        bottom: 0
      },
      grid: { left: '3%', right: '4%', bottom: '14%', top: '8%', containLabel: true },
      xAxis: {
        type: 'category',
        data: trends.map(t => t.month),
        axisLine: { lineStyle: { color: borderColor } },
        axisLabel: { color: textColor, fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: borderColor, type: 'dashed' } },
        axisLabel: {
          color: textColor,
          fontSize: 11,
          formatter: (val: number) => `$${(val / 1000).toFixed(0)}k`
        }
      },
      series: [
        {
          name: 'Revenue',
          type: 'bar',
          itemStyle: { color: '#C5A059', borderRadius: [4, 4, 0, 0] },
          data: trends.map(t => t.revenue)
        },
        {
          name: 'Expenses',
          type: 'bar',
          itemStyle: { color: '#6E5D4E', borderRadius: [4, 4, 0, 0] },
          data: trends.map(t => t.expenses)
        },
        {
          name: 'Net Profit',
          type: 'line',
          smooth: true,
          itemStyle: { color: '#10B981' },
          lineStyle: { width: 3 },
          data: trends.map(t => t.profit)
        }
      ]
    };
  }

  // Aged Receivables Donut Chart ECharts Options (Theme Aware, Ledger Palette)
  get receivablesChartOptions(): EChartsOption {
    const isDark = this.themeService.theme() === 'dark';
    const textColor = isDark ? '#D0C4B4' : '#53453A';
    const borderColor = isDark ? 'rgba(83, 69, 58, 0.4)' : '#E4DDD4';
    const tooltipBg = isDark ? '#221C18' : '#ffffff';

    const items = this.dashboardData()?.agedReceivables || [];

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: tooltipBg,
        borderColor: borderColor,
        textStyle: { color: textColor, fontSize: 12 },
        formatter: (params: any) => {
          const val = Number(params.value).toLocaleString(undefined, { minimumFractionDigits: 2 });
          return `<div class="font-semibold text-xs mb-1">${params.name}</div>
                  <div class="text-xs font-mono">$${val} (${params.percent}%)</div>`;
        }
      },
      legend: {
        orient: 'vertical',
        right: '2%',
        top: 'center',
        textStyle: { color: textColor, fontSize: 11 }
      },
      series: [
        {
          name: 'Aged Receivables',
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: isDark ? '#14100D' : '#ffffff',
            borderWidth: 2
          },
          label: { show: false },
          data: items.map(i => ({
            name: i.category,
            value: i.amount,
            itemStyle: { color: i.color }
          }))
        }
      ]
    };
  }
}
