import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { EmployeeStore } from '@core/state/employee.store';
import { Card } from '@shared/components/card/card';

/**
 * MODULE 4 — third routing level. This component is itself a child of
 * `AdminShell` and hosts another `<router-outlet>` for `/admin/teams/:id`.
 */
@Component({
  selector: 'app-admin-team-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Card],
  template: `
    <div class="split">
      <app-card heading="Teams" subtitle="Grouped from the store">
        <ul class="teams">
          @for (team of teams(); track team.department) {
            <li>
              <a [routerLink]="[team.department]" routerLinkActive="is-active">
                <strong>{{ team.department }}</strong>
                <small>{{ team.count }} people</small>
              </a>
            </li>
          }
        </ul>
      </app-card>

      <div class="detail">
        <!-- Grandchild route renders here -->
        <router-outlet />
      </div>
    </div>
  `,
  styles: `
    .split { display: grid; grid-template-columns: minmax(200px, 260px) 1fr; gap: 1rem; align-items: start; }
    @media (max-width: 800px) { .split { grid-template-columns: 1fr; } }
    .teams { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.3rem; }
    .teams a {
      display: flex;
      justify-content: space-between;
      gap: 0.6rem;
      padding: 0.45rem 0.6rem;
      border-radius: 8px;
      text-decoration: none;
      color: inherit;
      border: 1px solid transparent;
    }
    .teams a:hover { background: var(--surface-2); }
    .teams a.is-active { border-color: var(--accent); background: var(--surface-2); }
    .teams small { color: var(--muted); }
  `,
})
export class AdminTeamList {
  private readonly store = inject(EmployeeStore);
  protected readonly teams = computed(() => this.store.headcountByDepartment());
}
