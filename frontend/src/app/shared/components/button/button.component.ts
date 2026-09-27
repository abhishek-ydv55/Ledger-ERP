import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="buttonClasses"
    >
      @if (loading) {
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 currentColor" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      }
      <ng-content></ng-content>
    </button>
  `
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: 'brass' | 'primary' | 'secondary' | 'danger' | 'outline' = 'brass';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;

  get buttonClasses(): string {
    const base = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-espresso-950 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm';
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-2.5 text-base'
    }[this.size];

    const variantClasses = {
      brass: 'bg-brass-500 hover:bg-brass-400 text-espresso-950 font-semibold focus:ring-brass-400 active:bg-brass-600 shadow-brass-500/10',
      primary: 'bg-brass-500 hover:bg-brass-400 text-espresso-950 font-semibold focus:ring-brass-400 active:bg-brass-600',
      secondary: 'bg-espresso-800 hover:bg-espresso-700 text-espresso-200 border border-espresso-700 focus:ring-espresso-600',
      danger: 'bg-danger-600 hover:bg-danger-500 text-white focus:ring-danger-500',
      outline: 'bg-transparent border border-espresso-700 text-espresso-300 hover:border-espresso-500 hover:text-white focus:ring-espresso-600'
    }[this.variant];

    const widthClass = this.fullWidth ? 'w-full' : '';

    return `${base} ${sizeClasses} ${variantClasses} ${widthClass}`;
  }
}
