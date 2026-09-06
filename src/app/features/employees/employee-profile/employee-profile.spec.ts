import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Employee } from '@core/models/employee.model';
import { makeEmployee } from '../../../testing/employee.fixture';
import { ConsoleLogger } from '@core/services/logger.service';
import { Logger } from '@core/tokens/logger.token';
import { EmployeeProfile, ProfileNote } from './employee-profile';

const EMPLOYEE: Employee = makeEmployee();

@Component({
  imports: [EmployeeProfile],
  template: `
    <app-employee-profile
      [employee]="employee"
      [showSalary]="showSalary()"
      (edit)="edited.set($event)"
      (remove)="removed.set($event)"
      (noteAdded)="note.set($event)"
    >
      <div profile-banner id="banner">projected banner</div>
      <button profile-actions id="action" type="button">projected action</button>
      <p id="default-slot">projected body</p>
      <small profile-footer id="footer">projected footer</small>
    </app-employee-profile>
  `,
})
class ProfileHost {
  readonly employee = EMPLOYEE;
  readonly showSalary = signal(true);
  readonly edited = signal<Employee | null>(null);
  readonly removed = signal<Employee | null>(null);
  readonly note = signal<ProfileNote | null>(null);
}

describe('EmployeeProfile', () => {
  async function setup() {
    TestBed.configureTestingModule({
      providers: [ConsoleLogger, { provide: Logger, useExisting: ConsoleLogger }],
    });
    const fixture = TestBed.createComponent(ProfileHost);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('renders the @Input record', async () => {
    const { element } = await setup();

    expect(element.querySelector('.identity__name')?.textContent?.trim()).toBe('Mei Tanaka');
    expect(element.textContent).toContain('Product Designer');
  });

  it('fills every ng-content slot from the parent template', async () => {
    const { element } = await setup();

    expect(element.querySelector('.profile > #banner')).not.toBeNull();
    expect(element.querySelector('.profile__actions > #action')).not.toBeNull();
    expect(element.querySelector('.projected > #default-slot')).not.toBeNull();
    expect(element.querySelector('.profile__footer > #footer')).not.toBeNull();
  });

  it('renders one focusable chip per skill', async () => {
    const { fixture, element } = await setup();
    const profile = fixture.debugElement.children[0].componentInstance as EmployeeProfile;

    const chips = element.querySelectorAll('.chip--skill');
    expect(chips.length).toBe(EMPLOYEE.skills.length);
    expect(profile.skillChips?.length).toBe(EMPLOYEE.skills.length);
    expect((chips[0] as HTMLElement).getAttribute('tabindex')).toBe('0');
  });

  it('moves focus between skill chips with the arrow keys', async () => {
    const { fixture, element } = await setup();

    const chips = [...element.querySelectorAll('.chip--skill')] as HTMLElement[];
    const list = element.querySelector('.skills__list') as HTMLElement;

    chips[0].focus();
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await fixture.whenStable();
    expect(document.activeElement).toBe(chips[1]);

    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    await fixture.whenStable();
    expect(document.activeElement).toBe(chips[chips.length - 1]);

    // Wraps around from the last chip back to the first.
    list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await fixture.whenStable();
    expect(document.activeElement).toBe(chips[0]);
  });

  it('resolves the @ViewChild handle to the note textarea', async () => {
    const { fixture } = await setup();
    const profile = fixture.debugElement.children[0].componentInstance as EmployeeProfile;

    expect(profile.noteBoxRef?.nativeElement.tagName).toBe('TEXTAREA');
    expect(profile.headerRef()?.nativeElement).not.toBeNull();
  });

  it('clears saved notes and returns focus to the input', async () => {
    const { fixture, element } = await setup();
    const textarea = element.querySelector('textarea') as HTMLTextAreaElement;

    textarea.value = 'Discussed promotion';
    const save = [...element.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Save note',
    );
    save?.click();
    await fixture.whenStable();
    expect(element.querySelectorAll('.notes__list li').length).toBe(1);

    const clear = [...element.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Clear all',
    );
    clear?.click();
    await fixture.whenStable();

    expect(element.querySelectorAll('.notes__list li').length).toBe(0);
    expect(document.activeElement).toBe(textarea);
  });

  it('emits the decorator @Output when Edit is pressed', async () => {
    const { fixture, element } = await setup();

    const edit = [...element.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Edit',
    );
    edit?.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.edited()?.id).toBe(42);
  });

  it('emits the signal output() when Remove is pressed', async () => {
    const { fixture, element } = await setup();

    const remove = [...element.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Remove',
    );
    remove?.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.removed()?.id).toBe(42);
  });

  it('emits noteAdded with the typed payload and clears the textarea', async () => {
    const { fixture, element } = await setup();

    const textarea = element.querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = 'Promotion discussed';

    const save = [...element.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Save note',
    );
    save?.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.note()).toMatchObject({
      employeeId: 42,
      text: 'Promotion discussed',
    });
    expect(textarea.value).toBe('');
  });

  it('ignores an empty note', async () => {
    const { fixture, element } = await setup();

    const save = [...element.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Save note',
    );
    save?.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.note()).toBeNull();
  });

  it('hides the salary row when showSalary is false', async () => {
    const { fixture, element } = await setup();
    expect(element.textContent).toContain('Salary');

    fixture.componentInstance.showSalary.set(false);
    await fixture.whenStable();

    expect(element.textContent).not.toContain('Salary');
  });

  it('renders the bio as rich text but strips the hostile payload', async () => {
    const { element } = await setup();
    const bio = element.querySelector('.bio__body');

    // Legitimate markup survives...
    expect(bio?.querySelector('p')).not.toBeNull();
    // ...and the event handler does not reach the DOM.
    expect(bio?.innerHTML).not.toContain('onerror');
  });
});
