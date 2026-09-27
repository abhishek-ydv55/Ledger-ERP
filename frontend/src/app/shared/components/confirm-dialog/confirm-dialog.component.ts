import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent],
  template: `
    <app-modal
      [isOpen]="isOpen"
      [title]="title"
      [maxWidth]="'sm'"
      (closeDialog)="onCancel()"
    >
      <div class="flex items-start space-x-4">
        <!-- Icon -->
        <div [class]="iconBgClasses" class="w-10 h-10 rounded-full flex items-center justify-center shrink-0">
          @if (variant === 'danger') {
            <svg class="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          } @else if (variant === 'warning') {
            <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          } @else {
            <svg class="w-5 h-5 text-brass-600 dark:text-brass-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          }
        </div>

        <!-- Message -->
        <div class="flex-1 pt-0.5">
          <p class="text-xs text-stone-600 dark:text-espresso-300 leading-relaxed">
            {{ message }}
          </p>
        </div>
      </div>

      <!-- Modal Footer -->
      <div modal-footer class="px-6 py-3.5 bg-stone-50 dark:bg-espresso-950/60 border-t border-stone-200 dark:border-espresso-800 flex items-center justify-end space-x-3">
        <app-button
          variant="outline"
          size="sm"
          [disabled]="loading"
          (click)="onCancel()"
        >
          {{ cancelText }}
        </app-button>

        <app-button
          [variant]="buttonVariant"
          size="sm"
          [loading]="loading"
          (click)="onConfirm()"
        >
          {{ confirmText }}
        </app-button>
      </div>
    </app-modal>
  `
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed with this operation?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() variant: 'danger' | 'warning' | 'brass' = 'danger';
  @Input() loading = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }

  get iconBgClasses(): string {
    switch (this.variant) {
      case 'danger': return 'bg-rose-100 dark:bg-rose-950/50';
      case 'warning': return 'bg-amber-100 dark:bg-amber-950/50';
      case 'brass':
      default: return 'bg-brass-100 dark:bg-brass-950/50';
    }
  }

  get buttonVariant(): 'danger' | 'brass' | 'primary' | 'secondary' | 'outline' {
    if (this.variant === 'danger') return 'danger';
    return 'brass';
  }
}
