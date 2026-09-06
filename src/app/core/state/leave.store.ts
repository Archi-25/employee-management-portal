import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { ApiError } from '@core/models/api.model';
import { LeaveBalance, LeaveDraft, LeaveRequest, LeaveStatus } from '@core/models/hr.model';
import { HrService } from '@core/services/hr.service';
import { NotificationService } from '@core/services/notification.service';

interface LeaveState {
  requests: LeaveRequest[];
  balances: LeaveBalance[];
  status: LeaveStatus | 'ALL';
  loading: boolean;
  error: string | null;
}

export const LeaveStore = signalStore(
  { providedIn: 'root' },
  withState<LeaveState>({
    requests: [],
    balances: [],
    status: 'ALL',
    loading: false,
    error: null,
  }),

  withComputed(({ requests, status }) => ({
    visible: computed(() =>
      requests().filter((request) => status() === 'ALL' || request.status === status()),
    ),
    pending: computed(() => requests().filter((r) => r.status === 'PENDING')),
    pendingCount: computed(() => requests().filter((r) => r.status === 'PENDING').length),
    approvedCount: computed(() => requests().filter((r) => r.status === 'APPROVED').length),
    rejectedCount: computed(() => requests().filter((r) => r.status === 'REJECTED').length),
  })),

  withMethods((store) => {
    const service = inject(HrService);
    const notifications = inject(NotificationService);

    function fail(error: unknown, fallback: string): void {
      patchState(store, {
        loading: false,
        error: (error as ApiError)?.message ?? fallback,
      });
    }

    return {
      async load(): Promise<void> {
        patchState(store, { loading: true, error: null });
        try {
          const [requests, balances] = await Promise.all([
            firstValueFrom(service.leave()),
            firstValueFrom(service.leaveBalances()),
          ]);
          patchState(store, { requests, balances, loading: false });
        } catch (error) {
          fail(error, 'Unable to load leave requests.');
        }
      },

      async apply(draft: LeaveDraft): Promise<void> {
        patchState(store, { loading: true, error: null });
        try {
          const created = await firstValueFrom(service.applyForLeave(draft));
          patchState(store, (state) => ({
            requests: [created, ...state.requests],
            loading: false,
          }));
          notifications.success('Leave request submitted for approval.');
        } catch (error) {
          fail(error, 'Unable to submit the request.');
        }
      },

      async decide(id: number, approve: boolean, decidedBy: string): Promise<void> {
        patchState(store, { loading: true, error: null });
        try {
          const updated = await firstValueFrom(service.decideLeave(id, approve, decidedBy));
          const balances = await firstValueFrom(service.leaveBalances());
          patchState(store, (state) => ({
            requests: state.requests.map((request) => (request.id === id ? updated : request)),
            balances,
            loading: false,
          }));
          notifications.success(approve ? 'Leave approved.' : 'Leave rejected.');
        } catch (error) {
          fail(error, 'Unable to record the decision.');
        }
      },

      setStatus(status: LeaveStatus | 'ALL'): void {
        patchState(store, { status });
      },

      balanceFor(employeeId: number): LeaveBalance | null {
        return store.balances().find((balance) => balance.employeeId === employeeId) ?? null;
      },
    };
  }),
);
