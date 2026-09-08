import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@core/services/auth.service';
import { EmployeeStore } from '@core/state/employee.store';
import { Card } from '@shared/components/card/card';
import { InitialsPipe } from '@shared/pipes/initials.pipe';
import { TenurePipe } from '@shared/pipes/tenure.pipe';
import { TooltipDirective } from '@shared/directives/tooltip.directive';

@Component({
  selector: 'app-department-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, RouterLink, Card, InitialsPipe, TenurePipe, TooltipDirective],
  template: `
    <app-card [heading]="department()" [subtitle]="members().length + ' people'">
      <div card-actions>
        @if (auth.hasRole('MANAGER')) {
          <span class="payroll">{{ payroll() | currency: 'USD' : 'symbol' : '1.0-0' }}</span>
        }
      </div>

      @if (members().length) {
        <ul class="members">
          @for (member of members(); track member.id) {
            <li>
              <span class="avatar" [style.background]="member.avatarColor">
                {{ member.firstName + ' ' + member.lastName | initials }}
              </span>
              <span class="who">
                <a [routerLink]="['/employees', member.id]">
                  {{ member.firstName }} {{ member.lastName }}
                </a>
                <small>{{ member.title }} · {{ member.joinedOn | tenure }}</small>
              </span>
              <span
                class="status"
                [attr.data-status]="member.status"
                [appTooltip]="statusHint(member.status)"
              >
                {{ member.status }}
              </span>
            </li>
          }
        </ul>
      } @else {
        <p class="hint">No one is assigned to this department.</p>
      }
    </app-card>
  `,
  styles: `
    .payroll {
      font-size: 0.8rem;
      color: var(--muted);
      font-variant-numeric: tabular-nums;
    }
    .members {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.45rem;
    }
    .members li {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 9px;
      display: grid;
      place-items: center;
      color: #fff;
      font-size: 0.68rem;
      font-weight: 700;
      flex: none;
    }
    .who {
      display: grid;
      flex: 1;
      min-width: 0;
    }
    .who a {
      color: inherit;
      font-weight: 600;
      font-size: 0.88rem;
      text-decoration: none;
    }
    .who a:hover {
      text-decoration: underline;
    }
    .who small {
      color: var(--muted);
      font-size: 0.75rem;
    }
    .status {
      font-size: 0.66rem;
      letter-spacing: 0.05em;
      color: var(--muted);
      flex: none;
    }
    .status[data-status='ACTIVE'] {
      color: #15803d;
    }
    .status[data-status='ON_LEAVE'] {
      color: #b45309;
    }
    .status[data-status='EXITED'] {
      color: #b91c1c;
    }
  `,
})
export class DepartmentDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(EmployeeStore);
  protected readonly auth = inject(AuthService);

  private readonly params = toSignal(this.route.paramMap, { requireSync: true });

  protected readonly department = computed(() => this.params().get('name') ?? '');
  protected readonly members = computed(() =>
    this.store.employees().filter((employee) => employee.department === this.department()),
  );
  protected readonly payroll = computed(() =>
    this.members().reduce((sum, employee) => sum + employee.salary, 0),
  );

  protected statusHint(status: string): string {
    const hints: Record<string, string> = {
      ACTIVE: 'Currently working',
      ON_LEAVE: 'On approved leave',
      PROBATION: 'Within probation period',
      EXITED: 'No longer with the company',
    };
    return hints[status] ?? status;
  }
}
