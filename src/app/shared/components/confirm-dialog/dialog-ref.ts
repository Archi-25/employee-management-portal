import { Injectable, signal } from '@angular/core';

/**
 * Handle to the dialog that currently surrounds a piece of template.
 *
 * Provided by {@link ConfirmDialog} in its `viewProviders`, so anything inside
 * the dialog's own template can reach it — and nothing outside can.
 */
@Injectable()
export class DialogRef {
  private readonly result = signal<boolean | null>(null);
  readonly outcome = this.result.asReadonly();

  close(confirmed: boolean): void {
    this.result.set(confirmed);
  }
}
