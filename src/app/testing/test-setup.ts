import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Component, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { cacheInterceptor, clearHttpCache } from '@core/interceptors/cache.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import {
  mockBackendInterceptor,
  resetMockBackend,
} from '@core/interceptors/mock-backend.interceptor';
import { Role } from '@core/models/employee.model';
import { AuthService } from '@core/services/auth.service';
import { ConsoleLogger } from '@core/services/logger.service';
import { Logger } from '@core/tokens/logger.token';

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

export function buttonTexts(element: HTMLElement): string[] {
  return [...element.querySelectorAll('button, a.btn')].map((b) => b.textContent?.trim() ?? '');
}
