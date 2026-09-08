import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { Role } from '@core/models/employee.model';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';

export function roleGuard(...allowed: Role[]): CanActivateFn & CanActivateChildFn {
  return () => {
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
