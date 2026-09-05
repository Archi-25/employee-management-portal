import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { DialogRef } from './dialog-ref';

/**
 * Confirmation dialog used before any destructive action.
 *
 * `viewProviders` (not `providers`) supplies the {@link DialogRef}, which is
 * what lets `[appDialogClose]` find it with `@Host()` from inside this
 * template while remaining invisible to the rest of the application.
 */
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [DialogRef],
  template: `
    <!-- A real button so the backdrop is keyboard-reachable, not just clickable. -->
    <button type="button" class="backdrop" aria-label="Close dialog" (click)="cancel()"></button>

    <div
      class="dialog"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="heading()"
    >
      <h2 class="dialog__title">{{ heading() }}</h2>

      <div class="dialog__body">
        <!-- Caller supplies the message; a default is used when it does not. -->
        <ng-content>
          <p>This action cannot be undone.</p>
        </ng-content>
      </div>

      <footer class="dialog__actions">
        <ng-content select="[dialog-extra-actions]" />
        <button #cancelButton type="button" class="btn btn--ghost" (click)="cancel()">
          {{ cancelLabel() }}
        </button>
        <button type="button" class="btn btn--danger" (click)="confirm()">
          {{ confirmLabel() }}
        </button>
      </footer>
    </div>
  `,
  styleUrl: './confirm-dialog.css',
})
export class ConfirmDialog implements AfterViewInit {
  readonly heading = input('Are you sure?');
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  private readonly dialogRef = inject(DialogRef);

  /** Signal query — used to move focus into the dialog when it opens. */
  private readonly cancelButton = viewChild<ElementRef<HTMLButtonElement>>('cancelButton');

  ngAfterViewInit(): void {
    // Focus the least destructive control, not the confirm button.
    this.cancelButton()?.nativeElement.focus();
  }

  /** Escape closes the dialog, as a modal is expected to. */
  @HostListener('document:keydown.escape')
  cancel(): void {
    this.dialogRef.close(false);
    this.cancelled.emit();
  }

  confirm(): void {
    this.dialogRef.close(true);
    this.confirmed.emit();
  }
}
