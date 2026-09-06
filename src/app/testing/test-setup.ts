import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Provider } from '@angular/core';
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
      provideRouter([]),
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
    // Display name matches a seeded record so "my own rows" scoping resolves.
    const names: Record<Role, string> = {
      ADMIN: 'Aarav Mehta',
      MANAGER: 'Riya Sharma',
      EMPLOYEE: 'Daniel Okafor',
      GUEST: 'Guest',
    };
    TestBed.inject(AuthService).login(names[role], role);
  }
}

/** Text of every button currently rendered, trimmed. */
export function buttonTexts(element: HTMLElement): string[] {
  return [...element.querySelectorAll('button, a.btn')].map((b) => b.textContent?.trim() ?? '');
}
