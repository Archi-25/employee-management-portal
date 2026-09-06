import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { fullName } from '@core/models/employee.model';
import { ATTENDANCE_STATUSES, AttendanceStatus } from '@core/models/hr.model';
import { AuthService } from '@core/services/auth.service';
import { AttendanceStore } from '@core/state/attendance.store';
import { EmployeeStore } from '@core/state/employee.store';
import { Card } from '@shared/components/card/card';
import { StatTile } from '@shared/components/stat-tile/stat-tile';
import { InitialsPipe } from '@shared/pipes/initials.pipe';

const STATUS_CLASS: Record<AttendanceStatus, string> = {
  PRESENT: 'status--good',
  LATE: 'status--warning',
  ABSENT: 'status--critical',
  ON_LEAVE: 'status--neutral',
};

@Component({
  selector: 'app-attendance-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, Card, StatTile, InitialsPipe],
  templateUrl: './attendance-page.html',
  styleUrl: './attendance-page.css',
})
export class AttendancePage {
  protected readonly store = inject(AttendanceStore);
  protected readonly employees = inject(EmployeeStore);
  protected readonly auth = inject(AuthService);

  protected readonly statuses = ATTENDANCE_STATUSES;
  protected readonly search = signal('');

  constructor() {
    // Re-fetch whenever the selected date changes.
    effect(() => {
      this.store.date();
      void this.store.load();
    });
  }

  /**
   * An employee only ever sees their own attendance; managers and admins see
   * everyone. The API would enforce the same rule in a real deployment.
   */
  protected readonly rows = computed(() => {
    const term = this.search().trim().toLowerCase();
    const scoped = this.auth.hasRole('MANAGER')
      ? this.store.forDate()
      : this.store.forDate().filter((record) => record.employeeId === this.ownEmployeeId());

    if (!term) {
      return scoped;
    }
    return scoped.filter((record) => {
      const employee = this.employees.byId(record.employeeId);
      return employee ? fullName(employee).toLowerCase().includes(term) ||
        employee.code.toLowerCase().includes(term) : false;
    });
  });

  /** Maps the signed-in display name onto a directory record for the demo. */
  private readonly ownEmployeeId = computed(() => {
    const name = this.auth.displayName();
    return this.employees.employees().find((employee) => fullName(employee) === name)?.id ?? -1;
  });

  protected employeeName(id: number): string {
    const employee = this.employees.byId(id);
    return employee ? fullName(employee) : `#${id}`;
  }

  protected employeeCode(id: number): string {
    return this.employees.byId(id)?.code ?? '—';
  }

  protected avatarColor(id: number): string {
    return this.employees.byId(id)?.avatarColor ?? '#94a3b8';
  }

  protected statusClass(status: AttendanceStatus): string {
    return STATUS_CLASS[status];
  }

  protected label(status: AttendanceStatus): string {
    return status.replace('_', ' ');
  }

  protected onDate(value: string): void {
    this.store.setDate(value);
  }

  protected onStatus(value: string): void {
    this.store.setStatus(value as AttendanceStatus | 'ALL');
  }
}
