import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

export interface BarDatum {
  label: string;
  value: number;
  /** Optional in-app link for the category. */
  link?: unknown[];
}

/**
 * Horizontal bar chart for a single measure across categories.
 *
 * One measure means ONE colour: the category is already named on the axis, so
 * colouring each bar differently would encode nothing and would fail the
 * palette's CVD gates for no benefit. Bars are horizontal because category
 * names are long enough to collide when rotated under vertical bars.
 *
 * Every value is directly labelled and the same numbers are available as a
 * table, so the chart never depends on colour or on hover to be readable.
 */
@Component({
  selector: 'app-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chart" [class.chart--compact]="compact()">
      @if (data().length === 0) {
        <p class="empty">No data to show.</p>
      } @else {
        <ul class="bars">
          @for (item of data(); track item.label) {
            <li
              class="bar"
              [class.is-hovered]="hovered() === item.label"
              (mouseenter)="hovered.set(item.label)"
              (mouseleave)="hovered.set(null)"
              (focusin)="hovered.set(item.label)"
              (focusout)="hovered.set(null)"
            >
              <span class="bar__label" [title]="item.label">{{ item.label }}</span>

              <span class="bar__track" role="img"
                    [attr.aria-label]="item.label + ': ' + item.value + ' ' + unit()">
                <span class="bar__fill" [style.width.%]="percent(item.value)"></span>
              </span>

              <span class="bar__value">{{ item.value }}</span>
            </li>
          }
        </ul>

        <details class="table-view">
          <summary>View as table</summary>
          <table>
            <caption class="sr-only">{{ caption() }}</caption>
            <thead>
              <tr><th scope="col">{{ categoryLabel() }}</th><th scope="col">{{ unit() }}</th></tr>
            </thead>
            <tbody>
              @for (item of data(); track item.label) {
                <tr><th scope="row">{{ item.label }}</th><td>{{ item.value }}</td></tr>
              }
            </tbody>
          </table>
        </details>
      }
    </div>
  `,
  styleUrl: './bar-chart.css',
})
export class BarChart {
  readonly data = input.required<BarDatum[]>();
  readonly unit = input('employees');
  readonly categoryLabel = input('Category');
  readonly caption = input('Distribution by category');
  readonly compact = input(false);

  protected readonly hovered = signal<string | null>(null);

  private readonly max = computed(() =>
    this.data().reduce((highest, item) => Math.max(highest, item.value), 0),
  );

  protected percent(value: number): number {
    const max = this.max();
    return max === 0 ? 0 : (value / max) * 100;
  }
}
