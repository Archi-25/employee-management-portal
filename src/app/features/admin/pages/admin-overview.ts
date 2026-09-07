import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { EmployeeStore } from '@core/state/employee.store';
import { Card } from '@shared/components/card/card';
import { StatTile } from '@shared/components/stat-tile/stat-tile';

@Component({
  selector: 'app-admin-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, StatTile],
  template: `
    <div class="tiles">
      <app-stat-tile label="Headcount" [value]="store.total()" accent="var(--accent)" />
      <app-stat-tile label="Active" [value]="store.activeCount()" accent="var(--good)" />
      <app-stat-tile
        label="Annual payroll"
        [value]="store.payrollTotal()"
        [currency]="true"
        accent="var(--accent)"
      />
      <app-stat-tile
        label="Departments"
        [value]="store.headcountByDepartment().length"
        accent="var(--accent)"
      />
    </div>

    <app-card heading="Headcount by department" subtitle="Derived with computed() in the store">
      <ul class="bars">
        @for (row of store.headcountByDepartment(); track row.department) {
          <li>
            <span class="bars__label">{{ row.department }}</span>
            <span class="bars__track">
              <span class="bars__fill" [style.width.%]="(row.count / store.total()) * 100"></span>
            </span>
            <span class="bars__value">{{ row.count }}</span>
          </li>
        }
      </ul>
    </app-card>
  `,
  styles: `
    .tiles {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .bars { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; }
    .bars li { display: grid; grid-template-columns: 130px 1fr 32px; gap: 0.65rem; align-items: center; font-size: 0.85rem; }
    .bars__track { background: var(--surface-2); border-radius: 999px; height: 8px; overflow: hidden; }
    .bars__fill { display: block; height: 100%; background: var(--accent); border-radius: 999px; }
    .bars__value { text-align: right; font-variant-numeric: tabular-nums; color: var(--muted); }
  `,
})
export class AdminOverview {
  protected readonly store = inject(EmployeeStore);
}
