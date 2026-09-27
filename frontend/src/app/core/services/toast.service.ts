import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(type: ToastType, message: string, title?: string, duration = 5000): string {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const toast: Toast = { id, type, title, message, duration };

    this.toasts.update(current => [...current, toast]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  success(message: string, title?: string, duration?: number): string {
    return this.show('success', message, title || 'Success', duration);
  }

  error(message: string, title?: string, duration?: number): string {
    return this.show('error', message, title || 'Error', duration);
  }

  warning(message: string, title?: string, duration?: number): string {
    return this.show('warning', message, title || 'Warning', duration);
  }

  info(message: string, title?: string, duration?: number): string {
    return this.show('info', message, title || 'Information', duration);
  }

  remove(id: string): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
