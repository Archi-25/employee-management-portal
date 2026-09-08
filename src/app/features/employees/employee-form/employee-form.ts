import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  DEPARTMENTS,
  EMPLOYEE_STATUSES,
  EMPLOYMENT_TYPES,
  GENDERS,
  Employee,
  EmployeeDraft,
  fullName,
} from '@core/models/employee.model';
import { HasUnsavedChanges } from '@core/guards/unsaved-changes.guard';
import { EmployeeStore } from '@core/state/employee.store';
import { Card } from '@shared/components/card/card';

const PALETTE = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#4a3aa7', '#e34948'];

/** 18 years ago — the latest date of birth we accept. */
function maxDateOfBirth(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 18);
  return date.toISOString().slice(0, 10);
}

/** Rejects a date of birth that would make the employee under 18. */
function adultValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }
  return control.value <= maxDateOfBirth() ? null : { tooYoung: true };
}

/** Rejects a joining date in the future. */
function notFutureValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }
  return control.value <= new Date().toISOString().slice(0, 10) ? null : { future: true };
}

@Component({
  selector: 'app-employee-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Card],
  templateUrl: './employee-form.html',
  styleUrl: './employee-form.css',
})
export class EmployeeForm implements HasUnsavedChanges {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly store = inject(EmployeeStore);

  protected readonly departments = DEPARTMENTS;
  protected readonly statuses = EMPLOYEE_STATUSES;
  protected readonly employmentTypes = EMPLOYMENT_TYPES;
  protected readonly genders = GENDERS;
  protected readonly maxDob = maxDateOfBirth();
  protected readonly today = new Date().toISOString().slice(0, 10);

  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);

  private readonly params = toSignal(this.route.paramMap, { requireSync: true });
  protected readonly employeeId = computed(() => {
    const raw = this.params().get('id');
    return raw ? Number(raw) : null;
  });
  protected readonly isEdit = computed(() => this.employeeId() !== null);

  /** Possible reporting managers — anyone with a manager-or-above role. */
  protected readonly managers = computed(() =>
    this.store
      .employees()
      .filter(
        (employee) =>
          employee.id !== this.employeeId() &&
          (employee.role === 'MANAGER' || employee.role === 'ADMIN') &&
          employee.status !== 'EXITED',
      ),
  );

  protected readonly form = this.fb.nonNullable.group({
    // --- personal ---
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[+]?[\d\s-]{8,18}$/)]],
    dateOfBirth: ['', [Validators.required, adultValidator]],
    gender: ['Prefer not to say' as Employee['gender'], Validators.required],

    // --- professional ---
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    department: ['Engineering' as Employee['department'], Validators.required],
    employmentType: ['Full-time' as Employee['employmentType'], Validators.required],
    joinedOn: ['', [Validators.required, notFutureValidator]],
    managerId: [null as number | null],
    salary: [90000, [Validators.required, Validators.min(1), Validators.max(10_000_000)]],
    status: ['ACTIVE' as Employee['status'], Validators.required],
    role: ['EMPLOYEE' as Employee['role'], Validators.required],
    location: ['', Validators.required],
    skills: [''],

    // --- address ---
    line1: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    pincode: ['', [Validators.required, Validators.pattern(/^\d{4,8}$/)]],
  });

  constructor() {
    const id = this.employeeId();
    if (id === null) {
      return;
    }

    const existing = this.store.byId(id);
    if (existing) {
      this.patch(existing);
    } else {
      void this.store.load().then(() => {
        const loaded = this.store.byId(id);
        if (loaded) {
          this.patch(loaded);
        }
      });
    }
    this.store.select(id);
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.saving();
  }

  /** True once the field should show its error, i.e. after a touch or a submit. */
  protected showError(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  protected async submit(): Promise<void> {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstError();
      return;
    }

    this.saving.set(true);
    const value = this.form.getRawValue();

    const draft: EmployeeDraft = {
      code: this.store.byId(this.employeeId() ?? -1)?.code ?? '',
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email.trim().toLowerCase(),
      phone: value.phone.trim(),
      dateOfBirth: value.dateOfBirth,
      gender: value.gender,
      title: value.title.trim(),
      department: value.department,
      employmentType: value.employmentType,
      joinedOn: value.joinedOn,
      managerId: value.managerId ? Number(value.managerId) : null,
      salary: Number(value.salary),
      status: value.status,
      role: value.role,
      location: value.location.trim(),
      skills: value.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
      address: {
        line1: value.line1.trim(),
        city: value.city.trim(),
        state: value.state.trim(),
        pincode: value.pincode.trim(),
      },
      bioHtml: `<p>${value.title.trim()} in ${value.department}.</p>`,
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

  protected reset(): void {
    this.submitted.set(false);
    const id = this.employeeId();
    const existing = id === null ? null : this.store.byId(id);

    if (existing) {
      this.patch(existing);
    } else {
      this.form.reset();
      this.form.patchValue({
        gender: 'Prefer not to say',
        department: 'Engineering',
        employmentType: 'Full-time',
        status: 'ACTIVE',
        role: 'EMPLOYEE',
        salary: 90000,
      });
    }
  }

  protected cancel(): void {
    this.form.markAsPristine();
    void this.router.navigate(['/employees']);
  }

  protected editingName(): string {
    const id = this.employeeId();
    const existing = id === null ? null : this.store.byId(id);
    return existing ? fullName(existing) : 'New employee';
  }

  private patch(employee: Employee): void {
    this.form.patchValue({
      ...employee,
      managerId: employee.managerId,
      skills: employee.skills.join(', '),
      line1: employee.address.line1,
      city: employee.address.city,
      state: employee.address.state,
      pincode: employee.address.pincode,
    });
    this.form.markAsPristine();
  }

  /** Moves focus to the first invalid control so the error is not off-screen. */
  private focusFirstError(): void {
    const firstInvalid = Object.keys(this.form.controls).find(
      (name) => this.form.controls[name as keyof typeof this.form.controls].invalid,
    );
    if (firstInvalid) {
      document.querySelector<HTMLElement>(`[formControlName="${firstInvalid}"]`)?.focus();
    }
  }
}
