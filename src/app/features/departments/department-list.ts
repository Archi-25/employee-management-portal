import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { EmployeeStore } from '@core/state/employee.store';
import { Card } from '@shared/components/card/card';
import { StatTile } from '@shared/components/stat-tile/stat-tile';

/**
 * Departments overview. Parent of the `/departments/:name` child route, so it
 * owns a `<router-outlet>` of its own.
 */
@Component({
  selector: 'app-department-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Card, StatTile],
  template: `
    <header class="page-head">
      <h1 i18n="@@departments.title">Departments</h1>
      <p i18n="@@departments.subtitle">
        Headcount and payroll split by team. Select a department to see its members.
      </p>
    </header>

    <div class="tiles">
      <app-stat-tile label="Departments" [value]="departments().length" accent="#6366f1" />
      <app-stat-tile label="Total headcount" [value]="store.total()" accent="#0ea5e9" />
      <app-stat-tile label="Largest team" [value]="largest()" accent="#16a34a" />
      <app-stat-tile
        label="Annual payroll"
        [value]="store.payrollTotal()"
        [currency]="true"
        accent="#f59e0b"
      />
    </div>

    <div class="layout">
      <app-card heading="All teams" [subtitle]="departments().length + ' teams'">
        <ul class="teams">
          @for (team of departments(); track team.department) {
            <li>
              <a [routerLink]="[team.department]" routerLinkActive="is-active">
                <span class="teams__name">{{ team.department }}</span>
                <span class="teams__bar">
                  <span class="teams__fill" [style.width.%]="share(team.count)"></span>
                </span>
                <span class="teams__count">{{ team.count }}</span>
              </a>
            </li>
          }
        </ul>
      </app-card>

      <div class="detail">
        <!-- Child route renders here -->
        <router-outlet />
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.75rem; margin-bottom: 1rem; }
    .layout { display: grid; grid-template-columns: minmax(240px, 340px) 1fr; gap: 1rem; align-items: start; }
    @media (max-width: 860px) { .layout { grid-template-columns: 1fr; } }
    .teams { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.3rem; }
    .teams a {
      display: grid;
      grid-template-columns: 1fr 70px 26px;
      align-items: center;
      gap: 0.6rem;
      padding: 0.45rem 0.55rem;
      border-radius: 8px;
      text-decoration: none;
      color: inherit;
      border: 1px solid transparent;
    }
    .teams a:hover { background: var(--surface-2); }
    .teams a.is-active { border-color: var(--accent); background: var(--surface-2); }
    .teams__name { font-size: 0.87rem; font-weight: 500; }
    .teams__bar { background: var(--surface-2); border-radius: 999px; height: 6px; overflow: hidden; }
    .teams__fill { display: block; height: 100%; background: var(--accent); }
    .teams__count { text-align: right; font-size: 0.8rem; color: var(--muted); font-variant-numeric: tabular-nums; }
    .detail { display: grid; gap: 1rem; }
  `,
})
export class DepartmentList {
  protected readonly store = inject(EmployeeStore);
  protected readonly departments = computed(() => this.store.headcountByDepartment());
  protected readonly largest = computed(() => this.departments()[0]?.department ?? '—');

  protected share(count: number): number {
    const total = this.store.total();
    return total === 0 ? 0 : (count / total) * 100;
  }
}
