import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { EmployeeStore } from '@core/state/employee.store';
import { Card } from '@shared/components/card/card';
import { InitialsPipe } from '@shared/pipes/initials.pipe';

@Component({
  selector: 'app-admin-team-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Card, InitialsPipe],
  template: `
    <app-card [heading]="department()" subtitle="Route parameter read as a signal">
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
                <small>{{ member.title }}</small>
              </span>
              <span class="status">{{ member.status }}</span>
            </li>
          }
        </ul>
      } @else {
        <p class="hint">No one in this team.</p>
      }
    </app-card>
  `,
  styles: `
    .members { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.4rem; }
    .members li { display: flex; align-items: center; gap: 0.65rem; }
    .avatar {
      width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center;
      color: #fff; font-size: 0.66rem; font-weight: 700; flex: none;
    }
    .who { display: grid; flex: 1; }
    .who a { color: inherit; font-weight: 600; font-size: 0.88rem; }
    .who small { color: var(--muted); font-size: 0.75rem; }
    .status { font-size: 0.68rem; letter-spacing: 0.05em; color: var(--muted); }
  `,
})
export class AdminTeamDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(EmployeeStore);

  private readonly params = toSignal(this.route.paramMap, { requireSync: true });
  protected readonly department = computed(() => this.params().get('id') ?? '');
  protected readonly members = computed(() =>
    this.store.employees().filter((employee) => employee.department === this.department()),
  );
}
