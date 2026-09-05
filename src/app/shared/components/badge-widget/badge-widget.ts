import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { Employee, fullName } from '@core/models/employee.model';

/**
 * Shareable employee badge — the artefact HR exports for lanyards and for
 * embedding in other internal tools.
 *
 * `ViewEncapsulation.ShadowDom` gives it a real shadow root, which isolates it
 * in BOTH directions: the host page cannot restyle the badge, and the badge
 * cannot leak into the host page. That guarantee is the whole point of a
 * component meant to be dropped into a page it does not control.
 */
@Component({
  selector: 'app-badge-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `
    <div class="badge" [style.--accent]="employee().avatarColor">
      <span class="badge__avatar">{{ initials() }}</span>
      <span class="badge__text">
        <strong>{{ name() }}</strong>
        <small>{{ employee().title }}</small>
        <small class="badge__dept">{{ employee().department }}</small>
      </span>
      <span class="badge__id">#{{ employee().id }}</span>
    </div>
  `,
  styles: `
    :host { display: block; }
    .badge {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0.7rem 0.85rem;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      background: #fff;
      color: #0f172a;
      font-family: system-ui, sans-serif;
    }
    .badge__avatar {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      background: var(--accent, #4f46e5);
      color: #fff;
      font-weight: 700;
      font-size: 0.78rem;
      flex: none;
    }
    .badge__text { display: grid; flex: 1; min-width: 0; }
    .badge__text strong { font-size: 0.9rem; }
    .badge__text small { font-size: 0.74rem; color: #64748b; }
    .badge__dept { font-style: italic; }
    .badge__id { font-size: 0.7rem; color: #94a3b8; font-variant-numeric: tabular-nums; }
  `,
})
export class BadgeWidget {
  readonly employee = input.required<Employee>();

  protected name(): string {
    return fullName(this.employee());
  }

  protected initials(): string {
    const employee = this.employee();
    return `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`.toUpperCase();
  }
}
