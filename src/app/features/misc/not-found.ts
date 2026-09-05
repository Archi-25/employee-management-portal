import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Card } from '@shared/components/card/card';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Card],
  template: `
    <app-card heading="404 — Page not found" subtitle="The wildcard route caught this navigation">
      <p>Nothing is mapped to that URL.</p>
      <div card-footer>
        <a class="btn" routerLink="/dashboard">Back to dashboard</a>
      </div>
    </app-card>
  `,
})
export class NotFound {}
