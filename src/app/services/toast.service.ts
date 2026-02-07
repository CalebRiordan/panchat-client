import { Injectable, signal } from '@angular/core';

interface Toast {
  id: number;
  message: string;
  type: 'error' | 'success' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(message: string, type: Toast['type'] = 'error') {
    const id = Date.now();
    this.toasts.update((t) => [...t, { message, type, id }]);

    setTimeout(() => this.remove(id), 3000);
  }

  remove(id: number) {
    this.toasts.update((t) => t.filter((toast) => toast.id !== id));
  }
}
