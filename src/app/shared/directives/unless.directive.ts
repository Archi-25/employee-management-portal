import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';

/**
 * MODULE 2 — a second structural directive, written the classic setter way to
 * show the desugaring plainly. This template:
 *
 * ```html
 * <p *appUnless="isValid">Fix the form first</p>
 * ```
 *
 * is compiled to:
 *
 * ```html
 * <ng-template [appUnless]="isValid"><p>Fix the form first</p></ng-template>
 * ```
 */
@Directive({
  selector: '[appUnless]',
})
export class UnlessDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private hasView = false;

  @Input()
  set appUnless(condition: boolean) {
    if (!condition && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (condition && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
