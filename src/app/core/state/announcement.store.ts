import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { ApiError } from '@core/models/api.model';
import { Announcement, AnnouncementDraft } from '@core/models/announcement.model';
import { AnnouncementService } from '@core/services/announcement.service';
import { NotificationService } from '@core/services/notification.service';

interface AnnouncementState {
  announcements: Announcement[];
  loading: boolean;
  error: string | null;
}

const initialState: AnnouncementState = {
  announcements: [],
  loading: false,
  error: null,
};

export const AnnouncementStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed(({ announcements }) => ({
    ordered: computed(() =>
      [...announcements()].sort((a, b) => {
        if (a.pinned !== b.pinned) {
          return a.pinned ? -1 : 1;
        }
        return b.postedAt.localeCompare(a.postedAt);
      }),
    ),
    latest: computed(() => announcements()[0] ?? null),
    count: computed(() => announcements().length),
  })),

  withMethods((store) => {
    const service = inject(AnnouncementService);
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
          const announcements = await firstValueFrom(service.list());
          patchState(store, { announcements, loading: false });
        } catch (error) {
          fail(error, 'Unable to load announcements.');
        }
      },

      async publish(draft: AnnouncementDraft): Promise<void> {
        patchState(store, { loading: true, error: null });
        try {
          const created = await firstValueFrom(service.create(draft));
          patchState(store, (state) => ({
            announcements: [created, ...state.announcements],
            loading: false,
          }));
          notifications.success('Announcement published.');
        } catch (error) {
          fail(error, 'Unable to publish the announcement.');
        }
      },

      async remove(id: number): Promise<void> {
        patchState(store, { loading: true, error: null });
        try {
          await firstValueFrom(service.remove(id));
          patchState(store, (state) => ({
            announcements: state.announcements.filter((item) => item.id !== id),
            loading: false,
          }));
          notifications.success('Announcement removed.');
        } catch (error) {
          fail(error, 'Unable to remove the announcement.');
        }
      },
    };
  }),
);
