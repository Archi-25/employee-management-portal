import { TestBed } from '@angular/core/testing';
import { AuthService } from '@core/services/auth.service';
import { resetMockBackend } from '@core/interceptors/mock-backend.interceptor';
import { AnnouncementStore } from './announcement.store';
import { DepartmentStore } from './department.store';
import { LeaveStore } from './leave.store';
import { configureFeatureTest } from '../../testing/test-setup';

describe('AnnouncementStore', () => {
  let store: InstanceType<typeof AnnouncementStore>;

  beforeEach(async () => {
    resetMockBackend();
    configureFeatureTest('ADMIN');
    store = TestBed.inject(AnnouncementStore);
    await store.load();
  });

  it('loads announcements and clears the loading flag', () => {
    expect(store.count()).toBeGreaterThan(0);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('orders pinned announcements first, then newest', () => {
    const ordered = store.ordered();
    const firstUnpinned = ordered.findIndex((item) => !item.pinned);

    // Every pinned item precedes every unpinned one.
    if (firstUnpinned !== -1) {
      expect(ordered.slice(firstUnpinned).every((item) => !item.pinned)).toBe(true);
    }

    // Within the unpinned run, dates descend.
    const unpinned = ordered.filter((item) => !item.pinned);
    for (let i = 1; i < unpinned.length; i += 1) {
      expect(unpinned[i - 1].postedAt >= unpinned[i].postedAt).toBe(true);
    }
  });

  it('publishes an announcement and puts it at the head of the list', async () => {
    const before = store.count();

    await store.publish({
      title: 'Office closed on Friday',
      bodyHtml: '<p>Enjoy the long weekend.</p>',
      author: 'Aarav Mehta',
      pinned: false,
    });

    expect(store.count()).toBe(before + 1);
    expect(store.announcements()[0].title).toBe('Office closed on Friday');
    expect(store.loading()).toBe(false);
  });

  it('removes an announcement', async () => {
    const target = store.announcements()[0];
    const before = store.count();

    await store.remove(target.id);

    expect(store.count()).toBe(before - 1);
    expect(store.announcements().some((item) => item.id === target.id)).toBe(false);
  });

  it('records an error when a removal is refused, and releases loading', async () => {
    // The mock backend allows only MANAGER and ADMIN to remove announcements.
    TestBed.inject(AuthService).switchRole('EMPLOYEE');
    const target = store.announcements()[0];
    const before = store.count();

    await store.remove(target.id);

    expect(store.error()).toBeTruthy();
    expect(store.loading()).toBe(false);
    // The list is untouched, because the API refused the write.
    expect(store.count()).toBe(before);
  });
});

describe('DepartmentStore', () => {
  let store: InstanceType<typeof DepartmentStore>;

  beforeEach(async () => {
    resetMockBackend();
    configureFeatureTest('ADMIN');
    store = TestBed.inject(DepartmentStore);
    await store.load();
  });

  it('loads departments and indexes them by name', () => {
    expect(store.count()).toBeGreaterThan(0);
    expect(store.byName().get('Engineering')?.code).toBe('ENG');
    expect(store.error()).toBeNull();
  });

  it('creates a department', async () => {
    const before = store.count();

    await store.create({ name: 'Legal', code: 'LGL', headId: null, description: 'Contracts.' });

    expect(store.count()).toBe(before + 1);
    expect(store.byName().get('Legal')?.code).toBe('LGL');
  });

  it('updates a department in place', async () => {
    const target = store.departments()[0];

    await store.update(target.id, {
      name: target.name,
      code: target.code,
      headId: target.headId,
      description: 'Rewritten description.',
    });

    expect(store.departments().find((d) => d.id === target.id)?.description).toBe(
      'Rewritten description.',
    );
    expect(store.loading()).toBe(false);
  });

  it('removes an empty department', async () => {
    await store.create({ name: 'Legal', code: 'LGL', headId: null, description: 'Contracts.' });
    const created = store.byName().get('Legal');
    const before = store.count();

    await store.remove(created!.id);

    expect(store.count()).toBe(before - 1);
  });

  it('refuses to remove a department that still has employees', async () => {
    const engineering = store.byName().get('Engineering');
    const before = store.count();

    await store.remove(engineering!.id);

    // The backend answers 409; the store surfaces it rather than dropping the row.
    expect(store.error()).toBeTruthy();
    expect(store.loading()).toBe(false);
    expect(store.count()).toBe(before);
  });

  it('records an error when a non-admin tries to create', async () => {
    TestBed.inject(AuthService).switchRole('EMPLOYEE');
    const before = store.count();

    await store.create({ name: 'Legal', code: 'LGL', headId: null, description: '' });

    expect(store.error()).toBeTruthy();
    expect(store.count()).toBe(before);
  });
});

describe('LeaveStore', () => {
  let store: InstanceType<typeof LeaveStore>;

  beforeEach(async () => {
    resetMockBackend();
    configureFeatureTest('MANAGER');
    store = TestBed.inject(LeaveStore);
    await store.load();
  });

  it('loads requests and balances together', () => {
    expect(store.requests().length).toBeGreaterThan(0);
    expect(store.balances().length).toBeGreaterThan(0);
    expect(store.loading()).toBe(false);
  });

  it('counts requests by status', () => {
    const requests = store.requests();
    expect(store.pendingCount()).toBe(requests.filter((r) => r.status === 'PENDING').length);
    expect(store.approvedCount()).toBe(requests.filter((r) => r.status === 'APPROVED').length);
    expect(store.rejectedCount()).toBe(requests.filter((r) => r.status === 'REJECTED').length);
  });

  it('filters the visible list by status', () => {
    store.setStatus('PENDING');
    expect(store.visible().every((request) => request.status === 'PENDING')).toBe(true);

    store.setStatus('ALL');
    expect(store.visible().length).toBe(store.requests().length);
  });

  it('looks up a balance by employee, and returns null for an unknown one', () => {
    const known = store.balances()[0];
    expect(store.balanceFor(known.employeeId)).toEqual(known);
    expect(store.balanceFor(9999)).toBeNull();
  });

  it('submits a request as PENDING with a working-day count', async () => {
    const before = store.requests().length;

    // Thursday to the following Monday — 3 working days, not 5.
    await store.apply({
      employeeId: 3,
      type: 'Casual',
      from: '2026-09-10',
      to: '2026-09-14',
      reason: 'Family function.',
    });

    expect(store.requests().length).toBe(before + 1);
    const created = store.requests()[0];
    expect(created.status).toBe('PENDING');
    expect(created.days).toBe(3);
  });

  it('approving a request deducts the days from the balance', async () => {
    const pending = store.pending().find((request) => request.type === 'Annual');
    expect(pending).toBeTruthy();

    const before = store.balanceFor(pending!.employeeId)!.annual;
    await store.decide(pending!.id, true, 'Riya Sharma');

    expect(store.requests().find((r) => r.id === pending!.id)?.status).toBe('APPROVED');
    expect(store.balanceFor(pending!.employeeId)!.annual).toBe(before - pending!.days);
  });

  it('rejecting a request leaves the balance alone', async () => {
    const pending = store.pending()[0];
    const before = store.balanceFor(pending.employeeId);

    await store.decide(pending.id, false, 'Riya Sharma');

    expect(store.requests().find((r) => r.id === pending.id)?.status).toBe('REJECTED');
    expect(store.balanceFor(pending.employeeId)).toEqual(before);
  });

  it('records an error when an employee tries to decide a request', async () => {
    TestBed.inject(AuthService).switchRole('EMPLOYEE');
    const pending = store.pending()[0];

    await store.decide(pending.id, true, 'Daniel Okafor');

    expect(store.error()).toBeTruthy();
    expect(store.loading()).toBe(false);
    // Still pending — the API refused the decision.
    expect(store.requests().find((r) => r.id === pending.id)?.status).toBe('PENDING');
  });
});
