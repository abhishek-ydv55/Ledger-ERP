import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-form-dialog',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent],
  template: `
    <app-modal
      [isOpen]="isOpen"
      [title]="title"
      [subtitle]="subtitle"
      [maxWidth]="maxWidth"
      (closeDialog)="onCancel()"
    >
      <form (submit)="onSubmit($event)" class="space-y-4">
        <!-- Content Projection for form fields -->
        <ng-content></ng-content>

        <!-- Footer -->
        <div modal-footer class="px-6 py-4 bg-stone-50 dark:bg-espresso-950/60 border-t border-stone-200 dark:border-espresso-800 flex items-center justify-end space-x-3 mt-4">
          <app-button
            variant="outline"
            type="button"
            size="sm"
            [disabled]="loading"
            (click)="onCancel()"
          >
            {{ cancelText }}
          </app-button>

          <app-button
            variant="brass"
            type="submit"
            size="sm"
            [loading]="loading"
            [disabled]="submitDisabled"
          >
            {{ submitText }}
          </app-button>
        </div>
      </form>
    </app-modal>
  `
})
export class FormDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Form Dialog';
  @Input() subtitle?: string;
  @Input() submitText = 'Save';
  @Input() cancelText = 'Cancel';
  @Input() loading = false;
  @Input() submitDisabled = false;
  @Input() maxWidth: 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'lg';

  @Output() formSubmit = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.submitDisabled && !this.loading) {
      this.formSubmit.emit();
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
