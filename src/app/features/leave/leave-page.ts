import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { fullName } from '@core/models/employee.model';
import { LEAVE_TYPES, LeaveRequest, LeaveStatus, countLeaveDays } from '@core/models/hr.model';
import { AuthService } from '@core/services/auth.service';
import { EmployeeStore } from '@core/state/employee.store';
import { LeaveStore } from '@core/state/leave.store';
import { Card } from '@shared/components/card/card';
import { StatTile } from '@shared/components/stat-tile/stat-tile';
import { ConfirmDialog } from '@shared/components/confirm-dialog/confirm-dialog';
import { DialogCloseDirective } from '@shared/directives/dialog-close.directive';
import { HasRoleDirective } from '@shared/directives/has-role.directive';
import { InitialsPipe } from '@shared/pipes/initials.pipe';

const STATUS_CLASS: Record<LeaveStatus, string> = {
  PENDING: 'status--warning',
  APPROVED: 'status--good',
  REJECTED: 'status--critical',
};

@Component({
  selector: 'app-leave-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    Card,
    StatTile,
    ConfirmDialog,
    DialogCloseDirective,
    HasRoleDirective,
    InitialsPipe,
  ],
  templateUrl: './leave-page.html',
  styleUrl: './leave-page.css',
})
export class LeavePage {
  protected readonly store = inject(LeaveStore);
  protected readonly employees = inject(EmployeeStore);
  protected readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly leaveTypes = LEAVE_TYPES;
  protected readonly today = new Date().toISOString().slice(0, 10);
  protected readonly showForm = signal(false);
  protected readonly rejecting = signal<LeaveRequest | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    type: ['Casual' as (typeof LEAVE_TYPES)[number], Validators.required],
    from: ['', Validators.required],
    to: ['', Validators.required],
    reason: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(200)]],
  });

  constructor() {
    void this.store.load();
  }

  protected readonly me = computed(() => {
    const id = this.auth.employeeId();
    return id === null ? null : this.employees.byId(id);
  });

  protected readonly myBalance = computed(() => {
    const id = this.me()?.id;
    return id === undefined
      ? null
      : (this.store.balances().find((balance) => balance.employeeId === id) ?? null);
  });

  protected readonly rows = computed(() => {
    const visible = this.store.visible();
    if (this.auth.hasRole('MANAGER')) {
      return visible;
    }
    const id = this.me()?.id ?? -1;
    return visible.filter((request) => request.employeeId === id);
  });

  protected readonly requestedDays = computed(() => {
    const { from, to } = this.form.getRawValue();
    return from && to ? countLeaveDays(from, to) : 0;
  });

  protected employeeName(id: number): string {
    const employee = this.employees.byId(id);
    return employee ? fullName(employee) : `#${id}`;
  }

  protected avatarColor(id: number): string {
    return this.employees.byId(id)?.avatarColor ?? '#94a3b8';
  }

  protected statusClass(status: LeaveStatus): string {
    return STATUS_CLASS[status];
  }

  protected onStatusFilter(value: string): void {
    this.store.setStatus(value as LeaveStatus | 'ALL');
  }

  protected showError(name: 'from' | 'to' | 'reason'): boolean {
    const control = this.form.controls[name];
    return control.invalid && control.touched;
  }

  protected async apply(): Promise<void> {
    const me = this.me();
    if (this.form.invalid || !me) {
      this.form.markAllAsTouched();
      return;
    }

    const { type, from, to, reason } = this.form.getRawValue();
    if (countLeaveDays(from, to) === 0) {
      this.form.controls.to.setErrors({ range: true });
      return;
    }

    await this.store.apply({ employeeId: me.id, type, from, to, reason: reason.trim() });
    this.form.reset({ type: 'Casual', from: '', to: '', reason: '' });
    this.showForm.set(false);
  }

  protected async approve(request: LeaveRequest): Promise<void> {
    await this.store.decide(request.id, true, this.auth.displayName());
  }

  protected async confirmReject(): Promise<void> {
    const request = this.rejecting();
    this.rejecting.set(null);
    if (request) {
      await this.store.decide(request.id, false, this.auth.displayName());
    }
  }
}
