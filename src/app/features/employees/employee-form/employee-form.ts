import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Department, Employee, EmployeeDraft, EmployeeStatus } from '@core/models/employee.model';
import { HasUnsavedChanges } from '@core/guards/unsaved-changes.guard';
import { EmployeeStore } from '@core/state/employee.store';
import { Card } from '@shared/components/card/card';

const DEPARTMENTS: Department[] = [
  'Engineering',
  'Design',
  'Finance',
  'People Ops',
  'Sales',
  'Support',
];
const STATUSES: EmployeeStatus[] = ['ACTIVE', 'ON_LEAVE', 'PROBATION', 'EXITED'];
const PALETTE = ['#6366f1', '#0ea5e9', '#22c55e', '#f97316', '#e11d48', '#8b5cf6'];

/** Create/edit screen. Guarded by `unsavedChangesGuard` (MODULE 4). */
@Component({
  selector: 'app-employee-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, Card],
  templateUrl: './employee-form.html',
  styleUrl: './employee-form.css',
})
export class EmployeeForm implements HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly store = inject(EmployeeStore);

  protected readonly departments = DEPARTMENTS;
  protected readonly statuses = STATUSES;
  protected readonly saving = signal(false);

  /** `null` in create mode, the record id in edit mode. */
  private readonly params = toSignal(this.route.paramMap, { requireSync: true });
  protected readonly employeeId = computed(() => {
    const raw = this.params().get('id');
    return raw ? Number(raw) : null;
  });
  protected readonly isEdit = computed(() => this.employeeId() !== null);

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    title: ['', Validators.required],
    department: ['Engineering' as Department, Validators.required],
    role: ['EMPLOYEE' as Employee['role'], Validators.required],
    status: ['ACTIVE' as EmployeeStatus, Validators.required],
    salary: [90000, [Validators.required, Validators.min(0)]],
    joinedOn: [new Date().toISOString().slice(0, 10), Validators.required],
    location: ['', Validators.required],
    skills: [''],
  });

  constructor() {
    const id = this.employeeId();
    if (id !== null) {
      const existing = this.store.employees().find((employee) => employee.id === id);
      if (existing) {
        this.patch(existing);
      } else {
        void this.store.load().then(() => {
          const loaded = this.store.employees().find((employee) => employee.id === id);
          if (loaded) {
            this.patch(loaded);
          }
        });
      }
      this.store.select(id);
    }
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.saving();
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const value = this.form.getRawValue();
    const draft: EmployeeDraft = {
      ...value,
      skills: value.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
      bioHtml: `<p>${value.title} in ${value.department}.</p>`,
      avatarColor: PALETTE[value.firstName.length % PALETTE.length],
    };

    const id = this.employeeId();
    if (id === null) {
      await this.store.create(draft);
    } else {
      await this.store.update(id, draft);
    }

    this.form.markAsPristine();
    this.saving.set(false);
    void this.router.navigate(['/employees']);
  }

  protected cancel(): void {
    this.form.markAsPristine();
    void this.router.navigate(['/employees']);
  }

  private patch(employee: Employee): void {
    this.form.patchValue({ ...employee, skills: employee.skills.join(', ') });
    this.form.markAsPristine();
  }
}
