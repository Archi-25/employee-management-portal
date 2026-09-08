import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { Card } from '@shared/components/card/card';

@Component({
  selector: 'app-forbidden',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Card],
  template: `
    <app-card heading="403 — Not permitted" subtitle="A route guard rejected the navigation">
      <p>
        You are signed in as <strong>{{ auth.role() }}</strong
        >. Raise your role from the header switcher or the settings page, then try again.
      </p>
      <div card-footer class="row">
        <a class="btn" routerLink="/dashboard">Back to dashboard</a>
        <a class="btn btn--ghost" routerLink="/login">Switch account</a>
      </div>
    </app-card>
  `,
})
export class Forbidden {
  protected readonly auth = inject(AuthService);
}
