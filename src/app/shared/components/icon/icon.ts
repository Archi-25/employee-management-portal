import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Inline SVG icon set.
 *
 * Emoji were used here originally, which render differently on every platform
 * and cannot inherit colour or line weight. These are stroke icons on a 24×24
 * grid drawn with `currentColor`, so they take the surrounding text colour and
 * scale with the type.
 *
 * Every icon is expressed purely as `<path>` data — circles included, written as
 * arcs — so the template can loop over strings and never needs `innerHTML`.
 */
export type IconName =
  | 'dashboard'
  | 'users'
  | 'clock'
  | 'calendar'
  | 'building'
  | 'sliders'
  | 'sun'
  | 'moon'
  | 'monitor'
  | 'menu'
  | 'bell';

const PATHS: Record<IconName, readonly string[]> = {
  dashboard: ['M4 4h6v7H4z', 'M14 4h6v5h-6z', 'M14 13h6v7h-6z', 'M4 15h6v5H4z'],
  users: [
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    'M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    'M22 21v-2a4 4 0 0 0-3-3.87',
    'M16 3.13a4 4 0 0 1 0 7.75',
  ],
  clock: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0', 'M12 7v5l3 2'],
  calendar: [
    'M8 2v4',
    'M16 2v4',
    'M3 10h18',
    'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  ],
  building: [
    'M3 21h18',
    'M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16',
    'M9 7h2',
    'M13 7h2',
    'M9 11h2',
    'M13 11h2',
    'M10 21v-4h4v4',
  ],
  sliders: [
    'M4 21v-7',
    'M4 10V3',
    'M12 21v-9',
    'M12 8V3',
    'M20 21v-5',
    'M20 12V3',
    'M1 14h6',
    'M9 8h6',
    'M17 16h6',
  ],
  sun: [
    'M12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10',
    'M12 1v2',
    'M12 21v2',
    'M4.22 4.22l1.42 1.42',
    'M18.36 18.36l1.42 1.42',
    'M1 12h2',
    'M21 12h2',
    'M4.22 19.78l1.42-1.42',
    'M18.36 5.64l1.42-1.42',
  ],
  moon: ['M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'],
  monitor: [
    'M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z',
    'M8 20h8',
    'M12 16v4',
  ],
  menu: ['M3 6h18', 'M3 12h18', 'M3 18h18'],
  bell: ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'],
};

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="weight()"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      @for (d of paths(); track d) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: none;
    }
    svg {
      display: block;
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(16);
  readonly weight = input(1.75);

  protected readonly paths = computed(() => PATHS[this.name()] ?? []);
}
