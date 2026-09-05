import { HttpClient, HttpContext } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CACHE_BYPASS } from '@core/interceptors/cache.context';
import { clearHttpCache, httpCacheSize } from '@core/interceptors/cache.interceptor';
import { AuthService } from '@core/services/auth.service';
import { EmployeeService } from '@core/services/employee.service';
import { ProfilingService } from '@core/services/profiling.service';
import { APP_CONFIG } from '@core/tokens/app-config.token';
import { Card } from '@shared/components/card/card';
import { StatTile } from '@shared/components/stat-tile/stat-tile';

/**
 * MODULE 8 — the interceptor console.
 *
 * Chain order (registered in `app.config.ts`, outermost first):
 *   profiling → auth → cache → error → mockBackend
 *
 * Profiling wraps everything, so it can time a cache hit. Cache sits inside auth
 * so cached entries are already role-tagged. Error sits closest to the backend so
 * it sees the raw failure before anything else transforms it.
 */
@Component({
  selector: 'app-admin-interceptors',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, Card, StatTile],
  template: `
    <div class="tiles">
      <app-stat-tile label="Requests observed" [value]="profiling.requestCount()" accent="#6366f1" />
      <app-stat-tile label="Average latency" [value]="profiling.averageMs() + ' ms'" accent="#f59e0b" />
      <app-stat-tile label="Cache hits" [value]="profiling.cacheHits()" accent="#16a34a" />
      <app-stat-tile label="Cached entries" [value]="cacheSize()" accent="#0ea5e9" />
    </div>

    <app-card heading="Chain" subtitle="Outermost first — order is the registration order">
      <ol class="chain">
        <li><code>profilingInterceptor</code> — starts a timer, records on <code>finalize</code></li>
        <li><code>authInterceptor</code> — clones the request with the bearer token and role header</li>
        <li><code>cacheInterceptor</code> — serves fresh GETs from memory, invalidates on writes</li>
        <li><code>errorInterceptor</code> — normalises failures, raises one toast, re-throws</li>
        <li><code>mockBackendInterceptor</code> — terminates the chain (stands in for a server)</li>
      </ol>
      <p class="hint">
        Current token: <code>{{ auth.token() ?? 'none — sign in to see the Authorization header' }}</code>
      </p>
    </app-card>

    <app-card heading="Try it" subtitle="Each button exercises a different interceptor">
      <div class="row">
        <button type="button" class="btn" (click)="fetch()">GET /api/employees</button>
        <button type="button" class="btn btn--ghost" (click)="fetch()">
          Repeat (should hit the cache)
        </button>
        <button type="button" class="btn btn--ghost" (click)="fetchBypassingCache()">
          GET with CACHE_BYPASS
        </button>
        <button type="button" class="btn btn--danger" (click)="triggerError()">
          GET /api/boom (500)
        </button>
        <button type="button" class="btn btn--ghost" (click)="clearCache()">Clear cache</button>
        <button type="button" class="btn btn--ghost" (click)="profiling.clear()">
          Clear timings
        </button>
      </div>
      @if (lastResult(); as result) {
        <p class="result">{{ result }}</p>
      }
    </app-card>

    <app-card heading="Profiling table" subtitle="Recorded by profilingInterceptor">
      @if (profiling.timings().length) {
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Time</th><th>Method</th><th>URL</th><th>Status</th><th>Duration</th></tr>
            </thead>
            <tbody>
              @for (timing of profiling.timings(); track timing.id) {
                <tr [class.is-cache]="timing.status === 'CACHE'" [class.is-error]="timing.status === 'ERROR'">
                  <td>{{ timing.at | date: 'HH:mm:ss' }}</td>
                  <td><code>{{ timing.method }}</code></td>
                  <td class="url">{{ timing.url }}</td>
                  <td>{{ timing.status }}</td>
                  <td class="num">{{ timing.durationMs }} ms</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <p class="hint">No requests recorded yet.</p>
      }
    </app-card>
  `,
  styles: `
    :host { display: block; display: grid; gap: 1rem; }
    .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; }
    .chain { margin: 0 0 0.6rem; padding-left: 1.2rem; display: grid; gap: 0.3rem; font-size: 0.85rem; }
    .result {
      margin: 0.7rem 0 0;
      font-size: 0.83rem;
      background: var(--surface-2);
      border-radius: 8px;
      padding: 0.45rem 0.6rem;
    }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
    th, td { text-align: left; padding: 0.35rem 0.5rem; border-bottom: 1px solid var(--border); }
    th { color: var(--muted); font-weight: 500; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .url { max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    tr.is-cache { background: #f0fdf4; }
    tr.is-error { background: #fef2f2; }
  `,
})
export class AdminInterceptors {
  protected readonly profiling = inject(ProfilingService);
  protected readonly auth = inject(AuthService);
  private readonly employees = inject(EmployeeService);
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  protected readonly lastResult = signal<string | null>(null);
  protected readonly cacheSize = signal(httpCacheSize());

  protected fetch(): void {
    this.employees.list().subscribe({
      next: (employees) => {
        this.lastResult.set(`200 · ${employees.length} employees returned`);
        this.cacheSize.set(httpCacheSize());
      },
      error: () => this.lastResult.set('Request failed — see the toast'),
    });
  }

  /** `HttpContext` lets a single call opt out of the cache interceptor. */
  protected fetchBypassingCache(): void {
    this.http
      .get(`${this.config.apiBaseUrl}/employees`, {
        context: new HttpContext().set(CACHE_BYPASS, true),
      })
      .subscribe({
        next: () => this.lastResult.set('200 · forced a network round trip'),
        error: () => this.lastResult.set('Request failed — see the toast'),
      });
  }

  protected triggerError(): void {
    this.http.get(`${this.config.apiBaseUrl}/boom`).subscribe({
      next: () => this.lastResult.set('Unexpected success'),
      error: (error: { status: number; message: string }) =>
        this.lastResult.set(`${error.status} · ${error.message}`),
    });
  }

  protected clearCache(): void {
    clearHttpCache();
    this.cacheSize.set(httpCacheSize());
    this.lastResult.set('HTTP cache cleared');
  }
}
