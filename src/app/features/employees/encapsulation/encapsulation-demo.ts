import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { Card } from '@shared/components/card/card';

const SHARED_STYLES = `
  .swatch {
    border-radius: 8px;
    padding: 0.55rem 0.7rem;
    font-weight: 600;
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }
`;

/**
 * MODULE 1 — `ViewEncapsulation.Emulated` (the default).
 * Angular rewrites the selector to `.swatch[_ngcontent-xyz]` and stamps a
 * matching attribute on this component's elements. Styles cannot leak out, and
 * page-level styles for `.swatch` still reach in (attribute selectors only add
 * specificity, they do not isolate).
 */
@Component({
  selector: 'app-encapsulation-emulated',
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="swatch">Emulated — scoped by generated attributes</div>
    <p class="note">Inspect the DOM: this element carries an <code>_ngcontent-*</code> attribute.</p>
  `,
  styles: SHARED_STYLES + `.note { font-size: 0.78rem; color: var(--muted); margin: 0.4rem 0 0; }`,
})
export class EncapsulationEmulated {}

/**
 * MODULE 1 — `ViewEncapsulation.None`.
 * The styles are injected into `document.head` verbatim and apply to the WHOLE
 * page. This is why the sibling "leak target" below changes colour.
 */
@Component({
  selector: 'app-encapsulation-none',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="swatch swatch--global">None — styles escape into the document</div>
    <p class="note">This component's rule also repaints anything else matching the selector.</p>
  `,
  styles: `
    .swatch--global,
    .leak-target {
      background: #dcfce7 !important;
      color: #166534 !important;
      border: 1px dashed #16a34a !important;
      border-radius: 8px;
      padding: 0.55rem 0.7rem;
      font-weight: 600;
    }
  `,
})
export class EncapsulationNone {}

/**
 * MODULE 1 — `ViewEncapsulation.ShadowDom`.
 * A real shadow root: styles are genuinely isolated in BOTH directions, so
 * global page styles do not reach in either. Only inherited properties and
 * custom properties cross the boundary.
 */
@Component({
  selector: 'app-encapsulation-shadow',
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="swatch">ShadowDom — isolated in both directions</div>
    <p class="note">Global <code>.swatch</code> rules cannot reach this element.</p>
  `,
  styles:
    SHARED_STYLES +
    `
    :host { display: block; }
    .swatch { background: #e0e7ff; color: #3730a3; border-color: #c7d2fe; }
    .note { font-size: 0.78rem; opacity: 0.7; margin: 0.4rem 0 0; }
  `,
})
export class EncapsulationShadow {}

@Component({
  selector: 'app-encapsulation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, EncapsulationEmulated, EncapsulationNone, EncapsulationShadow],
  template: `
    <header class="page-head">
      <h1>View encapsulation</h1>
      <p>
        The same <code>.swatch</code> class is styled by three components using the three
        encapsulation modes. Compare the rendered DOM to see how each one is scoped.
      </p>
    </header>

    <div class="grid">
      <app-card heading="Emulated (default)" subtitle="Attribute-scoped, one-way isolation">
        <app-encapsulation-emulated />
      </app-card>

      <app-card heading="None" subtitle="Global styles — the escape hatch">
        <app-encapsulation-none />
      </app-card>

      <app-card heading="ShadowDom" subtitle="Native shadow root, two-way isolation">
        <app-encapsulation-shadow />
      </app-card>
    </div>

    <app-card heading="Leak target" subtitle="Owned by this page, not by any demo component">
      <div class="leak-target">
        This element is styled green by the <strong>None</strong> component above, proving its
        styles escaped their component.
      </div>
    </app-card>
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .leak-target {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.55rem 0.7rem;
    }
  `,
})
export class EncapsulationPage {}
