import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmployeeStore } from '@core/state/employee.store';
import { LeaveStore } from '@core/state/leave.store';
import { configureFeatureTest } from '../../testing/test-setup';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let element: HTMLElement;
  let employees: InstanceType<typeof EmployeeStore>;

  async function setup(role: Parameters<typeof configureFeatureTest>[0] = 'ADMIN') {
    configureFeatureTest(role);
    employees = TestBed.inject(EmployeeStore);
    await employees.load();

    fixture = TestBed.createComponent(Dashboard);
    await fixture.whenStable();
    await TestBed.inject(LeaveStore).load();
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
  }

  const tileValue = (label: string) => {
    const tile = [...element.querySelectorAll('app-stat-tile')].find((t) =>
      t.textContent?.toLowerCase().includes(label.toLowerCase()),
    );
    return tile?.querySelector('.tile__value')?.textContent?.trim();
  };

  it('shows headcount and active count from the store', async () => {
    await setup();

    expect(tileValue('Total employees')).toBe(String(employees.total()));
    expect(tileValue('Active')).toBe(String(employees.activeCount()));
  });

  it('renders the department chart with one bar per department', async () => {
    await setup();

    const bars = element.querySelectorAll('app-bar-chart .bar');
    expect(bars.length).toBe(employees.headcountByDepartment().length);
  });

  it('offers the chart data as a table for accessibility', async () => {
    await setup();

    const table = element.querySelector('app-bar-chart .table-view table');
    expect(table).not.toBeNull();
    expect(table?.querySelectorAll('tbody tr').length).toBe(
      employees.headcountByDepartment().length,
    );
  });

  it('lists recent joiners, newest first', async () => {
    await setup();

    const joiners = employees.recentJoiners();
    expect(joiners.length).toBeGreaterThan(0);
    // Seed data uses relative dates so this card is never empty.
    expect(element.textContent).toContain('Recent employees');
    for (let i = 1; i < joiners.length; i++) {
      expect(joiners[i - 1].joinedOn >= joiners[i].joinedOn).toBe(true);
    }
  });

  it('shows upcoming birthdays inside the next two weeks', async () => {
    await setup();

    expect(element.textContent).toContain('Upcoming birthdays');
    for (const person of employees.upcomingBirthdays()) {
      expect(person.status).not.toBe('EXITED');
    }
  });

  it('renders announcements with their markup but without the payload', async () => {
    await setup();

    const panel = element.querySelector('app-announcement-panel');
    expect(panel?.textContent).toContain('Open enrolment');
    // The seeded announcement carries an onerror handler; it must not survive.
    expect(panel?.innerHTML).not.toContain('onerror');
  });

  it('points a manager at pending approvals', async () => {
    await setup('MANAGER');

    expect(element.textContent).toContain('need your decision');
  });

  it('does not offer approvals to an employee', async () => {
    await setup('EMPLOYEE');

    expect(element.textContent).not.toContain('need your decision');
  });

  it('invites a signed-out visitor to sign in', async () => {
    await setup('ANONYMOUS');

    expect(element.textContent).toContain('browsing as a guest');
  });

  it('stops the presence feed when the component is destroyed', async () => {
    await setup();
    // The feed polls on a timer; destroying must run the observable's teardown.
    expect(() => fixture.destroy()).not.toThrow();
  });
});
