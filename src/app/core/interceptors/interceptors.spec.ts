import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { Page } from '@core/models/api.model';
import { Employee } from '@core/models/employee.model';
import { AuthService } from '@core/services/auth.service';
import { ProfilingService } from '@core/services/profiling.service';
import { ConsoleLogger } from '@core/services/logger.service';
import { Logger } from '@core/tokens/logger.token';
import { authInterceptor } from './auth.interceptor';
import { CACHE_BYPASS } from './cache.context';
import { cacheInterceptor, clearHttpCache } from './cache.interceptor';
import { errorInterceptor } from './error.interceptor';
import { mockBackendInterceptor, resetMockBackend } from './mock-backend.interceptor';
import { profilingInterceptor } from './profiling.interceptor';
import { makeEmployeeDraft } from '../../testing/employee.fixture';

/** Records the headers the mock backend actually received. */
let seenAuthorization: string | null = null;
let seenRole: string | null = null;

describe('HTTP interceptor chain', () => {
  let http: HttpClient;
  let auth: AuthService;
  let profiling: ProfilingService;

  beforeEach(() => {
    resetMockBackend();
    clearHttpCache();
    seenAuthorization = null;
    seenRole = null;

    TestBed.configureTestingModule({
      providers: [
        ConsoleLogger,
        { provide: Logger, useExisting: ConsoleLogger },
        provideHttpClient(
          withInterceptors([
            profilingInterceptor,
            authInterceptor,
            cacheInterceptor,
            errorInterceptor,
            // Capture what reached the "server", then hand off to the backend.
            (req, next) => {
              seenAuthorization = req.headers.get('Authorization');
              seenRole = req.headers.get('X-Portal-Role');
              return next(req);
            },
            mockBackendInterceptor,
          ]),
        ),
      ],
    });

    http = TestBed.inject(HttpClient);
    auth = TestBed.inject(AuthService);
    profiling = TestBed.inject(ProfilingService);
  });

  it('serves the collection through the whole chain', async () => {
    const page = await firstValueFrom(http.get<Page<Employee>>('/api/employees'));

    expect(page.total).toBeGreaterThan(0);
    expect(page.items.length).toBe(page.total);
  });

  it('attaches no Authorization header without a session', async () => {
    await firstValueFrom(http.get('/api/employees'));

    expect(seenAuthorization).toBeNull();
  });

  it('attaches the bearer token and role once signed in', async () => {
    auth.login('Riya', 'MANAGER');
    await firstValueFrom(http.get('/api/employees'));

    expect(seenAuthorization).toContain('Bearer ');
    expect(seenRole).toBe('MANAGER');
  });

  it('serves a repeated GET from the cache without reaching the backend', async () => {
    await firstValueFrom(http.get('/api/employees'));
    seenAuthorization = 'sentinel';
    seenRole = 'sentinel';

    await firstValueFrom(http.get('/api/employees'));

    // The sentinels survive because the second request never got past the cache.
    expect(seenRole).toBe('sentinel');
  });

  it('honours CACHE_BYPASS on a per-request basis', async () => {
    await firstValueFrom(http.get('/api/employees'));
    seenRole = 'sentinel';

    await firstValueFrom(
      http.get('/api/employees', { context: new HttpContext().set(CACHE_BYPASS, true) }),
    );

    expect(seenRole).not.toBe('sentinel');
  });

  it('invalidates the cache when a write goes through', async () => {
    auth.login('Riya', 'MANAGER');
    const before = await firstValueFrom(http.get<Page<Employee>>('/api/employees'));

    await firstValueFrom(
      http.post('/api/employees', makeEmployeeDraft({ firstName: 'New', lastName: 'Hire' })),
    );

    const after = await firstValueFrom(http.get<Page<Employee>>('/api/employees'));
    expect(after.total).toBe(before.total + 1);
  });

  it('normalises a 500 into an ApiError instead of an HttpErrorResponse', async () => {
    await expect(firstValueFrom(http.get('/api/boom'))).rejects.toMatchObject({
      status: 500,
      url: '/api/boom',
    });
  });

  it('rejects a POST from a role without manager rights', async () => {
    auth.login('Daniel', 'EMPLOYEE');

    await expect(
      firstValueFrom(http.post('/api/employees', makeEmployeeDraft())),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('rejects a DELETE from a non-admin role with 403', async () => {
    auth.login('Daniel', 'EMPLOYEE');

    await expect(firstValueFrom(http.delete('/api/employees/1'))).rejects.toMatchObject({
      status: 403,
    });
  });

  it('allows a DELETE from ADMIN', async () => {
    auth.login('Aarav', 'ADMIN');
    const before = await firstValueFrom(http.get<Page<Employee>>('/api/employees'));

    await firstValueFrom(http.delete('/api/employees/1'));

    const after = await firstValueFrom(http.get<Page<Employee>>('/api/employees'));
    expect(after.total).toBe(before.total - 1);
  });

  it('records a timing for every request', async () => {
    await firstValueFrom(http.get('/api/employees'));

    expect(profiling.requestCount()).toBe(1);
    expect(profiling.timings()[0].method).toBe('GET');
  });
});
