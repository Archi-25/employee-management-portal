import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { FEATURE_FLAGS } from '@core/tokens/feature-flags.token';

/**
 * Structural directive that keeps unreleased UI out of the DOM entirely:
 *
 * ```html
 * <button *appFeatureFlag="'admin.payroll-export'">Export payroll</button>
 * ```
 *
 * The `*` is sugar: Angular rewrites the line above into an `<ng-template>`
 * that this directive owns and stamps into the view container on demand.
 *
 * Reads the `FEATURE_FLAGS` multi-provider, so the root application and any
 * lazy-loaded module can each contribute their own flags.
 */
@Directive({
  selector: '[appFeatureFlag]',
})
export class FeatureFlagDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly flags = inject(FEATURE_FLAGS, { optional: true }) ?? [];

  private rendered = false;

  @Input()
  set appFeatureFlag(key: string) {
    const enabled = this.flags.some((flag) => flag.key === key && flag.enabled);

    if (enabled && !this.rendered) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.rendered = true;
    } else if (!enabled && this.rendered) {
      this.viewContainer.clear();
      this.rendered = false;
    }
  }
}
