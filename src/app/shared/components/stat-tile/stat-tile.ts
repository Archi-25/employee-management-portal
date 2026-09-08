import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-stat-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tile" [style.--tile-accent]="accent()">
      <span class="tile__label">{{ label() }}</span>
      <strong class="tile__value">{{ display() }}</strong>
      @if (hint()) {
        <span class="tile__hint">{{ hint() }}</span>
      }
    </div>
  `,
  styles: `
    /* The host is the grid item; without this the tile does not fill its cell
       and a row of tiles ends up with ragged heights. */
    :host {
      display: flex;
    }
    .tile {
      position: relative;
      flex: 1;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: var(--surface);
      padding: 0.9rem 1rem 0.95rem;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      overflow: hidden;
      box-shadow: var(--shadow-1);
      transition:
        box-shadow 140ms ease,
        transform 140ms ease;
    }
    /* Accent rail as a pseudo-element, so it follows the border radius. */
    .tile::before {
      content: '';
      position: absolute;
      inset: 0 auto 0 0;
      width: 3px;
      background: var(--tile-accent, var(--accent));
    }
    .tile:hover {
      box-shadow: var(--shadow-lift);
      transform: translateY(-1px);
    }
    .tile__label {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--muted);
    }
    .tile__value {
      font-size: 1.9rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      line-height: 1.12;
      /* Proportional figures: tabular digits make a large standalone number
         look loose. Tabular-nums belongs in table columns, not here. */
      font-variant-numeric: proportional-nums;
    }
    .tile__hint {
      font-size: 0.75rem;
      color: var(--muted);
      /* Pins the hint to the bottom so tiles with and without one still align. */
      margin-top: auto;
      padding-top: 0.25rem;
    }
    @media (prefers-reduced-motion: reduce) {
      .tile:hover {
        transform: none;
      }
    }
  `,
})
export class StatTile {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly hint = input('');
  readonly accent = input('var(--accent)');
  readonly currency = input(false);

  protected readonly display = computed(() => {
    const value = this.value();
    if (typeof value === 'number' && this.currency()) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value);
    }
    return typeof value === 'number' ? value.toLocaleString('en-US') : value;
  });
}
