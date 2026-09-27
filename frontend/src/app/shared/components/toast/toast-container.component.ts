import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-md w-full pointer-events-none px-4 sm:px-0"
      aria-live="polite"
      aria-atomic="true"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          [class]="getToastClasses(toast.type)"
          class="pointer-events-auto flex items-start p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-fade-in"
          role="alert"
        >
          <!-- Icon -->
          <div class="shrink-0 mr-3 mt-0.5">
            @switch (toast.type) {
              @case ('success') {
                <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              }
              @case ('error') {
                <svg class="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              }
              @case ('warning') {
                <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              }
              @case ('info') {
                <svg class="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              }
            }
          </div>

          <!-- Content -->
          <div class="flex-1 mr-2 overflow-hidden">
            @if (toast.title) {
              <h4 class="text-xs font-semibold uppercase tracking-wider mb-0.5 text-stone-900 dark:text-stone-100">
                {{ toast.title }}
              </h4>
            }
            <p class="text-xs text-stone-600 dark:text-espresso-300 leading-relaxed break-words">
              {{ toast.message }}
            </p>
          </div>

          <!-- Close Button -->
          <button
            (click)="toastService.remove(toast.id)"
            type="button"
            class="shrink-0 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-md transition-colors"
            aria-label="Close notification"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  getToastClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-white dark:bg-espresso-900 border-emerald-500/30 text-stone-900 dark:text-stone-100';
      case 'error':
        return 'bg-white dark:bg-espresso-900 border-rose-500/30 text-stone-900 dark:text-stone-100';
      case 'warning':
        return 'bg-white dark:bg-espresso-900 border-amber-500/30 text-stone-900 dark:text-stone-100';
      case 'info':
      default:
        return 'bg-white dark:bg-espresso-900 border-sky-500/30 text-stone-900 dark:text-stone-100';
    }
  }
}
