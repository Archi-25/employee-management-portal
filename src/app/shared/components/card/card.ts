import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

/**
 * The surface every panel in the portal sits on.
 *
 * Three projection slots: a `select`-ed header, a `select`-ed actions area, and
 * the catch-all `<ng-content>` for the body. Projected content is compiled in
 * the PARENT's context, so the parent's bindings and change-detection strategy
 * govern it — not this component's.
 *
 * `ViewEncapsulation.Emulated` is stated explicitly rather than left implicit,
 * because the two components beside it in this folder deliberately choose
 * otherwise and the contrast is the point:
 *
 *   Emulated  (here)              Angular rewrites `.card` to `.card[_ngcontent-x]`
 *                                 and stamps the attribute on this view's nodes.
 *                                 Styles cannot leak out; page styles still reach
 *                                 in. The right default for almost everything.
 *   None      (print-record)      Styles are injected into document.head verbatim.
 *                                 Needed there because `@page` rules are not
 *                                 scopeable to a component.
 *   ShadowDom (badge-widget)      A real shadow root: isolated in BOTH directions,
 *                                 so a host page cannot restyle an embedded badge.
 */
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

      <!-- Always rendered; collapses itself when nothing is projected, so a
           caller never has to remember to announce that it has a footer. -->
      <footer class="card__foot">
        <ng-content select="[card-footer]" />
      </footer>
    </section>
  `,
  styles: `
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.15rem 1.25rem;
      box-shadow: 0 1px 2px rgb(15 23 42 / 6%);
    }
    .card__head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }
    .card__title h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      letter-spacing: -0.01em;
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
  /** Fallback heading, used when no `[card-title]` content is projected. */
  readonly heading = input('');
  readonly subtitle = input('');
}
