import { Directive, Host, HostListener, Optional } from '@angular/core';
import { DialogRef } from '@shared/components/confirm-dialog/dialog-ref';

/**
 * Marks any button inside a dialog as a "close" control:
 * `<button appDialogClose>Not now</button>`.
 *
 * `@Host()` restricts the lookup to the surrounding dialog's view, so this
 * directive cannot accidentally close some ancestor dialog further up the page.
 * `@Optional()` means using it outside a dialog is inert rather than a crash —
 * the same contract `formControlName` has with its parent form.
 *
 * Note that `@Host()` resolves `viewProviders` but not `providers`, which is
 * exactly why ConfirmDialog declares DialogRef in `viewProviders`.
 */
@Directive({
  selector: '[appDialogClose]',
})
export class DialogCloseDirective {
  // eslint-disable-next-line @angular-eslint/prefer-inject
  constructor(@Host() @Optional() private readonly dialogRef: DialogRef | null) {}

  @HostListener('click')
  onClick(): void {
    this.dialogRef?.close(false);
  }
}
