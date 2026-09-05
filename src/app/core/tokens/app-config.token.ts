import { InjectionToken } from '@angular/core';

export interface AppConfig {
  readonly appName: string;
  readonly apiBaseUrl: string;
  /** Lifetime of a cached GET response, in milliseconds. */
  readonly httpCacheTtlMs: number;
  readonly defaultPageSize: number;
}

/**
 * MODULE 5 — `useValue` provider behind an `InjectionToken`.
 * A token (not a string) keeps the dependency type-safe and tree-shakable.
 */
export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: (): AppConfig => ({
    appName: 'Employee Management Portal',
    apiBaseUrl: '/api',
    httpCacheTtlMs: 30_000,
    defaultPageSize: 10,
  }),
});
