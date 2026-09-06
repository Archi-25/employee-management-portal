import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Employee } from '@core/models/employee.model';
import { AuthService } from '@core/services/auth.service';
import { AnnouncementStore } from '@core/state/announcement.store';
import { AttendanceStore } from '@core/state/attendance.store';
import { EmployeeStore } from '@core/state/employee.store';
import { LeaveStore } from '@core/state/leave.store';
import { AnnouncementPanel } from '@features/announcements/announcement-panel';
import { BarChart, BarDatum } from '@shared/components/bar-chart/bar-chart';
import { Card } from '@shared/components/card/card';
import { StatTile } from '@shared/components/stat-tile/stat-tile';
import { HasRoleDirective } from '@shared/directives/has-role.directive';
import { InitialsPipe } from '@shared/pipes/initials.pipe';

const RECENT_LIMIT = 5;

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    RouterLink,
    AnnouncementPanel,
    BarChart,
    Card,
    StatTile,
    HasRoleDirective,
    InitialsPipe,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  protected readonly store = inject(EmployeeStore);
  protected readonly attendance = inject(AttendanceStore);
  protected readonly leave = inject(LeaveStore);
  protected readonly announcements = inject(AnnouncementStore);
  protected readonly auth = inject(AuthService);

  protected readonly departmentChart = computed<BarDatum[]>(() =>
    this.store.headcountByDepartment().map((row) => ({
      label: row.department,
      value: row.count,
    })),
  );

  protected readonly recentJoiners = computed<Employee[]>(() =>
    this.store.recentJoiners().slice(0, RECENT_LIMIT),
  );

  protected readonly birthdays = computed(() => this.store.upcomingBirthdays().slice(0, RECENT_LIMIT));

  /** Newest activity across leave and joiners, as a single feed. */
  protected readonly activity = computed(() => {
    const fromLeave = this.leave.requests().slice(0, 4).map((request) => ({
      id: `leave-${request.id}`,
      at: request.appliedOn,
      text: `${this.nameOf(request.employeeId)} requested ${request.days} day(s) of ${request.type.toLowerCase()} leave`,
      status: request.status,
    }));

    const fromJoiners = this.store.recentJoiners().slice(0, 3).map((employee) => ({
      id: `joiner-${employee.id}`,
      at: employee.joinedOn,
      text: `${employee.firstName} ${employee.lastName} joined ${employee.department}`,
      status: 'JOINED' as const,
    }));

    return [...fromLeave, ...fromJoiners]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 6);
  });

  constructor() {
    void this.announcements.load();
    void this.attendance.load();
    void this.leave.load();
  }

  protected nameOf(employeeId: number): string {
    const employee = this.store.byId(employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : `#${employeeId}`;
  }

  protected statusClass(status: string): string {
    if (status === 'APPROVED' || status === 'JOINED') return 'status--good';
    if (status === 'PENDING') return 'status--warning';
    if (status === 'REJECTED') return 'status--critical';
    return 'status--neutral';
  }

  /** Days until the next birthday, for the "in N days" label. */
  protected daysUntilBirthday(dateOfBirth: string): string {
    const now = new Date();
    const dob = new Date(dateOfBirth);
    const next = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (next < today) {
      next.setFullYear(now.getFullYear() + 1);
    }
    const days = Math.round((next.getTime() - today.getTime()) / 86_400_000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  }
}
