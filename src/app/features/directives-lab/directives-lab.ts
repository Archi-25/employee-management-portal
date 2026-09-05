import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ROLES, Role } from '@core/models/employee.model';
import { AuthService } from '@core/services/auth.service';
import { Card } from '@shared/components/card/card';
import { HasRoleDirective } from '@shared/directives/has-role.directive';
import { HighlightDirective } from '@shared/directives/highlight.directive';
import { RoleBadgeDirective } from '@shared/directives/role-badge.directive';
import { UnlessDirective } from '@shared/directives/unless.directive';

/** MODULE 2 — every custom directive on one page, each with its own controls. */
@Component({
  selector: 'app-directives-lab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, HasRoleDirective, HighlightDirective, RoleBadgeDirective, UnlessDirective],
  template: `
    <header class="page-head">
      <h1>Custom directives</h1>
      <p>
        Two structural directives and two attribute directives, covering
        <code>Renderer2</code>, <code>&#64;HostListener</code> and <code>&#64;HostBinding</code>.
      </p>
    </header>

    <app-card heading="Role switcher" subtitle="Drives every role-based directive below">
      <div class="row">
        @for (role of roles; track role) {
          <button
            type="button"
            class="btn btn--ghost btn--sm"
            [class.is-current]="auth.role() === role"
            (click)="auth.switchRole(role)"
          >
            {{ role }}
          </button>
        }
        <span class="spacer"></span>
        <span [appRoleBadge]="auth.role()" class="badge-host"></span>
      </div>
    </app-card>

    <div class="grid">
      <app-card
        heading="*appHasRole"
        subtitle="Structural · adds or removes the element from the DOM"
      >
        <div *appHasRole="'ADMIN'; else: notAdmin" class="panel panel--ok">
          Visible to ADMIN only. Inspect the DOM — when hidden, the element does not exist at all,
          which is the difference from <code>[hidden]</code> or <code>display:none</code>.
        </div>
        <ng-template #notAdmin>
          <div class="panel panel--muted">
            Fallback template rendered by the <code>else</code> branch. Current role:
            <strong>{{ auth.role() }}</strong>.
          </div>
        </ng-template>

        <div *appHasRole="['MANAGER', 'ADMIN']" class="panel panel--ok">
          Accepts an array too — MANAGER or above.
        </div>
      </app-card>

      <app-card heading="*appUnless" subtitle="Structural · the inverse of *ngIf">
        <label class="check">
          <input type="checkbox" [checked]="approved()" (change)="approved.set(!approved())" />
          <span>Record approved</span>
        </label>
        <div *appUnless="approved()" class="panel panel--warn">
          Shown while <code>approved</code> is false. Written with a plain
          <code>&#64;Input</code> setter to make the <code>&lt;ng-template&gt;</code> desugaring
          obvious.
        </div>
      </app-card>

      <app-card
        heading="appHighlight"
        subtitle="Renderer2 + @HostListener + @HostBinding"
      >
        <div class="hover-targets">
          <p [appHighlight]="'#e0e7ff'" highlightLabel="indigo">
            Hover or focus me. <code>&#64;HostListener</code> catches
            <code>mouseenter</code>/<code>focus</code>, <code>Renderer2</code> sets the background,
            and <code>&#64;HostBinding</code> toggles the <code>is-highlighted</code> class and
            pins <code>tabindex="0"</code>.
          </p>
          <p [appHighlight]="'#fef3c7'" highlightLabel="amber">
            A second instance with a different colour. Press <kbd>Esc</kbd> while focused — the
            keydown host listener cancels the highlight.
          </p>
        </div>
      </app-card>

      <app-card heading="appRoleBadge" subtitle="Renderer2 builds the DOM imperatively">
        <div class="badges">
          @for (role of roles; track role) {
            <span [appRoleBadge]="role" class="badge-host"></span>
          }
        </div>
        <p class="hint">
          Each host element starts empty; the directive creates the child span, sets its text with
          <code>setProperty</code> and styles it with <code>setStyle</code> — never
          <code>innerHTML</code>, so there is no injection surface.
        </p>
      </app-card>
    </div>
  `,
  styles: `
    :host { display: block; display: grid; gap: 1rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
    .panel {
      border-radius: 8px;
      padding: 0.55rem 0.7rem;
      font-size: 0.84rem;
      margin-bottom: 0.55rem;
      line-height: 1.5;
    }
    .panel--ok { background: #f0fdf4; color: #14532d; border: 1px solid #bbf7d0; }
    .panel--warn { background: #fffbeb; color: #78350f; border: 1px solid #fde68a; }
    .panel--muted { background: var(--surface-2); color: var(--muted); border: 1px solid var(--border); }
    .check { display: flex; gap: 0.5rem; align-items: center; font-size: 0.86rem; margin-bottom: 0.6rem; }
    .hover-targets p {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.55rem 0.7rem;
      font-size: 0.83rem;
      margin: 0 0 0.5rem;
      line-height: 1.55;
    }
    .hover-targets p.is-highlighted { border-color: var(--accent); }
    .badges { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.6rem; }
    .spacer { flex: 1; }
    .is-current { border-color: var(--accent); color: var(--accent); }
  `,
})
export class DirectivesLab {
  protected readonly auth = inject(AuthService);
  protected readonly roles: readonly Role[] = ROLES;
  protected readonly approved = signal(false);
}
