import { Injectable, signal } from '@angular/core';

@Injectable()
export class DialogRef {
  private readonly result = signal<boolean | null>(null);
  readonly outcome = this.result.asReadonly();

  close(confirmed: boolean): void {
    this.result.set(confirmed);
  }
}
