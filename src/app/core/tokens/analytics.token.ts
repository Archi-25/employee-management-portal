import { InjectionToken } from '@angular/core';

export interface AnalyticsSink {
  track(event: string, payload?: Record<string, unknown>): void;
}

export const ANALYTICS = new InjectionToken<AnalyticsSink>('ANALYTICS');
