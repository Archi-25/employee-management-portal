import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { Employee, fullName } from '@core/models/employee.model';
import { AttendanceRecord, LeaveRequest } from '@core/models/hr.model';
import { AuthService } from '@core/services/auth.service';
import { HrService } from '@core/services/hr.service';
import { EmployeeStore } from '@core/state/employee.store';
import { EmployeeDocuments } from '../employee-documents/employee-documents';
import { Card } from '@shared/components/card/card';
import { BadgeWidget } from '@shared/components/badge-widget/badge-widget';
import { PrintRecord } from '@shared/components/print-record/print-record';
import { ConfirmDialog } from '@shared/components/confirm-dialog/confirm-dialog';
import { DialogCloseDirective } from '@shared/directives/dialog-close.directive';
import { HasRoleDirective } from '@shared/directives/has-role.directive';
import { EmployeeProfile, ProfileNote } from '../employee-profile/employee-profile';

type Tab = 'personal' | 'professional' | 'attendance' | 'leave' | 'documents';

interface TabDef {
  readonly id: Tab;
  readonly label: string;
}

const TABS: readonly TabDef[] = [
  { id: 'personal', label: 'Personal' },
  { id: 'professional', label: 'Professional' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'leave', label: 'Leave' },
  { id: 'documents', label: 'Documents' },
];

@Component({
  selector: 'app-employee-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Card,
    BadgeWidget,
    PrintRecord,
    ConfirmDialog,
    DialogCloseDirective,
    HasRoleDirective,
    EmployeeProfile,
    EmployeeDocuments,
  ],
  templateUrl: './employee-detail.html',
  styleUrl: './employee-detail.css',
})
export class EmployeeDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly hr = inject(HrService);
  protected readonly store = inject(EmployeeStore);
  protected readonly auth = inject(AuthService);

  protected readonly tabs = TABS;
  protected readonly tab = signal<Tab>('personal');
  protected readonly confirmingDelete = signal(false);
  protected readonly showBadge = signal(false);
  protected readonly showPrint = signal(false);
  protected readonly savedNotes = signal<ProfileNote[]>([]);

  protected readonly attendance = signal<AttendanceRecord[]>([]);
  protected readonly leave = signal<LeaveRequest[]>([]);

  protected readonly employee = toSignal(
    this.route.data.pipe(map((data) => data['employee'] as Employee)),
    { requireSync: true },
  );

  protected readonly displayName = computed(() => fullName(this.employee()));

  protected readonly manager = computed(() => {
    const managerId = this.employee().managerId;
    return managerId === null ? null : this.store.byId(managerId);
  });

  protected readonly teammates = computed(() =>
    this.store
      .employees()
      .filter(
        (colleague) =>
          colleague.department === this.employee().department &&
          colleague.id !== this.employee().id,
      )
      .slice(0, 5),
  );

  protected readonly attendanceSummary = computed(() => {
    const records = this.attendance();
    return {
      present: records.filter((r) => r.status === 'PRESENT').length,
      late: records.filter((r) => r.status === 'LATE').length,
      absent: records.filter((r) => r.status === 'ABSENT').length,
      total: records.length,
    };
  });

  constructor() {
    const id = this.employee().id;
    this.hr.attendance({ employeeId: id }).subscribe({
      next: (records) => this.attendance.set(records.slice(0, 10)),
      error: () => this.attendance.set([]),
    });
    this.hr.leave({ employeeId: id }).subscribe({
      next: (requests) => this.leave.set(requests),
      error: () => this.leave.set([]),
    });
  }

  protected select(tab: Tab): void {
    this.tab.set(tab);
  }

  protected edit(): void {
    void this.router.navigate(['/employees', this.employee().id, 'edit']);
  }

  protected async remove(): Promise<void> {
    this.confirmingDelete.set(false);
    await this.store.remove(this.employee().id);
    void this.router.navigate(['/employees']);
  }

  protected onNoteAdded(note: ProfileNote): void {
    this.savedNotes.update((notes) => [note, ...notes]);
  }

  protected print(): void {
    this.showPrint.set(true);
    setTimeout(() => globalThis.print?.(), 0);
  }

  protected statusClass(status: string): string {
    if (status === 'PRESENT' || status === 'APPROVED' || status === 'ACTIVE') return 'status--good';
    if (status === 'LATE' || status === 'PENDING' || status === 'PROBATION')
      return 'status--warning';
    if (status === 'ABSENT' || status === 'REJECTED' || status === 'EXITED')
      return 'status--critical';
    return 'status--neutral';
  }

  protected label(value: string): string {
    return value.replace('_', ' ');
  }
}
