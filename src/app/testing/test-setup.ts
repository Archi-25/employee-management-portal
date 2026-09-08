import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Component, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { cacheInterceptor, clearHttpCache } from '@core/interceptors/cache.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { mockBackendInterceptor, resetMockBackend } from '@core/interceptors/mock-backend.interceptor';
import { Role } from '@core/models/employee.model';
import { AuthService } from '@core/services/auth.service';
import { ConsoleLogger } from '@core/services/logger.service';
import { Logger } from '@core/tokens/logger.token';

/**
 * Standard wiring for a feature-screen test: the real interceptor chain against
 * the in-memory backend, a router, and a session at the requested role.
 *
 * Screens are tested through the same stack the application uses, so a test
 * that passes here means the store, the HTTP chain and the role rules all agree.
 *
 * Pass `extra` for anything a particular screen needs — a stubbed
 * `ActivatedRoute`, say. It has to go in here rather than through
 * `TestBed.overrideProvider` afterwards, because signing in below instantiates
 * the module and overrides are refused after that point.
 */
/**
 * Somewhere for a navigation to land.
 *
 * Screens navigate on success — the employee form goes to `/employees` after
 * saving. With an empty route table that rejects with NG04002 as an unhandled
 * rejection: the tests still pass, but the runner exits non-zero. A catch-all
 * route absorbs those navigations without asserting anything about them.
 */
@Component({ template: '' })
class BlankRouteTarget {}

export function configureFeatureTest(
  role: Role | 'ANONYMOUS' = 'ADMIN',
  extra: Provider[] = [],
): void {
  resetMockBackend();
  clearHttpCache();

  TestBed.configureTestingModule({
    providers: [
      ConsoleLogger,
      { provide: Logger, useExisting: ConsoleLogger },
      provideRouter([{ path: '**', component: BlankRouteTarget }]),
      provideHttpClient(
        withInterceptors([
          authInterceptor,
          cacheInterceptor,
          errorInterceptor,
          mockBackendInterceptor,
        ]),
      ),
      ...extra,
    ],
  });

  if (role !== 'ANONYMOUS') {
    // Name and directory id both match a seeded record, so "my own rows"
    // scoping resolves to a real person.
    const people: Record<Role, { name: string; employeeId: number | null }> = {
      ADMIN: { name: 'Aarav Mehta', employeeId: 1 },
      MANAGER: { name: 'Riya Sharma', employeeId: 2 },
      EMPLOYEE: { name: 'Daniel Okafor', employeeId: 3 },
      GUEST: { name: 'Guest', employeeId: null },
    };
    const { name, employeeId } = people[role];
    TestBed.inject(AuthService).login(name, role, false, employeeId);
  }
}

/** Text of every button currently rendered, trimmed. */
export function buttonTexts(element: HTMLElement): string[] {
  return [...element.querySelectorAll('button, a.btn')].map((b) => b.textContent?.trim() ?? '');
}
