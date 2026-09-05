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
    .tile {
      border: 1px solid var(--border);
      border-left: 3px solid var(--tile-accent, var(--accent));
      border-radius: 10px;
      background: var(--surface);
      padding: 0.85rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .tile__label {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--muted);
    }
    .tile__value {
      font-size: 1.5rem;
      font-variant-numeric: tabular-nums;
      line-height: 1.1;
    }
    .tile__hint {
      font-size: 0.75rem;
      color: var(--muted);
    }
  `,
})
export class StatTile {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly hint = input('');
  readonly accent = input('#6366f1');
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
