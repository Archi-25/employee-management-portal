import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { FEATURE_FLAGS } from '@core/tokens/feature-flags.token';
import { Logger } from '@core/tokens/logger.token';

/**
 * MODULE 4 — the parent of the nested admin routes. Its `<router-outlet>` is
 * where every child renders, and the shell itself is never re-created while
 * navigating between children.
 */
@Component({
  selector: 'app-admin-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <header class="page-head">
      <h1>Administration</h1>
      <p>
        Lazy-loaded <code>AdminModule</code> — its own chunk, its own environment injector
        (<code>Logger</code> scope <code>{{ logger.scope }}</code>), and its own nested routes.
      </p>
    </header>

    <nav class="subnav">
      <a routerLink="overview" routerLinkActive="is-active">Overview</a>
      <a routerLink="teams" routerLinkActive="is-active">Teams</a>
      <a routerLink="interceptors" routerLinkActive="is-active">HTTP</a>
      <a routerLink="audit" routerLinkActive="is-active">Audit log</a>
      @if (auth.hasRole('ADMIN')) {
        <a routerLink="settings" routerLinkActive="is-active">Settings</a>
      }
      <span class="spacer"></span>
      <span class="flags">{{ enabledFlags }} feature flags enabled</span>
    </nav>

    <!-- Child routes render here -->
    <router-outlet />
  `,
  styles: `
    :host { display: block; }
    .subnav {
      display: flex;
      gap: 0.35rem;
      align-items: center;
      border-bottom: 1px solid var(--border);
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      flex-wrap: wrap;
    }
    .subnav a {
      padding: 0.35rem 0.7rem;
      border-radius: 7px;
      font-size: 0.85rem;
      text-decoration: none;
      color: var(--muted);
    }
    .subnav a:hover { background: var(--surface-2); color: var(--text); }
    .subnav a.is-active { background: var(--accent); color: #fff; }
    .spacer { flex: 1; }
    .flags { font-size: 0.75rem; color: var(--muted); }
  `,
})
export class AdminShell {
  protected readonly auth = inject(AuthService);
  /** Resolves to the module-scoped logger, not the root one (MODULE 5). */
  protected readonly logger = inject(Logger);

  private readonly flags = inject(FEATURE_FLAGS, { optional: true }) ?? [];
  protected readonly enabledFlags = this.flags.filter((flag) => flag.enabled).length;
}
