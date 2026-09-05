import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';

/** MODULE 4 — blocks a route until a session exists, remembering the target URL. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  inject(NotificationService).info('Sign in to continue.');
  return router.createUrlTree(['/login'], { queryParams: { redirectTo: state.url } });
};
