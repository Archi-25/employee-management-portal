import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ClickOutsideDirective } from './click-outside.directive';

/**
 * Mirrors the employee table: several rows, each with its own trigger, but a
 * single outside-click watcher around the whole list.
 *
 * The regression this guards against: putting the watcher on every row meant a
 * click on row 1's trigger looked "outside" to rows 2..n, whose handlers then
 * closed the menu on the very click that opened it.
 */
@Component({
  imports: [ClickOutsideDirective],
  template: `
    <div id="list" (appClickOutside)="openId.set(null)">
      @for (row of rows; track row) {
        <div class="row">
          <button [id]="'trigger-' + row" type="button" (click)="toggle(row)">⋯</button>
          @if (openId() === row) {
            <div [id]="'panel-' + row" class="panel">actions</div>
          }
        </div>
      }
    </div>
    <button id="elsewhere" type="button">elsewhere</button>
  `,
})
class MenuListHost {
  readonly rows = [1, 2, 3];
  readonly openId = signal<number | null>(null);

  toggle(row: number): void {
    this.openId.update((current) => (current === row ? null : row));
  }
}

describe('row action menus', () => {
  async function setup() {
    const fixture = TestBed.createComponent(MenuListHost);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('opens a menu and keeps it open', async () => {
    const { fixture, element } = await setup();

    (element.querySelector('#trigger-1') as HTMLElement).click();
    await fixture.whenStable();

    expect(element.querySelector('#panel-1')).not.toBeNull();
  });

  it('switches directly from one row to another', async () => {
    const { fixture, element } = await setup();

    (element.querySelector('#trigger-1') as HTMLElement).click();
    await fixture.whenStable();
    (element.querySelector('#trigger-2') as HTMLElement).click();
    await fixture.whenStable();

    expect(element.querySelector('#panel-1')).toBeNull();
    expect(element.querySelector('#panel-2')).not.toBeNull();
  });

  it('closes when the same trigger is pressed again', async () => {
    const { fixture, element } = await setup();
    const trigger = element.querySelector('#trigger-1') as HTMLElement;

    trigger.click();
    await fixture.whenStable();
    trigger.click();
    await fixture.whenStable();

    expect(element.querySelector('#panel-1')).toBeNull();
  });

  it('closes when the click lands outside the list', async () => {
    const { fixture, element } = await setup();

    (element.querySelector('#trigger-1') as HTMLElement).click();
    await fixture.whenStable();
    expect(element.querySelector('#panel-1')).not.toBeNull();

    (element.querySelector('#elsewhere') as HTMLElement).click();
    await fixture.whenStable();

    expect(element.querySelector('#panel-1')).toBeNull();
  });
});
