import { Component, Host, Optional, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ConsoleLogger, ScopedLogger } from '@core/services/logger.service';
import { LOG_SINK, Logger } from '@core/tokens/logger.token';
import { ANALYTICS } from '@core/tokens/analytics.token';
import { FEATURE_FLAGS, provideFeatureFlags } from '@core/tokens/feature-flags.token';
import { PanelContextService } from './panel-context.service';

@Component({
  selector: 'app-probe',
  template: `<span>{{ context?.instanceId ?? 'none' }}</span>`,
})
class Probe {
  // eslint-disable-next-line @angular-eslint/prefer-inject
  constructor(@Host() @Optional() readonly context: PanelContextService | null) {}
}

@Component({
  selector: 'app-panel',
  imports: [Probe],
  // viewProviders — reachable by @Host() from inside this template.
  viewProviders: [PanelContextService],
  providers: [{ provide: Logger, useFactory: () => new ScopedLogger('panel') }],
  template: `<app-probe />`,
})
class Panel {
  readonly logger = inject(Logger);
  readonly parentLogger = inject(Logger, { skipSelf: true });
  readonly context = inject(PanelContextService);
}

@Component({
  imports: [Panel, Probe],
  template: `
    <app-panel />
    <app-panel />
    <app-probe />
  `,
})
class Host_ {}

describe('hierarchical dependency injection', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ConsoleLogger,
        { provide: Logger, useExisting: ConsoleLogger },
        ...provideFeatureFlags(
          { key: 'a', enabled: true },
          { key: 'b', enabled: false },
        ),
      ],
    });
  });

  it('gives each component-level provider its own instance', async () => {
    const fixture = TestBed.createComponent(Host_);
    await fixture.whenStable();

    const panels = fixture.debugElement.children
      .filter((child) => child.componentInstance instanceof Panel)
      .map((child) => child.componentInstance as Panel);

    expect(panels.length).toBe(2);
    expect(panels[0].context.instanceId).not.toBe(panels[1].context.instanceId);
  });

  it('shadows the root Logger inside the panel, and skipSelf walks past it', async () => {
    const fixture = TestBed.createComponent(Host_);
    await fixture.whenStable();

    const panel = fixture.debugElement.children.find(
      (child) => child.componentInstance instanceof Panel,
    )!.componentInstance as Panel;

    expect(panel.logger.scope).toBe('panel');
    expect(panel.parentLogger.scope).toBe('root');
  });

  it('resolves @Host() against viewProviders inside a panel, and null outside one', async () => {
    const fixture = TestBed.createComponent(Host_);
    await fixture.whenStable();

    const probes = fixture.debugElement
      .queryAll(By.directive(Probe))
      .map((debugElement) => debugElement.componentInstance as Probe);

    const inside = probes.filter((probe) => probe.context !== null);
    const outside = probes.filter((probe) => probe.context === null);

    expect(inside.length).toBe(2);
    expect(outside.length).toBe(1);
  });

  it('does not let @Host() see a plain `providers` entry', async () => {
    @Component({
      selector: 'app-plain-panel',
      imports: [Probe],
      // `providers`, not `viewProviders` — @Host() stops before reaching it.
      providers: [PanelContextService],
      template: `<app-probe />`,
    })
    class PlainPanel {}

    @Component({ imports: [PlainPanel], template: `<app-plain-panel />` })
    class PlainHost {}

    const fixture = TestBed.createComponent(PlainHost);
    await fixture.whenStable();

    const probe = fixture.debugElement.queryAll(By.directive(Probe))[0]
      .componentInstance as Probe;

    expect(probe.context).toBeNull();
  });

  it('resolves an unprovided token to null when optional', () => {
    expect(TestBed.inject(ANALYTICS, null, { optional: true })).toBeNull();
  });

  it('collects every multi provider into one array', () => {
    const flags = TestBed.inject(FEATURE_FLAGS);

    expect(flags.length).toBe(2);
    expect(flags.map((flag) => flag.key)).toEqual(['a', 'b']);
  });

  it('aliases Logger onto the ConsoleLogger singleton with useExisting', () => {
    expect(TestBed.inject(Logger)).toBe(TestBed.inject(ConsoleLogger));
  });

  it('shares one LOG_SINK array across every logger in the tree', () => {
    const sink = TestBed.inject(LOG_SINK);
    TestBed.inject(Logger).info('from root');

    expect(sink[0].message).toBe('from root');
    expect(sink[0].scope).toBe('root');
  });
});
