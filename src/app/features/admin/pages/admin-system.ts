import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { clearHttpCache, httpCacheSize } from '@core/interceptors/cache.interceptor';
import { AuthService } from '@core/services/auth.service';
import { ProfilingService } from '@core/services/profiling.service';
import { APP_CONFIG } from '@core/tokens/app-config.token';
import { Card } from '@shared/components/card/card';
import { StatTile } from '@shared/components/stat-tile/stat-tile';
import { FeatureFlagDirective } from '@shared/directives/feature-flag.directive';

/**
 * System health — the operational view an administrator uses to see whether the
 * portal's API layer is behaving: request volume, latency, cache effectiveness
 * and recent failures. The numbers are collected by the HTTP interceptors.
 */
@Component({
  selector: 'app-admin-system',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, Card, StatTile, FeatureFlagDirective],
  template: `
    <div class="tiles">
      <app-stat-tile label="Requests" [value]="profiling.requestCount()" accent="var(--accent)" />
      <app-stat-tile
        label="Average latency"
        [value]="profiling.averageMs() + ' ms'"
        accent="var(--accent)"
      />
      <app-stat-tile
        label="Cache hits"
        [value]="profiling.cacheHits()"
        hint="served without a round trip"
        accent="var(--good)"
      />
      <app-stat-tile label="Cached entries" [value]="cacheSize()" accent="var(--accent)" />
    </div>

    <app-card heading="Configuration" subtitle="Resolved from APP_CONFIG">
      <div card-actions class="row">
        <button type="button" class="btn btn--ghost btn--sm" (click)="clearCache()">
          Clear cache
        </button>
        <button type="button" class="btn btn--ghost btn--sm" (click)="profiling.clear()">
          Reset metrics
        </button>
        <!-- Hidden until the flag is switched on for this environment. -->
        <button *appFeatureFlag="'admin.payroll-export'" type="button" class="btn btn--sm">
          Export payroll
        </button>
      </div>

      <dl class="kv">
        <div>
          <dt>API base</dt>
          <dd>
            <code>{{ config.apiBaseUrl }}</code>
          </dd>
        </div>
        <div>
          <dt>Cache TTL</dt>
          <dd>{{ config.httpCacheTtlMs }} ms</dd>
        </div>
        <div>
          <dt>Page size</dt>
          <dd>{{ config.defaultPageSize }}</dd>
        </div>
        <div>
          <dt>Signed in as</dt>
          <dd>{{ auth.displayName() }} ({{ auth.role() }})</dd>
        </div>
      </dl>
    </app-card>

    <app-card heading="Recent requests" subtitle="Newest first">
      @if (profiling.timings().length) {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Method</th>
                <th>Endpoint</th>
                <th>Status</th>
                <th class="num">Duration</th>
              </tr>
            </thead>
            <tbody>
              @for (timing of profiling.timings(); track timing.id) {
                <tr
                  [class.is-cache]="timing.status === 'CACHE'"
                  [class.is-error]="timing.status === 'ERROR'"
                >
                  <td>{{ timing.at | date: 'HH:mm:ss' }}</td>
                  <td>
                    <code>{{ timing.method }}</code>
                  </td>
                  <td class="url">{{ timing.url }}</td>
                  <td>{{ timing.status }}</td>
                  <td class="num">{{ timing.durationMs }} ms</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <p class="hint">No requests recorded yet — browse the directory and come back.</p>
      }
    </app-card>
  `,
  styles: `
    :host {
      display: block;
      display: grid;
      gap: 1rem;
    }
    .tiles {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 0.75rem;
    }
    .kv {
      margin: 0;
      display: grid;
      gap: 0.4rem;
    }
    .kv div {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      font-size: 0.85rem;
    }
    .kv dt {
      color: var(--muted);
    }
    .kv dd {
      margin: 0;
      font-weight: 600;
    }
    .table-wrap {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
    }
    th,
    td {
      text-align: left;
      padding: 0.35rem 0.5rem;
      border-bottom: 1px solid var(--border);
    }
    th {
      color: var(--muted);
      font-weight: 500;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .url {
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .num {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    tr.is-cache {
      background: #f0fdf4;
    }
    tr.is-error {
      background: #fef2f2;
    }
  `,
})
export class AdminSystem {
  protected readonly profiling = inject(ProfilingService);
  protected readonly auth = inject(AuthService);
  protected readonly config = inject(APP_CONFIG);
  protected readonly cacheSize = signal(httpCacheSize());

  protected clearCache(): void {
    clearHttpCache();
    this.cacheSize.set(httpCacheSize());
  }
}
