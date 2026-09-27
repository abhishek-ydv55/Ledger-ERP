import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, A11yModule],
  template: `
    @if (isOpen) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-300 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        (click)="onBackdropClick($event)"
        aria-modal="true"
        role="dialog"
      >
        <!-- Modal Card Container -->
        <div
          [class]="maxWidthClass"
          class="relative w-full bg-white dark:bg-espresso-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-espresso-700/80 overflow-hidden transform transition-all duration-300 animate-fade-in my-auto max-h-[90vh] flex flex-col"
          (click)="$event.stopPropagation()"
          cdkTrapFocus
        >
          <!-- Header -->
          @if (title || showClose) {
            <div class="px-6 py-4 border-b border-stone-200 dark:border-espresso-800 flex items-center justify-between shrink-0">
              <div>
                @if (title) {
                  <h3 class="text-base font-semibold text-stone-900 dark:text-stone-100">
                    {{ title }}
                  </h3>
                }
                @if (subtitle) {
                  <p class="text-xs text-stone-500 dark:text-espresso-400 mt-0.5">
                    {{ subtitle }}
                  </p>
                }
              </div>

              @if (showClose) {
                <button
                  (click)="close()"
                  type="button"
                  class="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-espresso-800 transition-colors"
                  aria-label="Close dialog"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              }
            </div>
          }

          <!-- Body -->
          <div class="p-6 overflow-y-auto flex-1">
            <ng-content></ng-content>
          </div>

          <!-- Footer slot (optional) -->
          <ng-content select="[modal-footer]"></ng-content>
        </div>
      </div>
    }
  `
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() showClose = true;
  @Input() closeOnBackdrop = true;
  @Input() maxWidth: 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'md';

  @Output() closeDialog = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.close();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop) {
      this.close();
    }
  }

  close(): void {
    this.closeDialog.emit();
  }

  get maxWidthClass(): string {
    switch (this.maxWidth) {
      case 'sm': return 'max-w-sm';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-xl';
      case '2xl': return 'max-w-2xl';
      case 'md':
      default: return 'max-w-md';
    }
  }
}
