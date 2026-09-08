import { Directive, ElementRef, Renderer2, effect, inject, input } from '@angular/core';
import { Role } from '@core/models/employee.model';

const PALETTE: Record<Role, { bg: string; fg: string }> = {
  ADMIN: { bg: '#fee2e2', fg: '#991b1b' },
  MANAGER: { bg: '#e0e7ff', fg: '#3730a3' },
  EMPLOYEE: { bg: '#dcfce7', fg: '#166534' },
  GUEST: { bg: '#e5e7eb', fg: '#374151' },
};

@Directive({
  selector: '[appRoleBadge]',
})
export class RoleBadgeDirective {
  private readonly renderer = inject(Renderer2);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly appRoleBadge = input.required<Role>();

  private badge: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const role = this.appRoleBadge();
      const { bg, fg } = PALETTE[role];

      if (!this.badge) {
        this.badge = this.renderer.createElement('span') as HTMLElement;
        this.renderer.addClass(this.badge, 'role-badge');
        this.renderer.appendChild(this.host.nativeElement, this.badge);
      }

      // Replace the text node rather than assigning innerHTML — no injection surface.
      this.renderer.setProperty(this.badge, 'textContent', role);
      this.renderer.setStyle(this.badge, 'background-color', bg);
      this.renderer.setStyle(this.badge, 'color', fg);
      this.renderer.setAttribute(this.badge, 'aria-label', `Role: ${role}`);
    });
  }
}
