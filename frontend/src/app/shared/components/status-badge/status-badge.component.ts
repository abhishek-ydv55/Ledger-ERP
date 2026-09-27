import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatusCategory = 'amber' | 'sky' | 'emerald' | 'rose' | 'indigo' | 'stone' | 'brass';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClasses">
      <span [class]="dotClasses"></span>
      <span class="truncate">{{ displayLabel }}</span>
    </span>
  `
})
export class StatusBadgeComponent {
  @Input() status: string | null | undefined = '';
  @Input() customLabel?: string;
  @Input() size: 'sm' | 'md' = 'md';

  get displayLabel(): string {
    if (this.customLabel) return this.customLabel;
    if (!this.status) return 'UNKNOWN';
    return this.status.replace(/_/g, ' ').toUpperCase();
  }

  get category(): StatusCategory {
    const norm = (this.status || '').toUpperCase().trim();
    
    switch (norm) {
      // Draft / Pending / Waiting
      case 'DRAFT':
      case 'PENDING':
      case 'NEW':
      case 'QUEUED':
      case 'UNPAID':
        return 'amber';

      // Sent / Issued / Processing / Submitted / Recorded / Ordered
      case 'SENT':
      case 'ISSUED':
      case 'SUBMITTED':
      case 'RECORDED':
      case 'ORDERED':
      case 'DELIVERED':
      case 'INVOICED':
        return 'sky';

      // Paid / Active / Completed / Approved
      case 'PAID':
      case 'APPROVED':
      case 'ACTIVE':
      case 'COMPLETED':
      case 'SUCCESS':
      case 'RECEIVED':
      case 'VERIFIED':
        return 'emerald';

      // Overdue / Rejected / Void / Cancelled / Error
      case 'OVERDUE':
      case 'REJECTED':
      case 'VOID':
      case 'CANCELLED':
      case 'CANCELED':
      case 'FAILED':
      case 'EXPIRED':
        return 'rose';

      // Partial / In Progress
      case 'PARTIAL':
      case 'PARTIALLY_PAID':
      case 'IN_PROGRESS':
      case 'PROCESSING':
        return 'indigo';

      // Posted / Reconciled
      case 'POSTED':
      case 'RECONCILED':
      case 'SETTLED':
        return 'brass';

      // Inactive / Closed / Archived
      case 'INACTIVE':
      case 'CLOSED':
      case 'ARCHIVED':
      case 'DISABLED':
      default:
        return 'stone';
    }
  }

  get badgeClasses(): string {
    const base = 'inline-flex items-center space-x-1.5 rounded-full font-medium border tracking-wide select-none transition-colors duration-150';
    
    const sizeCls = this.size === 'sm'
      ? 'px-2 py-0.5 text-[10px]'
      : 'px-2.5 py-1 text-xs';

    const categoryCls = {
      amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
      sky: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30',
      emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
      rose: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
      indigo: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30',
      brass: 'bg-brass-500/10 text-brass-700 dark:text-brass-400 border-brass-500/30',
      stone: 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/30'
    }[this.category];

    return `${base} ${sizeCls} ${categoryCls}`;
  }

  get dotClasses(): string {
    const base = 'w-1.5 h-1.5 rounded-full shrink-0 animate-pulse';
    
    const dotColor = {
      amber: 'bg-amber-500',
      sky: 'bg-sky-500',
      emerald: 'bg-emerald-500',
      rose: 'bg-rose-500',
      indigo: 'bg-indigo-500',
      brass: 'bg-brass-500',
      stone: 'bg-stone-400'
    }[this.category];

    return `${base} ${dotColor}`;
  }
}
