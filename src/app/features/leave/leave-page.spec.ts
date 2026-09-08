import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeaveStore } from '@core/state/leave.store';
import { EmployeeStore } from '@core/state/employee.store';
import { countLeaveDays } from '@core/models/hr.model';
import { buttonTexts, configureFeatureTest } from '../../testing/test-setup';
import { LeavePage } from './leave-page';

describe('LeavePage', () => {
  let fixture: ComponentFixture<LeavePage>;
  let element: HTMLElement;
  let store: InstanceType<typeof LeaveStore>;

  async function setup(role: Parameters<typeof configureFeatureTest>[0] = 'MANAGER') {
    configureFeatureTest(role);
    await TestBed.inject(EmployeeStore).load();
    store = TestBed.inject(LeaveStore);

    fixture = TestBed.createComponent(LeavePage);
    await fixture.whenStable();
    await store.load();
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
  }

  const rowCount = () => element.querySelectorAll('tbody tr').length;

  it('lists every request for a manager, titled accordingly', async () => {
    await setup('MANAGER');

    expect(element.textContent).toContain('All requests');
    expect(rowCount()).toBe(store.requests().length);
    const headers = [...element.querySelectorAll('th')].map((h) => h.textContent?.trim());
    expect(headers).toContain('Employee');
  });

  it('lists only their own requests for an employee', async () => {
    await setup('EMPLOYEE');

    expect(element.textContent).toContain('My requests');
    const mine = store.requests().filter((r) => r.employeeId === 3);
    expect(rowCount()).toBe(mine.length);

    // ...and the employee column is absent, because every row is theirs.
    const headers = [...element.querySelectorAll('th')].map((h) => h.textContent?.trim());
    expect(headers).not.toContain('Employee');
  });

  it('filters by status', async () => {
    await setup('MANAGER');

    store.setStatus('PENDING');
    await fixture.whenStable();

    expect(rowCount()).toBe(store.pendingCount());
  });

  describe('approvals', () => {
    it('offers Approve and Reject to a manager on pending rows only', async () => {
      await setup('MANAGER');

      const approves = buttonTexts(element).filter((t) => t === 'Approve');
      expect(approves.length).toBe(store.pendingCount());
    });

    it('offers neither to an employee', async () => {
      await setup('EMPLOYEE');

      expect(buttonTexts(element)).not.toContain('Approve');
      expect(buttonTexts(element)).not.toContain('Reject');
    });

    it('approving marks the request and spends the balance', async () => {
      await setup('MANAGER');

      const request = store.pending()[0];
      const before = store.balances().find((b) => b.employeeId === request.employeeId)!;
      const beforeDays = before[request.type.toLowerCase() as 'annual' | 'sick' | 'casual'];

      await store.decide(request.id, true, 'Riya Sharma');
      await fixture.whenStable();

      const after = store.requests().find((r) => r.id === request.id)!;
      expect(after.status).toBe('APPROVED');
      expect(after.decidedBy).toBe('Riya Sharma');

      const balance = store.balances().find((b) => b.employeeId === request.employeeId)!;
      const afterDays = balance[request.type.toLowerCase() as 'annual' | 'sick' | 'casual'];
      expect(afterDays).toBe(Math.max(0, beforeDays - request.days));
    });

    it('rejecting marks the request but leaves the balance alone', async () => {
      await setup('MANAGER');

      const request = store.pending()[0];
      const before = store.balances().find((b) => b.employeeId === request.employeeId)!;
      const beforeDays = before[request.type.toLowerCase() as 'annual' | 'sick' | 'casual'];

      await store.decide(request.id, false, 'Riya Sharma');

      expect(store.requests().find((r) => r.id === request.id)!.status).toBe('REJECTED');
      const balance = store.balances().find((b) => b.employeeId === request.employeeId)!;
      expect(balance[request.type.toLowerCase() as 'annual' | 'sick' | 'casual']).toBe(beforeDays);
    });
  });

  describe('applying', () => {
    it('adds a pending request for the signed-in employee', async () => {
      await setup('EMPLOYEE');
      const before = store.requests().length;

      await store.apply({
        employeeId: 3,
        type: 'Casual',
        from: '2026-10-05',
        to: '2026-10-06',
        reason: 'Family commitment.',
      });
      await fixture.whenStable();

      expect(store.requests().length).toBe(before + 1);
      expect(store.requests()[0].status).toBe('PENDING');
      expect(store.requests()[0].days).toBe(countLeaveDays('2026-10-05', '2026-10-06'));
    });
  });

  it('counts working days and skips the weekend', () => {
    // Fri 2 Oct 2026 to Mon 5 Oct 2026 spans a weekend: Fri + Mon = 2 days.
    expect(countLeaveDays('2026-10-02', '2026-10-05')).toBe(2);
    expect(countLeaveDays('2026-10-05', '2026-10-09')).toBe(5);
    // An end date before the start is not a range.
    expect(countLeaveDays('2026-10-09', '2026-10-05')).toBe(0);
  });
});
