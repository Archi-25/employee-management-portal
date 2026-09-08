import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { EmployeeStore } from '@core/state/employee.store';
import { buttonTexts, configureFeatureTest } from '../../../testing/test-setup';
import { EmployeeList } from './employee-list';

describe('EmployeeList', () => {
  let fixture: ComponentFixture<EmployeeList>;
  let element: HTMLElement;
  let store: InstanceType<typeof EmployeeStore>;

  async function setup(role: Parameters<typeof configureFeatureTest>[0] = 'ADMIN') {
    configureFeatureTest(role);
    store = TestBed.inject(EmployeeStore);
    await store.load();

    fixture = TestBed.createComponent(EmployeeList);
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
  }

  const rowNames = () =>
    [...element.querySelectorAll('.person__text strong')].map((n) => n.textContent?.trim());
  const headerFor = (label: string) =>
    [...element.querySelectorAll('th .sort')].find((b) =>
      b.textContent?.trim().startsWith(label),
    ) as HTMLElement | undefined;

  it('renders one page of employees, not the whole roster', async () => {
    await setup();

    // 16 seeded employees, default page size 10.
    expect(store.total()).toBe(16);
    expect(rowNames().length).toBe(10);
    expect(element.textContent).toContain('Page 1 of 2');
  });

  it('pages forward and back', async () => {
    await setup();
    const firstPage = rowNames();

    const next = [...element.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Next',
    );
    next?.click();
    await fixture.whenStable();

    expect(element.textContent).toContain('Page 2 of 2');
    expect(rowNames().length).toBe(6);
    expect(rowNames()[0]).not.toBe(firstPage[0]);
  });

  it('sorts by a column and reverses on a second click', async () => {
    await setup();

    const before = rowNames()[0];
    headerFor('Name')?.click();
    await fixture.whenStable();

    // Name is the default sort ascending, so one click flips it to descending.
    expect(rowNames()[0]).not.toBe(before);

    headerFor('Name')?.click();
    await fixture.whenStable();
    expect(rowNames()[0]).toBe(before);
  });

  it('filters by department through the store', async () => {
    await setup();

    store.setFilter({ department: 'Design' });
    await fixture.whenStable();

    expect(rowNames().length).toBe(2);
    expect(element.textContent).toContain('Design');
  });

  it('shows an empty state with a clear-filters action when nothing matches', async () => {
    await setup();

    store.setFilter({ search: 'nobody-called-this' });
    await fixture.whenStable();

    expect(element.textContent).toContain('No employees match these filters');
    expect(buttonTexts(element)).toContain('Clear all filters');
  });

  describe('role gating', () => {
    it('gives an employee no salary column, no add button and no row menu', async () => {
      await setup('EMPLOYEE');

      expect(element.textContent).not.toContain('SALARY');
      expect(buttonTexts(element)).not.toContain('Add employee');
      expect(element.querySelectorAll('.menu__trigger').length).toBe(0);
    });

    it('gives a manager the salary column, add button and an Edit-only menu', async () => {
      await setup('MANAGER');

      expect(element.querySelector('th .sort')?.textContent).toBeDefined();
      expect(buttonTexts(element)).toContain('Add employee');
      expect(element.querySelectorAll('.menu__trigger').length).toBe(10);

      (element.querySelector('.menu__trigger') as HTMLElement).click();
      await fixture.whenStable();

      const items = [...element.querySelectorAll('[role="menuitem"]')].map((i) =>
        i.textContent?.trim(),
      );
      expect(items).toEqual(['Edit']);
    });

    it('gives an admin both Edit and Remove', async () => {
      await setup('ADMIN');

      (element.querySelector('.menu__trigger') as HTMLElement).click();
      await fixture.whenStable();

      const items = [...element.querySelectorAll('[role="menuitem"]')].map((i) =>
        i.textContent?.trim(),
      );
      expect(items).toEqual(['Edit', 'Remove']);
    });
  });

  it('asks for confirmation before removing, and removes on confirm', async () => {
    await setup('ADMIN');
    const before = store.total();

    (element.querySelector('.menu__trigger') as HTMLElement).click();
    await fixture.whenStable();
    (
      [...element.querySelectorAll('[role="menuitem"]')].find(
        (i) => i.textContent?.trim() === 'Remove',
      ) as HTMLElement
    ).click();
    await fixture.whenStable();

    // The dialog appears; nothing is deleted yet.
    expect(element.querySelector('app-confirm-dialog')).not.toBeNull();
    expect(store.total()).toBe(before);

    (
      [...element.querySelectorAll('button')].find(
        (b) => b.textContent?.trim() === 'Remove' && b.classList.contains('btn--danger'),
      ) as HTMLElement
    ).click();
    await fixture.whenStable();

    expect(store.total()).toBe(before - 1);
  });
});
