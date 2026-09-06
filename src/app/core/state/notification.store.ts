import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { AppNotification } from '@core/models/hr.model';
import { HrService } from '@core/services/hr.service';

interface NotificationState {
  items: AppNotification[];
  loading: boolean;
}

/** Backs the bell menu in the header. */
export const NotificationStore = signalStore(
  { providedIn: 'root' },
  withState<NotificationState>({ items: [], loading: false }),

  withComputed(({ items }) => ({
    unread: computed(() => items().filter((item) => !item.read)),
    unreadCount: computed(() => items().filter((item) => !item.read).length),
    ordered: computed(() => [...items()].sort((a, b) => b.at.localeCompare(a.at))),
  })),

  withMethods((store) => {
    const service = inject(HrService);

    return {
      async load(): Promise<void> {
        patchState(store, { loading: true });
        try {
          const items = await firstValueFrom(service.notifications());
          patchState(store, { items, loading: false });
        } catch {
          // The bell is ancillary: a failure here must not interrupt the user.
          patchState(store, { loading: false });
        }
      },

      async markRead(id: number): Promise<void> {
        patchState(store, (state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, read: true } : item)),
        }));
        await firstValueFrom(service.markNotificationRead(id)).catch(() => null);
      },

      async markAllRead(): Promise<void> {
        patchState(store, (state) => ({
          items: state.items.map((item) => ({ ...item, read: true })),
        }));
        await firstValueFrom(service.markAllNotificationsRead()).catch(() => null);
      },
    };
  }),
);
