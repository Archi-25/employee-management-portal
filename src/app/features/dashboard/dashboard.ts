import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observer, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Employee } from '@core/models/employee.model';
import { AuthService } from '@core/services/auth.service';
import { HeadcountFeedService, PresenceSnapshot } from '@core/services/headcount-feed.service';
import { AnnouncementStore } from '@core/state/announcement.store';
import { EmployeeStore } from '@core/state/employee.store';
import { AnnouncementPanel } from '@features/announcements/announcement-panel';
import { Card } from '@shared/components/card/card';
import { StatTile } from '@shared/components/stat-tile/stat-tile';
import { HasRoleDirective } from '@shared/directives/has-role.directive';
import { InitialsPipe } from '@shared/pipes/initials.pipe';
import { TenurePipe } from '@shared/pipes/tenure.pipe';

const RECENT_JOINER_COUNT = 4;

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    RouterLink,
    AnnouncementPanel,
    Card,
    StatTile,
    HasRoleDirective,
    InitialsPipe,
    TenurePipe,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnDestroy {
  protected readonly store = inject(EmployeeStore);
  protected readonly announcements = inject(AnnouncementStore);
  protected readonly auth = inject(AuthService);
  private readonly feed = inject(HeadcountFeedService);

  private readonly destroy$ = new Subject<void>();
  private presenceSub: Subscription | null = null;

  protected readonly presence = signal<PresenceSnapshot | null>(null);

  protected readonly recentJoiners = computed<Employee[]>(() =>
    [...this.store.employees()]
      .filter((employee) => employee.status !== 'EXITED')
      .sort((a, b) => b.joinedOn.localeCompare(a.joinedOn))
      .slice(0, RECENT_JOINER_COUNT),
  );

  protected readonly onLeave = computed(() =>
    this.store.employees().filter((employee) => employee.status === 'ON_LEAVE'),
  );

  protected readonly departments = computed(() => this.store.headcountByDepartment());

  constructor() {
    void this.announcements.load();

    // Explicit Observer: next / error / complete each handled by name.
    const observer: Observer<PresenceSnapshot> = {
      next: (snapshot) => this.presence.set(snapshot),
      error: () => this.presence.set(null),
      complete: () => this.presence.set(null),
    };

    this.presenceSub = this.feed
      .presence()
      .pipe(takeUntil(this.destroy$))
      .subscribe(observer);
  }

  ngOnDestroy(): void {
    // One notifier closes the feed; the observable's teardown stops the timer.
    this.destroy$.next();
    this.destroy$.complete();
    this.presenceSub?.unsubscribe();
  }

  protected share(count: number): number {
    const total = this.store.total();
    return total === 0 ? 0 : (count / total) * 100;
  }
}
