import { ChangeDetectionStrategy, Component, Host, Optional, inject } from '@angular/core';
import { ANALYTICS, AnalyticsSink } from '@core/tokens/analytics.token';
import { APP_CONFIG } from '@core/tokens/app-config.token';
import { FEATURE_FLAGS, provideFeatureFlags } from '@core/tokens/feature-flags.token';
import { LOG_SINK, Logger } from '@core/tokens/logger.token';
import { ConsoleLogger, scopedLoggerFactory } from '@core/services/logger.service';
import { Card } from '@shared/components/card/card';
import { PanelContextService } from './panel-context.service';

/**
 * MODULE 5 — a child that asks for `PanelContextService` with `@Host()`.
 *
 * `@Host()` stops the lookup at the boundary of the view this element lives in.
 * It therefore resolves providers the host component declared in
 * `viewProviders`, but NOT ones it declared in `providers` — that is the whole
 * difference between the two arrays, and it is why `DiPanel` below uses
 * `viewProviders`. The lookup never reaches the root injector.
 *
 * Combined with `@Optional()` it degrades to `null` instead of throwing
 * `NullInjectorError` when the probe is used outside a panel.
 */
@Component({
  selector: 'app-host-probe',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="probe" [class.probe--miss]="!context">
      <strong>&#64;Host() + &#64;Optional()</strong>
      @if (context) {
        <span>resolved PanelContextService #{{ context.instanceId }} ({{ context.label() }})</span>
        <span class="probe__why">found via the panel's <code>viewProviders</code></span>
      } @else {
        <span>not found — no panel above this probe, and it survived that.</span>
        <span class="probe__why">&#64;Optional() turned the miss into <code>null</code></span>
      }
    </div>
  `,
  styles: `
    .probe {
      border-radius: 8px;
      padding: 0.5rem 0.65rem;
      font-size: 0.82rem;
      background: #dcfce7;
      color: #14532d;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .probe--miss { background: #fee2e2; color: #7f1d1d; }
    .probe__why { font-size: 0.74rem; opacity: 0.75; }
  `,
})
export class HostProbe {
  // Constructor injection on purpose: `@Host()` and `@Optional()` are parameter
  // decorators, and showing them is the point of this component. The equivalent
  // functional form is `inject(PanelContextService, { host: true, optional: true })`.
  // eslint-disable-next-line @angular-eslint/prefer-inject
  constructor(@Host() @Optional() readonly context: PanelContextService | null) {}
}

/**
 * MODULE 5 — a panel that provides its own `PanelContextService` and `Logger`.
 * Every child below it resolves those instances instead of the root ones: that
 * is hierarchical injection.
 *
 * `PanelContextService` goes in `viewProviders` so the `@Host()` probe in this
 * component's template can reach it. `Logger` goes in `providers`, which is the
 * wider scope: it also covers content projected in from a parent.
 */
@Component({
  selector: 'app-di-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HostProbe],
  // Visible to this component's own template — what `@Host()` can see.
  viewProviders: [PanelContextService],
  // Visible to the template AND to projected content.
  // `useFactory` — build the dependency at injection time.
  providers: [{ provide: Logger, useFactory: scopedLoggerFactory('di-panel') }],
  template: `
    <div class="panel">
      <p class="panel__meta">
        Panel injector · context #{{ context.instanceId }} · logger scope
        <code>{{ logger.scope }}</code> · parent scope via skipSelf
        <code>{{ parentLogger.scope }}</code>
      </p>
      <app-host-probe />
      <button type="button" class="btn btn--ghost btn--sm" (click)="emit()">
        Log from panel scope
      </button>
    </div>
  `,
  styles: `
    .panel {
      border: 1px dashed var(--accent);
      border-radius: 10px;
      padding: 0.8rem;
      display: grid;
      gap: 0.55rem;
    }
    .panel__meta { margin: 0; font-size: 0.8rem; color: var(--muted); }
  `,
})
export class DiPanel {
  readonly context = inject(PanelContextService);

  constructor() {
    this.context.label.set('panel-alpha');
  }

  readonly logger = inject(Logger);

  /**
   * `skipSelf` starts the lookup at the PARENT injector, so it walks past this
   * component's own `Logger` provider and lands on the root `ConsoleLogger`.
   */
  readonly parentLogger = inject(Logger, { skipSelf: true });

  emit(): void {
    this.logger.info(`Panel #${this.context.instanceId} emitted an entry`);
    this.context.record('log emitted');
  }
}

@Component({
  selector: 'app-di-lab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, DiPanel, HostProbe],
  providers: [
    // MODULE 5 — `multi: true`: this route contributes flags of its own.
    ...provideFeatureFlags(
      { key: 'di.diagnostics', enabled: true },
      { key: 'di.experimental-scopes', enabled: false },
    ),
  ],
  templateUrl: './di-lab.html',
  styleUrl: './di-lab.css',
})
export class DiLab {
  protected readonly config = inject(APP_CONFIG);
  protected readonly logSink = inject(LOG_SINK);
  protected readonly rootLogger = inject(Logger);
  protected readonly flags = inject(FEATURE_FLAGS, { optional: true }) ?? [];

  /**
   * MODULE 5 — `@Optional()` in its `inject()` form. `ANALYTICS` is never
   * provided anywhere, so this resolves to `null` instead of throwing.
   */
  protected readonly analytics = inject<AnalyticsSink | null>(ANALYTICS, { optional: true });

  /** `useExisting` alias proves both tokens resolve to the SAME instance. */
  protected readonly aliasedLogger = inject(ConsoleLogger);
  protected readonly sameInstance = this.rootLogger === this.aliasedLogger;

  protected logFromRoot(): void {
    this.rootLogger.info('Entry written through the root injector');
  }
}
