import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ROLES, Role } from '@core/models/employee.model';
import { AuthService } from '@core/services/auth.service';
import { APP_CONFIG } from '@core/tokens/app-config.token';
import { FEATURE_FLAGS } from '@core/tokens/feature-flags.token';
import { Card } from '@shared/components/card/card';

/** Reachable only by ADMIN — guarded by `roleGuard('ADMIN')` on the route. */
@Component({
  selector: 'app-admin-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card],
  template: `
    <app-card heading="Portal settings" subtitle="ADMIN-only route">
      <dl class="kv">
        <div><dt>Application</dt><dd>{{ config.appName }}</dd></div>
        <div><dt>API base</dt><dd><code>{{ config.apiBaseUrl }}</code></dd></div>
        <div><dt>Cache TTL</dt><dd>{{ config.httpCacheTtlMs }} ms</dd></div>
        <div><dt>Page size</dt><dd>{{ config.defaultPageSize }}</dd></div>
      </dl>
    </app-card>

    <app-card heading="Feature flags" subtitle="Merged from root and AdminModule (multi providers)">
      <ul class="flags">
        @for (flag of flags; track flag.key) {
          <li>
            <code>{{ flag.key }}</code>
            <span [class.on]="flag.enabled">{{ flag.enabled ? 'on' : 'off' }}</span>
          </li>
        }
      </ul>
    </app-card>

    <app-card heading="Access simulation" subtitle="Preview the portal as another role">
      <p class="hint">
        Changing this affects only your session. Use it to check what a manager or an employee
        can see before rolling out a permission change.
      </p>
      <div class="row">
        @for (role of roles; track role) {
          <button
            type="button"
            class="btn btn--ghost btn--sm"
            [class.is-current]="auth.role() === role"
            (click)="auth.switchRole(role)"
          >
            {{ role }}
          </button>
        }
      </div>
    </app-card>
  `,
  styles: `
    :host { display: block; display: grid; gap: 1rem; }
    .kv { margin: 0; display: grid; gap: 0.4rem; }
    .kv div { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.85rem; }
    .kv dt { color: var(--muted); }
    .kv dd { margin: 0; font-weight: 600; }
    .flags { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.3rem; font-size: 0.85rem; }
    .flags li { display: flex; justify-content: space-between; }
    .on { color: #15803d; font-weight: 600; }
    .is-current { border-color: var(--accent); color: var(--accent); }
    .ok { margin: 0.7rem 0 0; font-size: 0.85rem; color: #15803d; }
  `,
})
export class AdminSettings {
  protected readonly config = inject(APP_CONFIG);
  protected readonly auth = inject(AuthService);
  protected readonly roles: readonly Role[] = ROLES;
  protected readonly flags = inject(FEATURE_FLAGS, { optional: true }) ?? [];
}
