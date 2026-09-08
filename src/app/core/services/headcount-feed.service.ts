import { Injectable, inject } from '@angular/core';
import { Observable, Observer, Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { EmployeeStore } from '@core/state/employee.store';
import { Logger } from '@core/tokens/logger.token';

export interface PresenceSnapshot {
  onlineNow: number;
  checkedAt: number;
}

@Injectable({ providedIn: 'root' })
export class HeadcountFeedService {
  private readonly store = inject(EmployeeStore);
  private readonly logger = inject(Logger);

  presence(intervalMs = 5000): Observable<PresenceSnapshot> {
    return new Observable<PresenceSnapshot>((subscriber) => {
      this.logger.debug('presence feed: polling started');

      const emit = () => {
        const active = this.store.activeCount();
        // Stand-in for a presence endpoint: a stable fraction of active staff.
        const onlineNow = Math.max(0, Math.round(active * 0.6) + (Date.now() % 3));
        subscriber.next({ onlineNow, checkedAt: Date.now() });
      };

      emit();
      const handle = setInterval(emit, intervalMs);

      // Teardown — runs on unsubscribe, complete or error.
      return () => {
        clearInterval(handle);
        this.logger.debug('presence feed: polling stopped');
      };
    }).pipe(
      map((snapshot) => snapshot),
      distinctUntilChanged((a, b) => a.onlineNow === b.onlineNow),
    );
  }

  watch(observer: Observer<PresenceSnapshot>, intervalMs = 5000): Subscription {
    return this.presence(intervalMs).subscribe(observer);
  }
}
