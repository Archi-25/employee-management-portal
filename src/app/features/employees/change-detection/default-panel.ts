import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Employee } from '@core/models/employee.model';
import { RenderCountPipe } from '@shared/pipes/render-count.pipe';

/**
 * MODULE 3 — `ChangeDetectionStrategy.Default`.
 *
 * Angular checks this view on EVERY change-detection pass of the application,
 * regardless of whether its inputs changed. The impure `renderCount` pipe makes
 * that visible: the counter climbs on unrelated activity such as a timer tick or
 * a keystroke elsewhere on the page.
 */
@Component({
  selector: 'app-default-panel',
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection -- opting out is the subject of this demo
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [RenderCountPipe],
  template: `
    <div class="panel panel--default">
      <span class="panel__tag">Default</span>
      <p class="panel__name">{{ employee.firstName }} {{ employee.lastName }}</p>
      <p class="panel__salary">{{ format(employee.salary) }}</p>
      <p class="panel__checks">
        checked <strong>{{ null | renderCount }}</strong> times
      </p>
    </div>
  `,
  styles: `
    .panel {
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 0.85rem;
      background: var(--surface);
    }
    .panel--default { border-left: 3px solid #dc2626; }
    .panel__tag {
      font-size: 0.68rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .panel__name { margin: 0.35rem 0 0; font-weight: 600; }
    .panel__salary { margin: 0.1rem 0; font-variant-numeric: tabular-nums; }
    .panel__checks { margin: 0.35rem 0 0; font-size: 0.8rem; color: var(--muted); }
  `,
})
export class DefaultPanel {
  @Input({ required: true }) employee!: Employee;

  /**
   * A method call in a template re-runs on every check. Kept here on purpose —
   * the OnPush panel uses a pure pipe instead, which is the fix.
   */
  format(salary: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(salary);
  }
}
