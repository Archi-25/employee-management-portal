import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ProfilingService } from '@core/services/profiling.service';
import { EmployeeStore } from '@core/state/employee.store';
import { Card } from '@shared/components/card/card';
import { StatTile } from '@shared/components/stat-tile/stat-tile';
import { HasRoleDirective } from '@shared/directives/has-role.directive';
import { HighlightDirective } from '@shared/directives/highlight.directive';

interface ModuleLink {
  readonly module: string;
  readonly title: string;
  readonly blurb: string;
  readonly route: string;
}

const MODULE_LINKS: readonly ModuleLink[] = [
  {
    module: '1',
    title: 'Data binding & templates',
    blurb: '@Input/@Output, ViewChild/ViewChildren, local refs, ng-content.',
    route: '/employees',
  },
  {
    module: '1',
    title: 'View encapsulation',
    blurb: 'Emulated vs None vs ShadowDom, side by side.',
    route: '/employees/encapsulation',
  },
  {
    module: '2',
    title: 'Custom directives',
    blurb: 'Role-based structural directive, Renderer2, HostListener, HostBinding.',
    route: '/directives',
  },
  {
    module: '3',
    title: 'Change detection',
    blurb: 'Default vs OnPush with live check counters and the performance levers.',
    route: '/employees/change-detection',
  },
  {
    module: '4',
    title: 'Advanced routing',
    blurb: 'Lazy NgModule, three levels of nested routes, guards and resolvers.',
    route: '/admin',
  },
  {
    module: '5',
    title: 'Dependency injection',
    blurb: 'Hierarchical injectors, every provider kind, @Optional/@Host/@Self.',
    route: '/di',
  },
  {
    module: '6',
    title: 'RxJS',
    blurb: 'Custom observable, explicit observer, map/filter/takeUntil.',
    route: '/rxjs',
  },
  {
    module: '7',
    title: 'Security',
    blurb: 'DomSanitizer, contexts, and what stops an XSS payload.',
    route: '/security',
  },
  {
    module: '8',
    title: 'HTTP interceptors',
    blurb: 'Auth, error, caching and profiling, with a live request table.',
    route: '/admin/interceptors',
  },
  {
    module: '9',
    title: 'Modern Angular',
    blurb: 'Standalone, signals, i18n, SSR, state management, Nx.',
    route: '/modern',
  },
];

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Card, StatTile, HasRoleDirective, HighlightDirective],
  template: `
    <header class="page-head">
      <h1 i18n="@@dashboard.title">Employee Management Portal</h1>
      <p i18n="@@dashboard.subtitle">
        An enterprise Angular reference application. Every assessment module is implemented as a
        working screen, not a snippet.
      </p>
    </header>

    <div class="tiles">
      <app-stat-tile label="Headcount" i18n-label="@@tile.headcount" [value]="store.total()" accent="#6366f1" />
      <app-stat-tile label="Active" i18n-label="@@tile.active" [value]="store.activeCount()" accent="#16a34a" />
      <app-stat-tile
        label="Annual payroll"
        [value]="store.payrollTotal()"
        [currency]="true"
        accent="#f59e0b"
      />
      <app-stat-tile label="HTTP requests" [value]="profiling.requestCount()" accent="#0ea5e9" />
    </div>

    <div *appHasRole="'EMPLOYEE'; else: signedOut" class="welcome">
      Signed in as <strong>{{ auth.displayName() }}</strong> ({{ auth.role() }}).
    </div>
    <ng-template #signedOut>
      <div class="welcome welcome--muted">
        Browsing as a guest — <a routerLink="/login">sign in</a> to unlock the manager and admin
        areas.
      </div>
    </ng-template>

    <div class="grid">
      @for (link of moduleLinks; track link.route + link.title) {
        <a class="module" [routerLink]="link.route" [appHighlight]="'#f8fafc'" [highlightLabel]="link.title">
          <span class="module__badge">Module {{ link.module }}</span>
          <strong class="module__title">{{ link.title }}</strong>
          <span class="module__blurb">{{ link.blurb }}</span>
        </a>
      }
    </div>

    <app-card heading="How the data flows" subtitle="Nothing here is mocked at the component level">
      <ol class="flow">
        <li>A component calls the <code>EmployeeStore</code> (NgRx SignalStore).</li>
        <li>The store calls <code>EmployeeService</code>, which uses <code>HttpClient</code>.</li>
        <li>The request passes profiling → auth → cache → error interceptors.</li>
        <li><code>mockBackendInterceptor</code> answers it from memory.</li>
        <li>The response updates store signals; every OnPush view re-renders itself.</li>
      </ol>
    </app-card>
  `,
  styleUrl: './dashboard.css',
})
export class Dashboard {
  protected readonly store = inject(EmployeeStore);
  protected readonly auth = inject(AuthService);
  protected readonly profiling = inject(ProfilingService);
  protected readonly moduleLinks = MODULE_LINKS;
}
