import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated,
  template: `
    <section class="card">
      <header class="card__head">
        <div class="card__title">
          <ng-content select="[card-title]">
            <h3>{{ heading() }}</h3>
          </ng-content>
        </div>
        <div class="card__actions">
          <ng-content select="[card-actions]" />
        </div>
      </header>

      @if (subtitle()) {
        <p class="card__subtitle">{{ subtitle() }}</p>
      }

      <div class="card__body">
        <ng-content />
      </div>

      <footer class="card__foot">
        <ng-content select="[card-footer]" />
      </footer>
    </section>
  `,
  styles: `
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 1.15rem 1.25rem;
      box-shadow: var(--shadow-1);
      transition: box-shadow 160ms ease;
    }
    .card:hover {
      box-shadow: var(--shadow-lift);
    }
    .card__head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }
    .card__title h3 {
      margin: 0;
      font-size: 1.02rem;
      font-weight: 650;
      letter-spacing: -0.015em;
    }
    .card__subtitle {
      margin: 0.35rem 0 0;
      color: var(--muted);
      font-size: 0.85rem;
    }
    .card__body {
      margin-top: 0.9rem;
    }
    .card__foot {
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 1px dashed var(--border);
    }
    .card__foot:empty {
      display: none;
    }
  `,
})
export class Card {
  readonly heading = input('');
  readonly subtitle = input('');
}
