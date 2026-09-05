import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConfirmDialog } from './confirm-dialog';
import { DialogRef } from './dialog-ref';

@Component({
  imports: [ConfirmDialog],
  template: `
    <app-confirm-dialog
      heading="Remove employee?"
      confirmLabel="Remove"
      (confirmed)="confirmed.set(true)"
      (cancelled)="cancelled.set(true)"
    >
      <p id="message">Custom message</p>
    </app-confirm-dialog>
  `,
})
class DialogHost {
  readonly confirmed = signal(false);
  readonly cancelled = signal(false);
}

@Component({
  imports: [ConfirmDialog],
  template: `<app-confirm-dialog />`,
})
class BareDialogHost {}

describe('ConfirmDialog', () => {
  async function setup<T>(host: new () => T) {
    const fixture = TestBed.createComponent(host);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('scopes DialogRef to its own view rather than the application', () => {
    TestBed.configureTestingModule({});

    // viewProviders — never reachable from the environment injector.
    expect(TestBed.inject(DialogRef, null, { optional: true })).toBeNull();
  });

  it('renders the projected message', async () => {
    const { element } = await setup(DialogHost);

    expect(element.querySelector('#message')?.textContent).toBe('Custom message');
  });

  it('falls back to a default message when nothing is projected', async () => {
    const { element } = await setup(BareDialogHost);

    expect(element.textContent).toContain('cannot be undone');
  });

  it('uses the supplied labels', async () => {
    const { element } = await setup(DialogHost);

    expect(element.textContent).toContain('Remove employee?');
    expect(element.textContent).toContain('Remove');
  });

  it('moves focus to the least destructive control on open', async () => {
    const { element } = await setup(DialogHost);

    const cancel = [...element.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Cancel',
    );
    expect(document.activeElement).toBe(cancel);
  });

  it('emits confirmed when the primary action is pressed', async () => {
    const { fixture, element } = await setup(DialogHost);

    const confirm = [...element.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Remove',
    );
    confirm?.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.confirmed()).toBe(true);
    expect(fixture.componentInstance.cancelled()).toBe(false);
  });

  it('emits cancelled from the backdrop', async () => {
    const { fixture, element } = await setup(DialogHost);

    (element.querySelector('.backdrop') as HTMLElement).click();
    await fixture.whenStable();

    expect(fixture.componentInstance.cancelled()).toBe(true);
    expect(fixture.componentInstance.confirmed()).toBe(false);
  });
});
