import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import {
  DEPARTMENTS,
  EMPLOYEE_STATUSES,
  EMPLOYMENT_TYPES,
  Department,
  Employee,
  EmployeeStatus,
  EmploymentType,
  fullName,
} from '@core/models/employee.model';
import { AuthService } from '@core/services/auth.service';
import { EmployeeStore } from '@core/state/employee.store';
import { APP_CONFIG } from '@core/tokens/app-config.token';
import { Card } from '@shared/components/card/card';
import { StatTile } from '@shared/components/stat-tile/stat-tile';
import { ConfirmDialog } from '@shared/components/confirm-dialog/confirm-dialog';
import { DialogCloseDirective } from '@shared/directives/dialog-close.directive';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { HasRoleDirective } from '@shared/directives/has-role.directive';
import { TooltipDirective } from '@shared/directives/tooltip.directive';
import { InitialsPipe } from '@shared/pipes/initials.pipe';
import { TenurePipe } from '@shared/pipes/tenure.pipe';

const STATUS_CLASS: Record<EmployeeStatus, string> = {
  ACTIVE: 'status--good',
  PROBATION: 'status--warning',
  ON_LEAVE: 'status--serious',
  EXITED: 'status--critical',
};

type SortKey = 'name' | 'code' | 'department' | 'title' | 'joinedOn' | 'salary';

@Component({
  selector: 'app-employee-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    RouterLink,
    Card,
    StatTile,
    ConfirmDialog,
    DialogCloseDirective,
    ClickOutsideDirective,
    HasRoleDirective,
    TooltipDirective,
    InitialsPipe,
    TenurePipe,
  ],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css',
})
export class EmployeeList implements OnDestroy {
  protected readonly store = inject(EmployeeStore);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly config = inject(APP_CONFIG);

  private readonly destroy$ = new Subject<void>();
  private readonly searchInput$ = new Subject<string>();

  protected readonly departments = DEPARTMENTS;
  protected readonly statuses = EMPLOYEE_STATUSES;
  protected readonly employmentTypes = EMPLOYMENT_TYPES;

  protected readonly searchText = signal('');
  protected readonly sortKey = signal<SortKey>('name');
  protected readonly sortAsc = signal(true);
  protected readonly page = signal(1);
  protected readonly openMenuId = signal<number | null>(null);
  protected readonly pendingDelete = signal<Employee | null>(null);

  protected readonly pageSize = this.config.defaultPageSize;

  protected readonly sorted = computed(() => {
    const key = this.sortKey();
    const direction = this.sortAsc() ? 1 : -1;

    return [...this.store.filtered()].sort((a, b) => {
      if (key === 'salary') {
        return (a.salary - b.salary) * direction;
      }
      if (key === 'name') {
        return fullName(a).localeCompare(fullName(b)) * direction;
      }
      return String(a[key]).localeCompare(String(b[key])) * direction;
    });
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.sorted().length / this.pageSize)),
  );

  protected readonly visible = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.sorted().slice(start, start + this.pageSize);
  });

  constructor() {
    this.searchInput$
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.store.setFilter({ search: term });
        this.page.set(1);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onSearch(value: string): void {
    this.searchText.set(value);
    this.searchInput$.next(value);
  }

  protected onDepartment(value: string): void {
    this.store.setFilter({ department: value as Department | 'ALL' });
    this.page.set(1);
  }

  protected onStatus(value: string): void {
    this.store.setFilter({ status: value as EmployeeStatus | 'ALL' });
    this.page.set(1);
  }

  protected onEmploymentType(value: string): void {
    this.store.setFilter({ employmentType: value as EmploymentType | 'ALL' });
    this.page.set(1);
  }

  protected onDesignation(value: string): void {
    this.store.setFilter({ designation: value });
    this.page.set(1);
  }

  protected statusClass(status: EmployeeStatus): string {
    return STATUS_CLASS[status];
  }

  protected label(value: string): string {
    return value.replace('_', ' ');
  }

  protected readonly hasActiveFilters = computed(() => {
    const filter = this.store.filter();
    return (
      filter.search !== '' ||
      filter.department !== 'ALL' ||
      filter.status !== 'ALL' ||
      filter.employmentType !== 'ALL' ||
      filter.designation !== 'ALL'
    );
  });

  protected sortBy(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortAsc.update((ascending) => !ascending);
      return;
    }
    this.sortKey.set(key);
    this.sortAsc.set(true);
  }

  protected clearFilters(): void {
    this.searchText.set('');
    this.store.resetFilter();
    this.page.set(1);
  }

  protected goToPage(page: number): void {
    this.page.set(Math.min(Math.max(1, page), this.totalPages()));
  }

  protected toggleMenu(id: number): void {
    this.openMenuId.update((current) => (current === id ? null : id));
  }

  protected edit(employee: Employee): void {
    this.openMenuId.set(null);
    void this.router.navigate(['/employees', employee.id, 'edit']);
  }

  protected askToDelete(employee: Employee): void {
    this.openMenuId.set(null);
    this.pendingDelete.set(employee);
  }

  protected async confirmDelete(): Promise<void> {
    const employee = this.pendingDelete();
    this.pendingDelete.set(null);
    if (employee) {
      await this.store.remove(employee.id);
      this.goToPage(this.page());
    }
  }

  protected displayName(employee: Employee): string {
    return fullName(employee);
  }

  protected statusHint(status: EmployeeStatus): string {
    const hints: Record<EmployeeStatus, string> = {
      ACTIVE: 'Currently working',
      ON_LEAVE: 'On approved leave',
      PROBATION: 'Within probation period',
      EXITED: 'No longer with the company',
    };
    return hints[status];
  }
}
