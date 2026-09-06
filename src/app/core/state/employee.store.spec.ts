import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '@core/services/auth.service';
import { ConsoleLogger } from '@core/services/logger.service';
import { Logger } from '@core/tokens/logger.token';
import { mockBackendInterceptor, resetMockBackend } from '@core/interceptors/mock-backend.interceptor';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { EmployeeStore } from './employee.store';
import { makeEmployeeDraft } from '../../testing/employee.fixture';

describe('EmployeeStore', () => {
  let store: InstanceType<typeof EmployeeStore>;

  beforeEach(async () => {
    resetMockBackend();
    TestBed.configureTestingModule({
      providers: [
        ConsoleLogger,
        { provide: Logger, useExisting: ConsoleLogger },
        provideHttpClient(
          withInterceptors([authInterceptor, errorInterceptor, mockBackendInterceptor]),
        ),
      ],
    });
    store = TestBed.inject(EmployeeStore);
    await store.load();
  });

  it('loads the roster and clears the loading flag', () => {
    expect(store.total()).toBeGreaterThan(0);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('derives active headcount and payroll from the same source', () => {
    const expectedPayroll = store
      .employees()
      .reduce((sum, employee) => sum + employee.salary, 0);

    expect(store.payrollTotal()).toBe(expectedPayroll);
    expect(store.activeCount()).toBe(
      store.employees().filter((employee) => employee.status === 'ACTIVE').length,
    );
  });

  it('filters by search term across name, code, email and title', () => {
    store.setFilter({ search: 'sharma' });
    expect(store.filtered().length).toBe(1);
    expect(store.filtered()[0].firstName).toBe('Riya');

    store.setFilter({ search: 'principal' });
    expect(store.filtered()[0].title).toContain('Principal');

    // Employee code is searchable too.
    store.setFilter({ search: 'EMP003' });
    expect(store.filtered().length).toBe(1);
    expect(store.filtered()[0].code).toBe('EMP003');
  });

  it('matches a search term anywhere in the name, not only at the start', () => {
    // "riya" is a substring of both Riya Sharma and Priya Nair — by design.
    store.setFilter({ search: 'riya' });
    expect(store.filtered().length).toBe(2);
  });

  it('combines department and status filters', () => {
    store.setFilter({ department: 'Engineering', status: 'ACTIVE' });

    for (const employee of store.filtered()) {
      expect(employee.department).toBe('Engineering');
      expect(employee.status).toBe('ACTIVE');
    }
  });

  it('resets the filter back to the empty state', () => {
    store.setFilter({ search: 'nothing-matches-this' });
    expect(store.filtered().length).toBe(0);

    store.resetFilter();
    expect(store.filtered().length).toBe(store.total());
  });

  it('groups headcount by department, largest first', () => {
    const groups = store.headcountByDepartment();

    expect(groups.length).toBeGreaterThan(1);
    for (let i = 1; i < groups.length; i++) {
      expect(groups[i - 1].count).toBeGreaterThanOrEqual(groups[i].count);
    }
  });

  it('tracks the selected record', () => {
    const target = store.employees()[2];
    store.select(target.id);

    expect(store.selected()?.id).toBe(target.id);

    store.select(null);
    expect(store.selected()).toBeNull();
  });

  it('adds a created employee to the head of the list', async () => {
    // Creating requires manager rights; the API rejects anyone else.
    TestBed.inject(AuthService).login('Riya', 'MANAGER');
    const before = store.total();

    await store.create(
      makeEmployeeDraft({ firstName: 'Nina', lastName: 'Berg', email: 'nina.berg@acme.io', title: 'SRE' }),
    );

    expect(store.total()).toBe(before + 1);
    expect(store.employees()[0].firstName).toBe('Nina');
  });

  it('replaces the record on update rather than mutating it', async () => {
    TestBed.inject(AuthService).login('Riya', 'MANAGER');
    const target = store.employees()[0];
    const original = { ...target };

    await store.update(target.id, { title: 'Distinguished Engineer' });

    const updated = store.employees().find((employee) => employee.id === target.id);
    expect(updated?.title).toBe('Distinguished Engineer');
    expect(updated).not.toBe(original);
  });

  it('refuses to create an employee without manager rights', async () => {
    const before = store.total();

    await store.create(makeEmployeeDraft({ firstName: 'Mallory' }));

    expect(store.total()).toBe(before);
    expect(store.error()).not.toBeNull();
  });

  it('surfaces an error and stops loading when a delete is forbidden', async () => {
    TestBed.inject(AuthService).login('Daniel', 'EMPLOYEE');
    const before = store.total();

    await store.remove(store.employees()[0].id);

    expect(store.total()).toBe(before);
    expect(store.error()).not.toBeNull();
    expect(store.loading()).toBe(false);
  });

  it('removes the record when the role permits it', async () => {
    TestBed.inject(AuthService).login('Aarav', 'ADMIN');
    const target = store.employees()[0];

    await store.remove(target.id);

    expect(store.employees().some((employee) => employee.id === target.id)).toBe(false);
  });
});
