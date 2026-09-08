import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ConsoleLogger, ScopedLogger } from '@core/services/logger.service';
import { ANALYTICS } from '@core/tokens/analytics.token';
import { APP_CONFIG } from '@core/tokens/app-config.token';
import { FEATURE_FLAGS, provideFeatureFlags } from '@core/tokens/feature-flags.token';
import { LOG_SINK, Logger } from '@core/tokens/logger.token';

@Component({
  selector: 'app-scoped-area',
  providers: [{ provide: Logger, useFactory: () => new ScopedLogger('admin') }],
  template: `<span>{{ logger.scope }}</span>`,
})
class ScopedArea {
  readonly logger = inject(Logger);
  readonly rootLogger = inject(Logger, { skipSelf: true });
}

@Component({ imports: [ScopedArea], template: `<app-scoped-area /><app-scoped-area />` })
class ScopeHost {}

describe('injector configuration', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ConsoleLogger,
        { provide: Logger, useExisting: ConsoleLogger },
        ...provideFeatureFlags(
          { key: 'portal.dark-mode', enabled: true },
          { key: 'portal.beta-search', enabled: false },
        ),
      ],
    });
  });

  it('resolves APP_CONFIG from its useValue factory', () => {
    const config = TestBed.inject(APP_CONFIG);

    expect(config.apiBaseUrl).toBe('/api');
    expect(config.defaultPageSize).toBeGreaterThan(0);
  });

  it('aliases Logger onto the ConsoleLogger singleton with useExisting', () => {
    expect(TestBed.inject(Logger)).toBe(TestBed.inject(ConsoleLogger));
  });

  it('collects every multi provider into a single array', () => {
    const flags = TestBed.inject(FEATURE_FLAGS);

    expect(flags.map((flag) => flag.key)).toEqual(['portal.dark-mode', 'portal.beta-search']);
  });

  it('returns null for an optional token that is never provided', () => {
    expect(TestBed.inject(ANALYTICS, null, { optional: true })).toBeNull();
  });

  it('shares one LOG_SINK across every logger in the tree', () => {
    const sink = TestBed.inject(LOG_SINK);
    TestBed.inject(Logger).info('directory loaded');

    expect(sink[0]).toMatchObject({ message: 'directory loaded', scope: 'root' });
  });

  it('lets a component-level provider shadow the root one', async () => {
    const fixture = TestBed.createComponent(ScopeHost);
    await fixture.whenStable();

    const areas = fixture.debugElement
      .queryAll(By.directive(ScopedArea))
      .map((debugElement) => debugElement.componentInstance as ScopedArea);

    expect(areas.length).toBe(2);
    for (const area of areas) {
      expect(area.logger.scope).toBe('admin');
      // skipSelf steps over the local provider and lands on the root logger.
      expect(area.rootLogger.scope).toBe('root');
    }
  });
});
