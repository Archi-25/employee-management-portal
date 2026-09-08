import { InjectionToken } from '@angular/core';

export interface AppConfig {
  readonly appName: string;
  readonly apiBaseUrl: string;
  readonly httpCacheTtlMs: number;
  readonly defaultPageSize: number;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: (): AppConfig => ({
    appName: 'Employee Management Portal',
    apiBaseUrl: '/api',
    httpCacheTtlMs: 30_000,
    defaultPageSize: 10,
  }),
});
