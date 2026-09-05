import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

/**
 * MODULE 8 — attaches the bearer token and the active role to every outbound
 * request. Requests are immutable, so we clone with the extra headers.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'X-Portal-Role': auth.role(),
      },
    }),
  );
};
