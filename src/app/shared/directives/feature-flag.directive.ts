import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { FEATURE_FLAGS } from '@core/tokens/feature-flags.token';

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
