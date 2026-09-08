import { Directive, Host, HostListener, Optional } from '@angular/core';
import { DialogRef } from '@shared/components/confirm-dialog/dialog-ref';

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
