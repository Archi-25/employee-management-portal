import { InjectionToken, Provider } from '@angular/core';

export interface FeatureFlag {
  readonly key: string;
  readonly enabled: boolean;
}

/**
 * MODULE 5 — `multi: true` provider. Every contributor appends to one array,
 * so a lazy feature can register its own flags without touching the root config.
 */
export const FEATURE_FLAGS = new InjectionToken<readonly FeatureFlag[]>('FEATURE_FLAGS');

export function provideFeatureFlags(...flags: FeatureFlag[]): Provider[] {
  return flags.map((flag) => ({ provide: FEATURE_FLAGS, useValue: flag, multi: true }));
}
