import { TestBed } from '@angular/core/testing';
import { Observer, Subject, firstValueFrom } from 'rxjs';
import { EmployeeStatus } from '@core/models/employee.model';
import { resetMockBackend } from '@core/interceptors/mock-backend.interceptor';
import { EmployeeService, HeadcountTick } from './employee.service';
import { configureFeatureTest } from '../../testing/test-setup';

describe('EmployeeService', () => {
  let service: EmployeeService;

  beforeEach(() => {
    resetMockBackend();
    configureFeatureTest('ADMIN');
    service = TestBed.inject(EmployeeService);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('list()', () => {
    it('unwraps the paged envelope into a plain array', async () => {
      vi.useRealTimers();
      const employees = await firstValueFrom(service.list());

      expect(Array.isArray(employees)).toBe(true);
      expect(employees.length).toBeGreaterThan(0);
      expect(employees[0].code).toMatch(/^EMP\d{3}$/);
    });

    it('passes search, department and status through as query params', async () => {
      vi.useRealTimers();
      const engineering = await firstValueFrom(service.list({ department: 'Engineering' }));
      expect(engineering.every((e) => e.department === 'Engineering')).toBe(true);

      const onLeave = await firstValueFrom(service.list({ status: 'ON_LEAVE' }));
      expect(onLeave.every((e) => e.status === 'ON_LEAVE')).toBe(true);

      // 'ALL' is a UI sentinel, not a filter — it must not reach the API.
      const all = await firstValueFrom(service.list({ department: 'ALL', status: 'ALL' }));
      expect(all.length).toBeGreaterThan(engineering.length);
    });
  });

  describe('headcountFeed()', () => {
    it('emits an incrementing sequence on each interval', () => {
      const ticks: HeadcountTick[] = [];
      const sub = service.headcountFeed(1000).subscribe((tick) => ticks.push(tick));

      expect(ticks).toHaveLength(0); // nothing before the first interval elapses

      vi.advanceTimersByTime(3000);

      expect(ticks.map((t) => t.sequence)).toEqual([1, 2, 3]);
      expect(ticks[0].emittedAt).toBeGreaterThan(0);
      sub.unsubscribe();
    });

    it('runs its teardown on unsubscribe, so the interval genuinely stops', () => {
      const ticks: HeadcountTick[] = [];
      const sub = service.headcountFeed(1000).subscribe((tick) => ticks.push(tick));

      vi.advanceTimersByTime(2000);
      expect(ticks).toHaveLength(2);

      sub.unsubscribe();
      vi.advanceTimersByTime(10_000);
      expect(ticks).toHaveLength(2);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('shares one producer between concurrent subscribers', () => {
      const a: number[] = [];
      const b: number[] = [];

      const subA = service.headcountFeed(1000).subscribe((t) => a.push(t.sequence));
      const subB = service.headcountFeed(1000).subscribe((t) => b.push(t.sequence));

      vi.advanceTimersByTime(2000);

      expect(a).toEqual(b);
      subA.unsubscribe();
      subB.unsubscribe();
    });
  });

  describe('evenHeadcountLabels()', () => {
    it('keeps only even ticks and formats them', async () => {
      const stop = new Subject<void>();
      const labels: string[] = [];
      const sub = service.evenHeadcountLabels(stop).subscribe((label) => labels.push(label));

      vi.advanceTimersByTime(4800);

      expect(labels).toHaveLength(2);
      expect(labels[0]).toMatch(/^#2 · \d+ active$/);
      expect(labels[1]).toMatch(/^#4 · \d+ active$/);
      sub.unsubscribe();
      stop.complete();
    });

    it('completes when the notifier fires', () => {
      const stop = new Subject<void>();
      let completed = false;
      service.evenHeadcountLabels(stop).subscribe({ complete: () => (completed = true) });

      vi.advanceTimersByTime(2400);
      expect(completed).toBe(false);

      stop.next();
      expect(completed).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('watchStatusChanges()', () => {
    it('drives an explicit Observer and cycles through the statuses', () => {
      const seen: EmployeeStatus[] = [];
      const stop = new Subject<void>();
      const observer: Observer<EmployeeStatus> = {
        next: (status) => seen.push(status),
        error: () => seen.push('EXITED'),
        complete: () => undefined,
      };

      const cancel = service.watchStatusChanges(observer, stop);

      vi.advanceTimersByTime(2700); // t=0, 900, 1800, 2700
      expect(seen).toEqual(['ACTIVE', 'ON_LEAVE', 'PROBATION', 'EXITED']);

      cancel();
      vi.advanceTimersByTime(5000);
      expect(seen).toHaveLength(4);
      stop.complete();
    });
  });

  describe('mutations', () => {
    it('creates, updates and removes through the API', async () => {
      vi.useRealTimers();

      const created = await firstValueFrom(
        service.create({
          code: '',
          firstName: 'Test',
          lastName: 'Person',
          email: 'test.person@acme.io',
          phone: '+91 9800000000',
          dateOfBirth: '1995-01-01',
          gender: 'Prefer not to say',
          title: 'Engineer',
          department: 'Engineering',
          employmentType: 'Full-time',
          joinedOn: '2024-01-01',
          managerId: null,
          salary: 100000,
          status: 'ACTIVE',
          role: 'EMPLOYEE',
          location: 'Remote',
          skills: ['Angular'],
          address: { line1: '1 Road', city: 'Pune', state: 'MH', pincode: '411001' },
          bioHtml: '<p>Bio</p>',
          avatarColor: '#5f6b2a',
        }),
      );
      expect(created.id).toBeGreaterThan(0);
      expect(created.code).toMatch(/^EMP\d{3}$/);

      const updated = await firstValueFrom(service.update(created.id, { salary: 120000 }));
      expect(updated.salary).toBe(120000);

      await firstValueFrom(service.remove(created.id));
      const remaining = await firstValueFrom(service.list());
      expect(remaining.some((e) => e.id === created.id)).toBe(false);
    });
  });
});
