import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const AUTO_DISMISS_MS = 4000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 1;
  private readonly items = signal<Toast[]>([]);
  readonly toasts = this.items.asReadonly();

  success(message: string): void {
    this.push('success', message);
  }
  error(message: string): void {
    this.push('error', message);
  }
  info(message: string): void {
    this.push('info', message);
  }

  dismiss(id: number): void {
    this.items.update((list) => list.filter((toast) => toast.id !== id));
  }

  private push(kind: ToastKind, message: string): void {
    const toast: Toast = { id: this.nextId++, kind, message };
    this.items.update((list) => [...list, toast]);
    if (typeof setTimeout === 'function') {
      setTimeout(() => this.dismiss(toast.id), AUTO_DISMISS_MS);
    }
  }
}
