import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LOG_SINK, Logger } from '@core/tokens/logger.token';
import { Card } from '@shared/components/card/card';

@Component({
  selector: 'app-admin-audit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, Card],
  template: `
    <app-card heading="Audit log" [subtitle]="'Written through the ' + logger.scope + ' logger'">
      <div card-actions>
        <button type="button" class="btn btn--ghost btn--sm" (click)="write()">Write entry</button>
      </div>

      @if (entries.length) {
        <ul class="log">
          @for (entry of entries; track entry.at + entry.message) {
            <li>
              <span class="at">{{ entry.at | date: 'HH:mm:ss' }}</span>
              <code class="scope">{{ entry.scope }}</code>
              <span class="level level--{{ entry.level }}">{{ entry.level }}</span>
              <span class="msg">{{ entry.message }}</span>
            </li>
          }
        </ul>
      } @else {
        <p class="hint">Nothing logged yet.</p>
      }
    </app-card>
  `,
  styles: `
    .log { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.3rem; font-size: 0.8rem; }
    .log li { display: grid; grid-template-columns: 62px 96px 52px 1fr; gap: 0.5rem; align-items: baseline; }
    .at { color: var(--muted); font-variant-numeric: tabular-nums; }
    .scope { color: var(--accent); }
    .level { text-transform: uppercase; font-size: 0.64rem; letter-spacing: 0.06em; }
    .level--warn { color: #b45309; }
    .level--error { color: #b91c1c; }
    .level--info { color: #1d4ed8; }
    .level--debug { color: var(--muted); }
    .msg { word-break: break-word; }
  `,
})
export class AdminAudit {
  /** Module-scoped logger from `AdminModule.providers` (MODULE 5). */
  protected readonly logger = inject(Logger);
  protected readonly entries = inject(LOG_SINK);

  protected write(): void {
    this.logger.warn(`Manual audit entry at ${new Date().toLocaleTimeString()}`);
  }
}
