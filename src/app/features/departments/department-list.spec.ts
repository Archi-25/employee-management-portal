import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DepartmentStore } from '@core/state/department.store';
import { EmployeeStore } from '@core/state/employee.store';
import { buttonTexts, configureFeatureTest } from '../../testing/test-setup';
import { DepartmentList } from './department-list';

describe('DepartmentList', () => {
  let fixture: ComponentFixture<DepartmentList>;
  let element: HTMLElement;
  let store: InstanceType<typeof DepartmentStore>;

  async function setup(role: Parameters<typeof configureFeatureTest>[0] = 'ADMIN') {
    configureFeatureTest(role);
    await TestBed.inject(EmployeeStore).load();
    store = TestBed.inject(DepartmentStore);

    fixture = TestBed.createComponent(DepartmentList);
    await fixture.whenStable();
    await store.load();
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
  }

  it('lists every department with its headcount', async () => {
    await setup();

    expect(store.count()).toBe(7);
    expect(element.querySelectorAll('.teams__link').length).toBe(7);
    expect(element.textContent).toContain('Engineering');
    expect(element.textContent).toContain('ENG');
  });

  it('counts employees per department from the directory', async () => {
    await setup();
    const employees = TestBed.inject(EmployeeStore).employees();
    const engineering = employees.filter((e) => e.department === 'Engineering').length;

    const row = [...element.querySelectorAll('.teams__link')].find((r) =>
      r.textContent?.includes('Engineering'),
    );
    expect(row?.querySelector('.teams__count')?.textContent?.trim()).toBe(String(engineering));
  });

  it('names the department head', async () => {
    await setup();

    // Engineering is headed by employee #2, Riya Sharma.
    const row = [...element.querySelectorAll('.teams__link')].find((r) =>
      r.textContent?.includes('Engineering'),
    );
    expect(row?.textContent).toContain('Riya Sharma');
  });

  it('prompts the user to pick a department before one is selected', async () => {
    await setup();

    expect(element.textContent).toContain('Select a department');
  });

  describe('role gating', () => {
    it('gives an employee no create, edit or delete controls', async () => {
      await setup('EMPLOYEE');

      expect(buttonTexts(element)).not.toContain('Add department');
      expect(element.querySelectorAll('.teams__actions').length).toBe(0);
    });

    it('gives a manager none either — departments are admin-only', async () => {
      await setup('MANAGER');

      expect(buttonTexts(element)).not.toContain('Add department');
      expect(element.querySelectorAll('.teams__actions').length).toBe(0);
    });

    it('gives an admin create, edit and delete', async () => {
      await setup('ADMIN');

      expect(buttonTexts(element)).toContain('Add department');
      expect(element.querySelectorAll('.teams__actions').length).toBe(7);
    });
  });

  describe('creating', () => {
    it('adds a department through the API', async () => {
      await setup('ADMIN');
      const before = store.count();

      await store.create({ name: 'Legal', code: 'LGL', headId: null, description: 'Contracts.' });
      await fixture.whenStable();

      expect(store.count()).toBe(before + 1);
      expect(element.textContent).toContain('Legal');
    });

    it('refuses a create from a manager', async () => {
      await setup('MANAGER');
      const before = store.count();

      await store.create({ name: 'Legal', code: 'LGL', headId: null, description: '' });

      expect(store.count()).toBe(before);
      expect(store.error()).not.toBeNull();
    });
  });

  describe('deleting', () => {
    it('refuses while employees are still assigned', async () => {
      await setup('ADMIN');
      const engineering = store.departments().find((d) => d.name === 'Engineering')!;
      const before = store.count();

      await store.remove(engineering.id);

      expect(store.count()).toBe(before);
      expect(store.error()).toContain('still has employees');
    });

    it('allows deleting an empty department', async () => {
      await setup('ADMIN');
      await store.create({ name: 'Legal', code: 'LGL', headId: null, description: '' });
      const created = store.departments().find((d) => d.name === 'Legal')!;
      const before = store.count();

      await store.remove(created.id);

      expect(store.count()).toBe(before - 1);
    });
  });
});
