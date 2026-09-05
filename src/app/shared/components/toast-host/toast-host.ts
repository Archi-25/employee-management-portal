import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-toast-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" role="status" aria-live="polite">
      @for (toast of notifications.toasts(); track toast.id) {
        <div class="toast" [class]="'toast--' + toast.kind">
          <span>{{ toast.message }}</span>
          <button type="button" (click)="notifications.dismiss(toast.id)" aria-label="Dismiss">
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      z-index: 50;
      max-width: min(360px, calc(100vw - 2rem));
    }
    .toast {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.65rem 0.85rem;
      border-radius: 9px;
      font-size: 0.85rem;
      color: #fff;
      box-shadow: 0 8px 24px rgb(15 23 42 / 22%);
    }
    .toast--success { background: #15803d; }
    .toast--error { background: #b91c1c; }
    .toast--info { background: #1d4ed8; }
    .toast button {
      background: none;
      border: 0;
      color: inherit;
      font-size: 1.1rem;
      line-height: 1;
      cursor: pointer;
    }
  `,
})
export class ToastHost {
  protected readonly notifications = inject(NotificationService);
}
