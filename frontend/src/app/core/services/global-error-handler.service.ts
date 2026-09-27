import { ErrorHandler, Injectable, NgZone, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandler implements ErrorHandler {
  private readonly zone = inject(NgZone);
  private readonly toast = inject(ToastService);

  handleError(error: any): void {
    // Log unhandled runtime exception to console
    console.error('Unhandled Application Exception caught by GlobalErrorHandler:', error);

    const message = error?.message || (typeof error === 'string' ? error : 'An unexpected error occurred in the application');

    // Run within Angular Zone to ensure toast UI updates cleanly
    this.zone.run(() => {
      this.toast.error(message, 'Application Error');
    });
  }
}
