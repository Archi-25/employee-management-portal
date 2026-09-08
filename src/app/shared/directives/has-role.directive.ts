import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { Role } from '@core/models/employee.model';
import { AuthService } from '@core/services/auth.service';

@Directive({
  selector: '[appHasRole]',
})
export class HasRoleDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly auth = inject(AuthService);

  readonly appHasRole = input.required<Role | readonly Role[]>();
  readonly appHasRoleElse = input<TemplateRef<unknown> | null>(null);

  private rendered: 'granted' | 'denied' | null = null;

  constructor() {
    effect(() => {
      const granted = this.auth.hasRole(this.appHasRole());
      const next = granted ? 'granted' : 'denied';
      if (this.rendered === next) {
        return;
      }

      this.viewContainer.clear();
      const template = granted ? this.templateRef : this.appHasRoleElse();
      if (template) {
        this.viewContainer.createEmbeddedView(template);
      }
      this.rendered = next;
    });
  }
}
