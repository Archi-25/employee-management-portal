import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { ApiError } from '@core/models/api.model';
import { AttendanceRecord, AttendanceStatus } from '@core/models/hr.model';
import { HrService } from '@core/services/hr.service';

interface AttendanceState {
  records: AttendanceRecord[];
  date: string;
  status: AttendanceStatus | 'ALL';
  search: string;
  loading: boolean;
  error: string | null;
}

/** Most recent weekday, so the page opens on a day that has data. */
function defaultDate(): string {
  const date = new Date();
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() - 1);
  }
  return date.toISOString().slice(0, 10);
}

export const AttendanceStore = signalStore(
  { providedIn: 'root' },
  withState<AttendanceState>({
    records: [],
    date: defaultDate(),
    status: 'ALL',
    search: '',
    loading: false,
    error: null,
  }),

  withComputed(({ records, status }) => ({
    forDate: computed(() =>
      records().filter((record) => status() === 'ALL' || record.status === status()),
    ),
    present: computed(() => records().filter((r) => r.status === 'PRESENT').length),
    absent: computed(() => records().filter((r) => r.status === 'ABSENT').length),
    late: computed(() => records().filter((r) => r.status === 'LATE').length),
    onLeave: computed(() => records().filter((r) => r.status === 'ON_LEAVE').length),
    attendanceRate: computed(() => {
      const total = records().length;
      if (total === 0) {
        return 0;
      }
      const here = records().filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
      return Math.round((here / total) * 100);
    }),
  })),

  withMethods((store) => {
    const service = inject(HrService);

    return {
      async load(): Promise<void> {
        patchState(store, { loading: true, error: null });
        try {
          const records = await firstValueFrom(service.attendance({ date: store.date() }));
          patchState(store, { records, loading: false });
        } catch (error) {
          patchState(store, {
            loading: false,
            error: (error as ApiError)?.message ?? 'Unable to load attendance.',
          });
        }
      },

      setDate(date: string): void {
        patchState(store, { date });
      },
      setStatus(status: AttendanceStatus | 'ALL'): void {
        patchState(store, { status });
      },
      setSearch(search: string): void {
        patchState(store, { search });
      },
    };
  }),
);
