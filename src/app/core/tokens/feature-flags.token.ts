import { InjectionToken, Provider } from '@angular/core';

export interface FeatureFlag {
  readonly key: string;
  readonly enabled: boolean;
}

export const FEATURE_FLAGS = new InjectionToken<readonly FeatureFlag[]>('FEATURE_FLAGS');

export function provideFeatureFlags(...flags: FeatureFlag[]): Provider[] {
  return flags.map((flag) => ({ provide: FEATURE_FLAGS, useValue: flag, multi: true }));
}
