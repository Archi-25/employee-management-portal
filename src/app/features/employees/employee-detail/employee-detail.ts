import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { Employee } from '@core/models/employee.model';
import { Card } from '@shared/components/card/card';
import { EmployeeProfile } from '../employee-profile/employee-profile';

/**
 * MODULE 4 — nested detail route. The record arrives pre-resolved via
 * `employeeResolver`, so the template never renders a loading state.
 */
@Component({
  selector: 'app-employee-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Card, EmployeeProfile],
  template: `
    <header class="page-head">
      <h1>{{ employee().firstName }} {{ employee().lastName }}</h1>
      <p>Resolved before activation by <code>employeeResolver</code>.</p>
    </header>

    <app-card heading="Profile" subtitle="Same component, different host page">
      <app-employee-profile
        [employee]="employee()"
        (edit)="edit($event)"
        (remove)="back()"
      >
        <div profile-banner class="banner">Deep-linkable route: /employees/{{ employee().id }}</div>
        <a profile-actions class="btn btn--ghost btn--sm" routerLink="/employees">Back to list</a>
      </app-employee-profile>
    </app-card>
  `,
  styles: `
    .banner {
      background: var(--surface-2);
      border: 1px dashed var(--border);
      border-radius: 8px;
      padding: 0.45rem 0.6rem;
      font-size: 0.8rem;
    }
  `,
})
export class EmployeeDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly employee = toSignal(
    this.route.data.pipe(map((data) => data['employee'] as Employee)),
    { requireSync: true },
  );

  protected edit(employee: Employee): void {
    void this.router.navigate(['/employees', employee.id, 'edit']);
  }

  protected back(): void {
    void this.router.navigate(['/employees']);
  }
}
