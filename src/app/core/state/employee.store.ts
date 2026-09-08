import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { ApiError } from '@core/models/api.model';
import {
  EMPTY_FILTER,
  Employee,
  EmployeeDraft,
  EmployeeFilter,
  birthdayWithinDays,
} from '@core/models/employee.model';
import { EmployeeService } from '@core/services/employee.service';
import { NotificationService } from '@core/services/notification.service';

interface EmployeeState {
  employees: Employee[];
  filter: EmployeeFilter;
  selectedId: number | null;
  loading: boolean;
  error: string | null;
  loadedAt: number | null;
}

const initialState: EmployeeState = {
  employees: [],
  filter: EMPTY_FILTER,
  selectedId: null,
  loading: false,
  error: null,
  loadedAt: null,
};

function matches(employee: Employee, filter: EmployeeFilter): boolean {
  const term = filter.search.trim().toLowerCase();
  // Searchable by name, employee code, email and job title.
  const haystack =
    `${employee.firstName} ${employee.lastName} ${employee.code} ${employee.email} ${employee.title}`.toLowerCase();

  return (
    (term === '' || haystack.includes(term)) &&
    (filter.department === 'ALL' || employee.department === filter.department) &&
    (filter.status === 'ALL' || employee.status === filter.status) &&
    (filter.employmentType === 'ALL' || employee.employmentType === filter.employmentType) &&
    (filter.designation === 'ALL' || employee.title === filter.designation)
  );
}

/**
 * MODULE 9 — state management with `@ngrx/signals`. The store is the single
 * source of truth for the employee feature: state is signals, derived data is
 * `computed`, and every mutation goes through a method. No reducers, no effects
 * boilerplate, and it composes with `OnPush` for free.
 */
export const EmployeeStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed(({ employees, filter, selectedId }) => ({
    filtered: computed(() => employees().filter((employee) => matches(employee, filter()))),
    total: computed(() => employees().length),
    selected: computed(() => employees().find((e) => e.id === selectedId()) ?? null),
    headcountByDepartment: computed(() => {
      const counts = new Map<string, number>();
      for (const employee of employees()) {
        counts.set(employee.department, (counts.get(employee.department) ?? 0) + 1);
      }
      return [...counts.entries()]
        .map(([department, count]) => ({ department, count }))
        .sort((a, b) => b.count - a.count);
    }),
    activeCount: computed(
      () => employees().filter((employee) => employee.status === 'ACTIVE').length,
    ),
    onLeaveCount: computed(
      () => employees().filter((employee) => employee.status === 'ON_LEAVE').length,
    ),
    payrollTotal: computed(() => employees().reduce((sum, employee) => sum + employee.salary, 0)),
    /** Everyone who joined in the last 90 days. */
    recentJoiners: computed(() => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      const iso = cutoff.toISOString().slice(0, 10);
      return employees()
        .filter((employee) => employee.joinedOn >= iso)
        .sort((a, b) => b.joinedOn.localeCompare(a.joinedOn));
    }),
    /** Distinct job titles, for the designation filter. */
    designations: computed(() =>
      [...new Set(employees().map((employee) => employee.title))].sort((a, b) =>
        a.localeCompare(b),
      ),
    ),
    upcomingBirthdays: computed(() =>
      employees()
        .filter(
          (employee) =>
            employee.status !== 'EXITED' && birthdayWithinDays(employee.dateOfBirth, 14),
        )
        .sort((a, b) => a.dateOfBirth.slice(5).localeCompare(b.dateOfBirth.slice(5))),
    ),
  })),

  withMethods((store) => {
    const service = inject(EmployeeService);
    const notifications = inject(NotificationService);

    function fail(error: unknown, fallback: string): void {
      const message = (error as ApiError)?.message ?? fallback;
      patchState(store, { loading: false, error: message });
    }

    return {
      async load(): Promise<void> {
        patchState(store, { loading: true, error: null });
        try {
          const employees = await firstValueFrom(service.list());
          patchState(store, { employees, loading: false, loadedAt: Date.now() });
        } catch (error) {
          fail(error, 'Unable to load employees.');
        }
      },

      async create(draft: EmployeeDraft): Promise<void> {
        patchState(store, { loading: true, error: null });
        try {
          const created = await firstValueFrom(service.create(draft));
          patchState(store, (state) => ({
            employees: [created, ...state.employees],
            loading: false,
          }));
          notifications.success(`${created.firstName} added to the directory.`);
        } catch (error) {
          fail(error, 'Unable to create employee.');
        }
      },

      async update(id: number, patch: Partial<EmployeeDraft>): Promise<void> {
        patchState(store, { loading: true, error: null });
        try {
          const updated = await firstValueFrom(service.update(id, patch));
          patchState(store, (state) => ({
            employees: state.employees.map((e) => (e.id === id ? updated : e)),
            loading: false,
          }));
          notifications.success('Changes saved.');
        } catch (error) {
          fail(error, 'Unable to update employee.');
        }
      },

      async remove(id: number): Promise<void> {
        patchState(store, { loading: true, error: null });
        try {
          await firstValueFrom(service.remove(id));
          patchState(store, (state) => ({
            employees: state.employees.filter((e) => e.id !== id),
            selectedId: state.selectedId === id ? null : state.selectedId,
            loading: false,
          }));
          notifications.success('Employee removed.');
        } catch (error) {
          fail(error, 'Unable to remove employee.');
        }
      },

      setFilter(patch: Partial<EmployeeFilter>): void {
        patchState(store, (state) => ({ filter: { ...state.filter, ...patch } }));
      },

      resetFilter(): void {
        patchState(store, { filter: EMPTY_FILTER });
      },

      select(selectedId: number | null): void {
        patchState(store, { selectedId });
      },

      /** Looks up a record without going back to the API. */
      byId(id: number): Employee | null {
        return store.employees().find((employee) => employee.id === id) ?? null;
      },
    };
  }),

  withHooks({
    onInit(store) {
      if (store.employees().length === 0) {
        void store.load();
      }
    },
  }),
);
