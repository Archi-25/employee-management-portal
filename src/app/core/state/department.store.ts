import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { ApiError } from '@core/models/api.model';
import { DepartmentDraft, DepartmentRecord } from '@core/models/hr.model';
import { HrService } from '@core/services/hr.service';
import { NotificationService } from '@core/services/notification.service';

interface DepartmentState {
  departments: DepartmentRecord[];
  loading: boolean;
  error: string | null;
}

export const DepartmentStore = signalStore(
  { providedIn: 'root' },
  withState<DepartmentState>({ departments: [], loading: false, error: null }),

  withComputed(({ departments }) => ({
    count: computed(() => departments().length),
    byName: computed(() => new Map(departments().map((d) => [d.name, d]))),
  })),

  withMethods((store) => {
    const service = inject(HrService);
    const notifications = inject(NotificationService);

    function fail(error: unknown, fallback: string): void {
      const message = (error as ApiError)?.message ?? fallback;
      patchState(store, { loading: false, error: message });
    }

    return {
      async load(): Promise<void> {
        patchState(store, { loading: true, error: null });
        try {
          const departments = await firstValueFrom(service.departments());
          patchState(store, { departments, loading: false });
        } catch (error) {
          fail(error, 'Unable to load departments.');
        }
      },

      async create(draft: DepartmentDraft): Promise<void> {
        patchState(store, { loading: true, error: null });
        try {
          const created = await firstValueFrom(service.createDepartment(draft));
          patchState(store, (state) => ({
            departments: [...state.departments, created],
            loading: false,
          }));
          notifications.success(`${created.name} created.`);
        } catch (error) {
          fail(error, 'Unable to create the department.');
        }
      },

      async update(id: number, draft: DepartmentDraft): Promise<void> {
        patchState(store, { loading: true, error: null });
        try {
          const updated = await firstValueFrom(service.updateDepartment(id, draft));
          patchState(store, (state) => ({
            departments: state.departments.map((d) => (d.id === id ? updated : d)),
            loading: false,
          }));
          notifications.success('Department updated.');
        } catch (error) {
          fail(error, 'Unable to update the department.');
        }
      },

      async remove(id: number): Promise<void> {
        patchState(store, { loading: true, error: null });
        try {
          await firstValueFrom(service.deleteDepartment(id));
          patchState(store, (state) => ({
            departments: state.departments.filter((d) => d.id !== id),
            loading: false,
          }));
          notifications.success('Department removed.');
        } catch (error) {
          fail(error, 'Unable to remove the department.');
        }
      },
    };
  }),
);
