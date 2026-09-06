import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ROLES, Role } from '@core/models/employee.model';
import { AuthService } from '@core/services/auth.service';
import { Card } from '@shared/components/card/card';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Card],
  template: `
    <header class="page-head">
      <h1 i18n="@@login.title">Sign in</h1>
      <p i18n="@@login.subtitle">
        Choose the role you want to sign in as. Your role decides what you can see and change.
      </p>
    </header>

    <app-card heading="Session" subtitle="Your session lasts until you reload the page">
      <label class="field">
        <span i18n="@@login.name">Display name</span>
        <input [(ngModel)]="name" name="name" autocomplete="name" />
      </label>

      <fieldset class="roles">
        <legend i18n="@@login.role">Role</legend>
        @for (option of roles; track option) {
          <label class="role">
            <input type="radio" name="role" [value]="option" [(ngModel)]="role" />
            <span>{{ option }}</span>
          </label>
        }
      </fieldset>

      <div card-footer class="row">
        <button type="button" class="btn" (click)="signIn()" i18n="@@login.submit">Sign in</button>
        @if (redirectTo()) {
          <span class="hint">You will return to <code>{{ redirectTo() }}</code></span>
        }
      </div>
    </app-card>
  `,
  styles: `
    :host { display: block; max-width: 520px; }
    .field { display: grid; gap: 0.3rem; font-size: 0.8rem; color: var(--muted); }
    .field input {
      font: inherit;
      padding: 0.45rem 0.55rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface);
      color: var(--text);
    }
    .roles { border: 0; padding: 0.9rem 0 0; margin: 0; display: grid; gap: 0.4rem; }
    .roles legend { font-size: 0.8rem; color: var(--muted); padding: 0; }
    .role { display: flex; gap: 0.5rem; align-items: center; font-size: 0.88rem; }
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly roles: readonly Role[] = ROLES;
  protected name = 'Aarchi';
  protected role: Role = 'MANAGER';
  protected readonly redirectTo = signal(
    this.route.snapshot.queryParamMap.get('redirectTo') ?? '',
  );

  protected signIn(): void {
    this.auth.login(this.name.trim() || 'Demo User', this.role);
    void this.router.navigateByUrl(this.redirectTo() || '/dashboard');
  }
}
