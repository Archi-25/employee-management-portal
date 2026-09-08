import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, SecurityContext, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Announcement } from '@core/models/announcement.model';
import { AnnouncementStore } from '@core/state/announcement.store';
import { Card } from '@shared/components/card/card';

@Component({
  selector: 'app-announcement-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, Card],
  template: `
    <app-card heading="Announcements" [subtitle]="subtitle()">
      <div card-actions>
        <ng-content select="[panel-actions]" />
      </div>

      @if (store.loading() && store.count() === 0) {
        <p class="hint">Loading announcements…</p>
      } @else if (store.ordered().length === 0) {
        <p class="hint">No announcements right now.</p>
      } @else {
        <ul class="feed">
          @for (item of visible(); track item.id) {
            <li class="feed__item" [class.is-pinned]="item.pinned">
              <div class="feed__head">
                <strong>{{ item.title }}</strong>
                @if (item.pinned) {
                  <span class="pin">Pinned</span>
                }
              </div>
              <!-- Sanitised by Angular before it reaches the DOM. -->
              <div class="feed__body" [innerHTML]="item.bodyHtml"></div>
              <small class="feed__meta">
                {{ item.author }} · {{ item.postedAt | date: 'mediumDate' }}
              </small>
            </li>
          }
        </ul>
      }
    </app-card>
  `,
  styleUrl: './announcement-panel.css',
})
export class AnnouncementPanel {
  protected readonly store = inject(AnnouncementStore);
  private readonly sanitizer = inject(DomSanitizer);

  readonly limit = input(3);

  protected visible(): Announcement[] {
    return this.store.ordered().slice(0, this.limit());
  }

  protected subtitle(): string {
    const total = this.store.count();
    return total === 0 ? 'Nothing posted' : `${total} posted`;
  }

  sanitizeBody(bodyHtml: string): SafeHtml {
    return this.sanitizer.sanitize(SecurityContext.HTML, bodyHtml) ?? '';
  }
}
