import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Department, Employee, EmployeeStatus, fullName } from '@core/models/employee.model';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { EmployeeStore } from '@core/state/employee.store';
import { Card } from '@shared/components/card/card';
import { StatTile } from '@shared/components/stat-tile/stat-tile';
import { HasRoleDirective } from '@shared/directives/has-role.directive';
import { HighlightDirective } from '@shared/directives/highlight.directive';
import { UnlessDirective } from '@shared/directives/unless.directive';
import { InitialsPipe } from '@shared/pipes/initials.pipe';
import { TenurePipe } from '@shared/pipes/tenure.pipe';
import { EmployeeProfile, ProfileNote } from '../employee-profile/employee-profile';

const DEPARTMENTS: readonly (Department | 'ALL')[] = [
  'ALL',
  'Engineering',
  'Design',
  'Finance',
  'People Ops',
  'Sales',
  'Support',
];

const STATUSES: readonly (EmployeeStatus | 'ALL')[] = [
  'ALL',
  'ACTIVE',
  'ON_LEAVE',
  'PROBATION',
  'EXITED',
];

/**
 * Directory page. Hosts {@link EmployeeProfile} and supplies content for each of
 * its projection slots (MODULE 1), and drives the store (MODULE 9).
 */
@Component({
  selector: 'app-employee-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    JsonPipe,
    FormsModule,
    RouterLink,
    Card,
    StatTile,
    EmployeeProfile,
    HasRoleDirective,
    HighlightDirective,
    UnlessDirective,
    InitialsPipe,
    TenurePipe,
  ],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css',
})
export class EmployeeList {
  protected readonly store = inject(EmployeeStore);
  protected readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  protected readonly departments = DEPARTMENTS;
  protected readonly statuses = STATUSES;
  protected readonly lastNote = signal<ProfileNote | null>(null);
  protected readonly denseProfile = signal(false);

  protected readonly selected = computed(
    () => this.store.selected() ?? this.store.filtered()[0] ?? null,
  );

  protected readonly emptyMessage = computed(() =>
    this.store.total() === 0
      ? 'The directory is empty.'
      : 'No employee matches the current filters.',
  );

  protected onSearch(value: string): void {
    this.store.setFilter({ search: value });
  }

  protected onDepartment(value: string): void {
    this.store.setFilter({ department: value as Department | 'ALL' });
  }

  protected onStatus(value: string): void {
    this.store.setFilter({ status: value as EmployeeStatus | 'ALL' });
  }

  protected onEdit(employee: Employee): void {
    void this.router.navigate(['/employees', employee.id, 'edit']);
  }

  protected onRemove(employee: Employee): void {
    if (confirm(`Remove ${fullName(employee)} from the directory?`)) {
      void this.store.remove(employee.id);
    }
  }

  protected onNoteAdded(note: ProfileNote): void {
    this.lastNote.set(note);
    this.notifications.info('Note stored locally on the profile component.');
  }

  protected trackById(_index: number, employee: Employee): number {
    return employee.id;
  }
}
