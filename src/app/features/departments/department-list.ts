import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { fullName } from '@core/models/employee.model';
import { DepartmentRecord } from '@core/models/hr.model';
import { AuthService } from '@core/services/auth.service';
import { DepartmentStore } from '@core/state/department.store';
import { EmployeeStore } from '@core/state/employee.store';
import { BarChart, BarDatum } from '@shared/components/bar-chart/bar-chart';
import { Card } from '@shared/components/card/card';
import { ConfirmDialog } from '@shared/components/confirm-dialog/confirm-dialog';
import { DialogCloseDirective } from '@shared/directives/dialog-close.directive';
import { HasRoleDirective } from '@shared/directives/has-role.directive';

@Component({
  selector: 'app-department-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    BarChart,
    Card,
    ConfirmDialog,
    DialogCloseDirective,
    HasRoleDirective,
  ],
  templateUrl: './department-list.html',
  styleUrl: './department-list.css',
})
export class DepartmentList {
  protected readonly store = inject(DepartmentStore);
  protected readonly employees = inject(EmployeeStore);
  protected readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly editing = signal<DepartmentRecord | null>(null);
  protected readonly deleting = signal<DepartmentRecord | null>(null);
  protected readonly showForm = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
    code: ['', [Validators.required, Validators.pattern(/^[A-Z]{2,5}$/)]],
    headId: [null as number | null],
    description: ['', Validators.maxLength(160)],
  });

  constructor() {
    void this.store.load();
  }

  protected readonly headcounts = computed(() => {
    const counts = new Map<string, number>();
    for (const employee of this.employees.employees()) {
      counts.set(employee.department, (counts.get(employee.department) ?? 0) + 1);
    }
    return counts;
  });

  protected readonly chartData = computed<BarDatum[]>(() =>
    this.store
      .departments()
      .map((department) => ({
        label: department.name,
        value: this.headcounts().get(department.name) ?? 0,
      }))
      .sort((a, b) => b.value - a.value),
  );

  protected readonly managers = computed(() =>
    this.employees
      .employees()
      .filter((employee) => employee.role === 'MANAGER' || employee.role === 'ADMIN'),
  );

  protected countFor(name: string): number {
    return this.headcounts().get(name) ?? 0;
  }

  protected headName(headId: number | null): string {
    if (headId === null) {
      return 'Not assigned';
    }
    const head = this.employees.byId(headId);
    return head ? fullName(head) : 'Not assigned';
  }

  protected startCreate(): void {
    this.editing.set(null);
    this.form.reset({ name: '', code: '', headId: null, description: '' });
    this.showForm.set(true);
  }

  protected startEdit(department: DepartmentRecord): void {
    this.editing.set(department);
    this.form.reset({
      name: department.name,
      code: department.code,
      headId: department.headId,
      description: department.description,
    });
    this.showForm.set(true);
  }

  protected showError(name: 'name' | 'code'): boolean {
    const control = this.form.controls[name];
    return control.invalid && control.touched;
  }

  protected async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const draft = {
      name: value.name.trim(),
      code: value.code.trim().toUpperCase(),
      headId: value.headId ? Number(value.headId) : null,
      description: value.description.trim(),
    };

    const existing = this.editing();
    if (existing) {
      await this.store.update(existing.id, draft);
    } else {
      await this.store.create(draft);
    }

    this.showForm.set(false);
    this.editing.set(null);
  }

  protected async confirmDelete(): Promise<void> {
    const department = this.deleting();
    this.deleting.set(null);
    if (department) {
      await this.store.remove(department.id);
    }
  }
}
