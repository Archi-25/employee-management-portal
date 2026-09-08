import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'emp-portal-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly current = signal<ThemePreference>(this.restore());
  readonly preference = this.current.asReadonly();

  constructor() {
    effect(() => this.apply(this.current()));
  }

  set(preference: ThemePreference): void {
    this.current.set(preference);
  }

  cycle(): void {
    const order: ThemePreference[] = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(this.current()) + 1) % order.length];
    this.current.set(next);
  }

  private restore(): ThemePreference {
    if (!this.isBrowser) {
      return 'system';
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'light' || stored === 'dark' ? stored : 'system';
    } catch {
      // Private browsing or blocked storage — fall back to the OS setting.
      return 'system';
    }
  }

  private apply(preference: ThemePreference): void {
    if (!this.isBrowser) {
      return;
    }
    const root = this.document.documentElement;
    if (preference === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', preference);
    }
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // Persisting is a convenience; the applied theme still holds this session.
    }
  }
}
