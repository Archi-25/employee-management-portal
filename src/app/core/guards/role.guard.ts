import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { Role } from '@core/models/employee.model';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';

/**
 * MODULE 4 — factory guard. `roleGuard('ADMIN')` returns a `CanActivateFn`, so
 * the required role lives in the route definition instead of in the guard.
 */
export function roleGuard(...allowed: Role[]): CanActivateFn & CanActivateChildFn {
  return () => {
    // Same reasoning as authGuard: the server cannot see a remembered session,
    // so it defers the decision to the browser rather than refusing outright.
    if (isPlatformServer(inject(PLATFORM_ID))) {
      return true;
    }

    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.hasRole(allowed)) {
      return true;
    }

    inject(NotificationService).error(
      `Requires ${allowed.join(' or ')} — you are signed in as ${auth.role()}.`,
    );
    return router.createUrlTree(['/forbidden']);
  };
}
