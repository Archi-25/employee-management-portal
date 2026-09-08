import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Observer, Subscriber, timer } from 'rxjs';
import { filter, map, shareReplay, takeUntil, tap } from 'rxjs/operators';
import { Page } from '@core/models/api.model';
import {
  Employee,
  EmployeeDraft,
  EmployeeFilter,
  EmployeeStatus,
  fullName,
} from '@core/models/employee.model';
import { APP_CONFIG } from '@core/tokens/app-config.token';
import { Logger } from '@core/tokens/logger.token';

/** Payload pushed by {@link EmployeeService.headcountFeed}. */
export interface HeadcountTick {
  sequence: number;
  activeCount: number;
  emittedAt: number;
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly logger = inject(Logger);

  private get baseUrl(): string {
    return `${this.config.apiBaseUrl}/employees`;
  }

  /** MODULE 6 — `map` reshapes the envelope into a plain array. */
  list(filters?: Partial<EmployeeFilter>): Observable<Employee[]> {
    let params = new HttpParams();
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    if (filters?.department && filters.department !== 'ALL') {
      params = params.set('department', filters.department);
    }
    if (filters?.status && filters.status !== 'ALL') {
      params = params.set('status', filters.status);
    }

    return this.http.get<Page<Employee>>(this.baseUrl, { params }).pipe(map((page) => page.items));
  }

  getById(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.baseUrl}/${id}`);
  }

  create(draft: EmployeeDraft): Observable<Employee> {
    return this.http
      .post<Employee>(this.baseUrl, draft)
      .pipe(tap((created) => this.logger.info(`Created ${fullName(created)}`)));
  }

  update(id: number, patch: Partial<EmployeeDraft>): Observable<Employee> {
    return this.http
      .put<Employee>(`${this.baseUrl}/${id}`, patch)
      .pipe(tap((updated) => this.logger.info(`Updated ${fullName(updated)}`)));
  }

  remove(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`)
      .pipe(tap(() => this.logger.warn(`Deleted employee #${id}`)));
  }

  /**
   * MODULE 6 — a hand-written observable. The subscriber function is the
   * producer; the returned teardown runs on unsubscribe/complete/error, which is
   * what makes `takeUntil` able to stop the interval cleanly.
   */
  headcountFeed(intervalMs = 1200): Observable<HeadcountTick> {
    return new Observable<HeadcountTick>((subscriber: Subscriber<HeadcountTick>) => {
      let sequence = 0;
      this.logger.debug('headcountFeed: producer started');

      const handle = setInterval(() => {
        sequence += 1;
        subscriber.next({
          sequence,
          // Deterministic-ish jitter so the stream visibly changes.
          activeCount: 7 + (sequence % 4),
          emittedAt: Date.now(),
        });
        if (sequence >= 100) {
          subscriber.complete();
        }
      }, intervalMs);

      return () => {
        clearInterval(handle);
        this.logger.debug('headcountFeed: teardown executed');
      };
    }).pipe(shareReplay({ bufferSize: 1, refCount: true }));
  }

  /**
   * MODULE 6 — `filter` + `map` + `takeUntil` composed over the custom observable.
   * `notifier` is normally a `Subject` completed in `ngOnDestroy`.
   */
  evenHeadcountLabels(notifier: Observable<unknown>): Observable<string> {
    return this.headcountFeed().pipe(
      filter((tick) => tick.sequence % 2 === 0),
      map((tick) => `#${tick.sequence} · ${tick.activeCount} active`),
      takeUntil(notifier),
    );
  }

  /**
   * MODULE 6 — an explicit `Observer` object (next/error/complete) rather than
   * three positional callbacks. Returns the teardown so callers can cancel.
   */
  watchStatusChanges(observer: Observer<EmployeeStatus>, stop: Observable<unknown>): () => void {
    const cycle: EmployeeStatus[] = ['ACTIVE', 'ON_LEAVE', 'PROBATION', 'EXITED'];
    const subscription = timer(0, 900)
      .pipe(
        map((index) => cycle[index % cycle.length]),
        takeUntil(stop),
      )
      .subscribe(observer);

    return () => subscription.unsubscribe();
  }
}
