import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AttendanceStore } from '@core/state/attendance.store';
import { EmployeeStore } from '@core/state/employee.store';
import { configureFeatureTest } from '../../testing/test-setup';
import { AttendancePage } from './attendance-page';

describe('AttendancePage', () => {
  let fixture: ComponentFixture<AttendancePage>;
  let element: HTMLElement;
  let store: InstanceType<typeof AttendanceStore>;

  async function setup(role: Parameters<typeof configureFeatureTest>[0] = 'ADMIN') {
    configureFeatureTest(role);
    await TestBed.inject(EmployeeStore).load();
    store = TestBed.inject(AttendanceStore);

    fixture = TestBed.createComponent(AttendancePage);
    await fixture.whenStable();
    // The date effect kicks off a load; let it settle.
    await store.load();
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
  }

  const rowCount = () => element.querySelectorAll('tbody tr').length;

  it('opens on a weekday, because weekends have no records', async () => {
    await setup();
    const day = new Date(store.date()).getDay();

    expect(day).not.toBe(0);
    expect(day).not.toBe(6);
    expect(store.records().length).toBeGreaterThan(0);
  });

  it('summarises the day into present, late, absent and on leave', async () => {
    await setup();

    const total = store.present() + store.late() + store.absent() + store.onLeave();
    expect(total).toBe(store.records().length);
  });

  it('computes the attendance rate from present plus late', async () => {
    await setup();

    const here = store.present() + store.late();
    const expected = Math.round((here / store.records().length) * 100);
    expect(store.attendanceRate()).toBe(expected);
    expect(element.textContent).toContain(`${expected}%`);
  });

  it('filters the table by status without refetching', async () => {
    await setup();
    const all = rowCount();

    store.setStatus('ABSENT');
    await fixture.whenStable();

    expect(rowCount()).toBeLessThan(all);
    expect(rowCount()).toBe(store.absent());
  });

  describe('role scoping', () => {
    it('shows a manager every employee and the search box', async () => {
      await setup('MANAGER');

      expect(rowCount()).toBe(store.records().length);
      expect(element.querySelector('input[type="search"]')).not.toBeNull();
    });

    it('shows an employee only their own row, and no search box', async () => {
      await setup('EMPLOYEE');

      // Daniel Okafor is employee #3 in the seed data.
      expect(rowCount()).toBe(1);
      expect(element.textContent).toContain('Daniel Okafor');
      expect(element.querySelector('input[type="search"]')).toBeNull();
    });

    it('does not leak another employee into a scoped view', async () => {
      await setup('EMPLOYEE');

      expect(element.textContent).not.toContain('Aarav Mehta');
      expect(element.textContent).not.toContain('Riya Sharma');
    });
  });
});
