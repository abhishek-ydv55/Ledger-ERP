import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-currency-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="containerClasses">
      @if (showSign && numValue > 0) {
        <span>+</span>
      }
      <span>{{ formattedAmount }}</span>
    </span>
  `
})
export class CurrencyDisplayComponent {
  @Input() amount: number | null | undefined = 0;
  @Input() currencyCode = 'USD';
  @Input() symbol = '$';
  @Input() colorCoded = false;
  @Input() forceColor?: 'danger' | 'success' | 'warning' | 'neutral';
  @Input() showSign = false;
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'sm';

  get numValue(): number {
    if (this.amount === null || this.amount === undefined || isNaN(this.amount)) {
      return 0;
    }
    return Number(this.amount);
  }

  get formattedAmount(): string {
    const absVal = Math.abs(this.numValue);
    const formatted = absVal.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    const prefix = this.numValue < 0 ? `-${this.symbol}` : this.symbol;
    return `${prefix}${formatted}`;
  }

  get containerClasses(): string {
    const base = 'font-mono tabular-nums inline-flex items-center tracking-tight font-medium';

    const sizeCls = {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg font-semibold',
      xl: 'text-2xl font-bold'
    }[this.size];

    let colorCls = 'text-stone-900 dark:text-stone-100';

    if (this.forceColor) {
      colorCls = {
        danger: 'text-rose-600 dark:text-rose-400',
        success: 'text-emerald-600 dark:text-emerald-400',
        warning: 'text-amber-600 dark:text-amber-400',
        neutral: 'text-stone-600 dark:text-espresso-300'
      }[this.forceColor];
    } else if (this.colorCoded) {
      if (this.numValue < 0) {
        colorCls = 'text-rose-600 dark:text-rose-400';
      } else if (this.numValue > 0) {
        colorCls = 'text-emerald-600 dark:text-emerald-400';
      } else {
        colorCls = 'text-stone-500 dark:text-espresso-400';
      }
    }

    return `${base} ${sizeCls} ${colorCls}`;
  }
}
