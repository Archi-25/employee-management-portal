import { InjectionToken } from '@angular/core';

export interface AnalyticsSink {
  track(event: string, payload?: Record<string, unknown>): void;
}

/**
 * MODULE 5 — deliberately NOT provided at root. Components inject it with
 * `@Optional()` so the application keeps working when no sink is configured.
 */
export const ANALYTICS = new InjectionToken<AnalyticsSink>('ANALYTICS');
