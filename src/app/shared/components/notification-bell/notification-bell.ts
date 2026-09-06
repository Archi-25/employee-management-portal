import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppNotification } from '@core/models/hr.model';
import { NotificationStore } from '@core/state/notification.store';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';

const ICONS: Record<AppNotification['kind'], string> = {
  leave: '🗓️',
  joiner: '👋',
  payroll: '💳',
  birthday: '🎂',
  system: '⚙️',
};

@Component({
  selector: 'app-notification-bell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, ClickOutsideDirective],
  template: `
    <div class="bell" (appClickOutside)="open.set(false)">
      <button
        type="button"
        class="bell__trigger"
        [attr.aria-expanded]="open()"
        [attr.aria-label]="label()"
        (click)="toggle()"
      >
        <span aria-hidden="true">🔔</span>
        @if (store.unreadCount() > 0) {
          <span class="bell__badge">{{ store.unreadCount() }}</span>
        }
      </button>

      @if (open()) {
        <div class="panel" role="menu">
          <header class="panel__head">
            <strong>Notifications</strong>
            @if (store.unreadCount() > 0) {
              <button type="button" class="panel__link" (click)="store.markAllRead()">
                Mark all read
              </button>
            }
          </header>

          @if (store.ordered().length) {
            <ul class="panel__list">
              @for (item of store.ordered(); track item.id) {
                <li [class.is-unread]="!item.read">
                  @if (item.link) {
                    <a [routerLink]="item.link" (click)="pick(item)">
                      <span class="icon" aria-hidden="true">{{ icon(item.kind) }}</span>
                      <span class="text">
                        {{ item.message }}
                        <small>{{ item.at | date: 'mediumDate' }}</small>
                      </span>
                    </a>
                  } @else {
                    <button type="button" (click)="pick(item)">
                      <span class="icon" aria-hidden="true">{{ icon(item.kind) }}</span>
                      <span class="text">
                        {{ item.message }}
                        <small>{{ item.at | date: 'mediumDate' }}</small>
                      </span>
                    </button>
                  }
                </li>
              }
            </ul>
          } @else {
            <p class="panel__empty">You are all caught up.</p>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './notification-bell.css',
})
export class NotificationBell {
  protected readonly store = inject(NotificationStore);
  protected readonly open = signal(false);

  protected toggle(): void {
    this.open.update((value) => !value);
  }

  protected label(): string {
    const unread = this.store.unreadCount();
    return unread === 0 ? 'Notifications' : `Notifications, ${unread} unread`;
  }

  protected icon(kind: AppNotification['kind']): string {
    return ICONS[kind];
  }

  protected pick(item: AppNotification): void {
    void this.store.markRead(item.id);
    this.open.set(false);
  }
}
