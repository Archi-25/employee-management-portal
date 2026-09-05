import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, inject } from '@angular/core';
import { Employee } from '@core/models/employee.model';
import { RenderCountPipe } from '@shared/pipes/render-count.pipe';

/**
 * MODULE 3 — `ChangeDetectionStrategy.OnPush`.
 *
 * This view is checked only when one of these happens:
 *  1. an input receives a NEW REFERENCE (mutating the object in place is missed),
 *  2. an event fires from inside this view or its children,
 *  3. an `async` pipe or signal read in the template emits,
 *  4. `ChangeDetectorRef.markForCheck()` is called explicitly.
 *
 * Compare its counter with the Default panel's under identical traffic.
 */
@Component({
  selector: 'app-on-push-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, RenderCountPipe],
  template: `
    <div class="panel panel--onpush">
      <span class="panel__tag">OnPush</span>
      <p class="panel__name">{{ employee.firstName }} {{ employee.lastName }}</p>
      <!-- Pure pipe, not a method: recomputed only when salary changes. -->
      <p class="panel__salary">{{ employee.salary | currency: 'USD' : 'symbol' : '1.0-0' }}</p>
      <p class="panel__checks">
        checked <strong>{{ null | renderCount }}</strong> times
      </p>
      <button type="button" class="btn btn--ghost btn--sm" (click)="forceCheck()">
        markForCheck()
      </button>
    </div>
  `,
  styles: `
    .panel {
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 0.85rem;
      background: var(--surface);
    }
    .panel--onpush { border-left: 3px solid #16a34a; }
    .panel__tag {
      font-size: 0.68rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .panel__name { margin: 0.35rem 0 0; font-weight: 600; }
    .panel__salary { margin: 0.1rem 0; font-variant-numeric: tabular-nums; }
    .panel__checks { margin: 0.35rem 0 0.5rem; font-size: 0.8rem; color: var(--muted); }
  `,
})
export class OnPushPanel {
  @Input({ required: true }) employee!: Employee;

  private readonly cdr = inject(ChangeDetectorRef);

  /** Marks the path from this view to the root as dirty for the next pass. */
  forceCheck(): void {
    this.cdr.markForCheck();
  }
}
