import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { Employee, fullName } from '@core/models/employee.model';

/**
 * Printable employee record, used by the Print button on a profile.
 *
 * `ViewEncapsulation.None` is deliberate and necessary here: `@page` rules and
 * `@media print` overrides have to apply to the whole document — the browser's
 * print box is not scoped to a component — so these styles must escape into
 * `document.head`. Every selector is namespaced under `.print-record` or
 * `.printing` to keep that escape hatch from becoming a mess.
 */
@Component({
  selector: 'app-print-record',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="print-record">
      <header class="print-record__head">
        <h1>{{ name() }}</h1>
        <p>{{ employee().title }} · {{ employee().department }}</p>
      </header>

      <dl class="print-record__facts">
        <div><dt>Employee ID</dt><dd>#{{ employee().id }}</dd></div>
        <div><dt>Email</dt><dd>{{ employee().email }}</dd></div>
        <div><dt>Location</dt><dd>{{ employee().location }}</dd></div>
        <div><dt>Status</dt><dd>{{ employee().status }}</dd></div>
        <div><dt>Joined</dt><dd>{{ employee().joinedOn }}</dd></div>
        <div><dt>Skills</dt><dd>{{ employee().skills.join(', ') || '—' }}</dd></div>
      </dl>

      <footer class="print-record__foot">
        Generated {{ today }} · Confidential — internal use only
      </footer>
    </section>
  `,
  styles: `
    /* Global by design — see the class comment. */
    @media print {
      @page {
        size: A4 portrait;
        margin: 18mm;
      }
      body.printing > *:not(.print-host) {
        display: none !important;
      }
      .print-record {
        color: #000;
        background: #fff;
      }
    }

    .print-record {
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1rem 1.1rem;
      background: var(--surface);
    }
    .print-record__head h1 { margin: 0; font-size: 1.2rem; }
    .print-record__head p { margin: 0.2rem 0 0.9rem; color: var(--muted); font-size: 0.85rem; }
    .print-record__facts { display: grid; gap: 0.4rem; margin: 0; }
    .print-record__facts div { display: flex; justify-content: space-between; gap: 1rem; font-size: 0.85rem; }
    .print-record__facts dt { color: var(--muted); }
    .print-record__facts dd { margin: 0; font-weight: 600; text-align: right; }
    .print-record__foot {
      margin-top: 1rem;
      padding-top: 0.6rem;
      border-top: 1px dashed var(--border);
      font-size: 0.72rem;
      color: var(--muted);
    }
  `,
})
export class PrintRecord {
  readonly employee = input.required<Employee>();
  protected readonly today = new Date().toLocaleDateString('en-GB');

  protected name(): string {
    return fullName(this.employee());
  }
}
