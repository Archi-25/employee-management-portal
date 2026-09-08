import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { Role } from '@core/models/employee.model';
import { AuthService } from '@core/services/auth.service';

/**
 * MODULE 2 — role-based STRUCTURAL directive.
 *
 * ```html
 * <button *appHasRole="'ADMIN'; else: denied">Delete</button>
 * <ng-template #denied>Ask an administrator.</ng-template>
 * ```
 *
 * The `*` syntax desugars to an `<ng-template>`; this directive owns that
 * template and stamps it into the view container only while the active role
 * clears the bar. The `effect` re-evaluates whenever the role signal changes.
 */
@Directive({
  selector: '[appHasRole]',
})
export class HasRoleDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly auth = inject(AuthService);

  /** Required role, or a list of acceptable roles. */
  readonly appHasRole = input.required<Role | readonly Role[]>();
  /** Rendered instead when the check fails — the `else` microsyntax key. */
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
