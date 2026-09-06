import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';

/**
 * Blocks a route until a session exists, remembering the target URL.
 *
 * On the SERVER the guard always allows the navigation through. The session for
 * a remembered sign-in lives in `localStorage`, which the server cannot read, so
 * refusing there would bounce every deep link to the login page even for a
 * signed-in user. The browser re-runs this guard immediately after hydration and
 * redirects then if the visitor really is anonymous.
 *
 * (A production system would put the session in an httpOnly cookie, which the
 * server *can* read, and this exception would not be needed.)
 */
export const authGuard: CanActivateFn = (_route, state) => {
  if (isPlatformServer(inject(PLATFORM_ID))) {
    return true;
  }

  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  inject(NotificationService).info('Sign in to continue.');
  return router.createUrlTree(['/login'], { queryParams: { redirectTo: state.url } });
};
