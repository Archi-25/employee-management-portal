import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { Observable, Observer, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap, takeUntil } from 'rxjs/operators';
import { EmployeeStatus } from '@core/models/employee.model';
import { EmployeeService, HeadcountTick } from '@core/services/employee.service';
import { Card } from '@shared/components/card/card';

/**
 * MODULE 6 — a hand-rolled observable, an explicit Observer, and the operator
 * pipeline, all wired to visible output.
 */
@Component({
  selector: 'app-rxjs-lab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card],
  templateUrl: './rxjs-lab.html',
  styleUrl: './rxjs-lab.css',
})
export class RxjsLab implements OnDestroy {
  private readonly employees = inject(EmployeeService);

  /** The notifier every long-lived stream is tied to (MODULE 6 — takeUntil). */
  private readonly destroy$ = new Subject<void>();
  private readonly stopFeed$ = new Subject<void>();
  private readonly search$ = new Subject<string>();

  private feedSubscription: Subscription | null = null;
  private stopStatusWatch: (() => void) | null = null;

  protected readonly ticks = signal<HeadcountTick[]>([]);
  protected readonly evenLabels = signal<string[]>([]);
  protected readonly observerLog = signal<string[]>([]);
  protected readonly status = signal<EmployeeStatus | null>(null);
  protected readonly searchResults = signal<string[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly feedRunning = signal(false);
  protected readonly countdown = signal<number[]>([]);

  constructor() {
    // MODULE 6 — debounceTime + distinctUntilChanged + switchMap: the canonical
    // type-ahead. switchMap cancels the in-flight request when a newer term
    // arrives, so a slow response can never overwrite a fresh one.
    this.search$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((term) => this.employees.list({ search: term })),
        map((employees) => employees.map((e) => `${e.firstName} ${e.lastName} — ${e.title}`)),
        takeUntil(this.destroy$),
      )
      .subscribe((results) => this.searchResults.set(results));
  }

  ngOnDestroy(): void {
    // One notifier completes every subscription above — no manual bookkeeping.
    this.destroy$.next();
    this.destroy$.complete();
    this.stopFeed$.next();
    this.stopFeed$.complete();
    this.stopStatusWatch?.();
  }

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
    this.search$.next(term);
  }

  /** Subscribes to the custom observable built with `new Observable(...)`. */
  protected startFeed(): void {
    if (this.feedRunning()) {
      return;
    }
    this.feedRunning.set(true);
    this.ticks.set([]);
    this.evenLabels.set([]);

    this.feedSubscription = this.employees
      .headcountFeed(900)
      .pipe(takeUntil(this.stopFeed$))
      .subscribe((tick) => this.ticks.update((list) => [tick, ...list].slice(0, 6)));

    // Second subscriber on the same shareReplay'd source, with filter + map.
    this.employees
      .evenHeadcountLabels(this.stopFeed$)
      .pipe(takeUntil(this.destroy$))
      .subscribe((label) => this.evenLabels.update((list) => [label, ...list].slice(0, 6)));
  }

  protected stopFeed(): void {
    this.stopFeed$.next();
    this.feedSubscription?.unsubscribe();
    this.feedSubscription = null;
    this.feedRunning.set(false);
  }

  /**
   * MODULE 6 — subscribing with an `Observer` object rather than callbacks, so
   * `next`, `error` and `complete` are all named and all handled.
   */
  protected watchStatuses(): void {
    this.stopStatusWatch?.();
    this.observerLog.set([]);

    const observer: Observer<EmployeeStatus> = {
      next: (value) => {
        this.status.set(value);
        this.observerLog.update((log) => [`next → ${value}`, ...log].slice(0, 6));
      },
      error: (error: unknown) => {
        this.observerLog.update((log) => [`error → ${String(error)}`, ...log]);
      },
      complete: () => {
        this.observerLog.update((log) => ['complete', ...log]);
      },
    };

    this.stopStatusWatch = this.employees.watchStatusChanges(observer, this.destroy$);
  }

  /** A second bespoke observable, created and consumed inline. */
  protected runCountdown(): void {
    this.countdown.set([]);

    const countdown$ = new Observable<number>((subscriber) => {
      let value = 5;
      const handle = setInterval(() => {
        subscriber.next(value);
        value -= 1;
        if (value < 0) {
          subscriber.complete();
        }
      }, 400);
      // Teardown: runs on complete, error, or unsubscribe.
      return () => clearInterval(handle);
    });

    countdown$
      .pipe(
        filterPositive(),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (value) => this.countdown.update((list) => [...list, value]),
        complete: () => this.countdown.update((list) => [...list, 0]),
      });
  }
}

/** A tiny custom operator: operators are just `Observable → Observable`. */
function filterPositive() {
  return (source: Observable<number>): Observable<number> =>
    new Observable<number>((subscriber) => {
      const subscription = source.subscribe({
        next: (value) => {
          if (value > 0) {
            subscriber.next(value);
          }
        },
        error: (error: unknown) => subscriber.error(error),
        complete: () => subscriber.complete(),
      });
      return () => subscription.unsubscribe();
    });
}
