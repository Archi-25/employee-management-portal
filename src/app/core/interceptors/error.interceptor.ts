import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiError } from '@core/models/api.model';
import { NotificationService } from '@core/services/notification.service';
import { Logger } from '@core/tokens/logger.token';

function describe(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Network unreachable. Check your connection and retry.';
  }
  if (error.status === 401 || error.status === 403) {
    return 'Your role is not permitted to perform this action.';
  }
  if (error.status === 404) {
    return 'The requested record no longer exists.';
  }
  if (error.status >= 500) {
    return 'The server failed to process the request. Please retry.';
  }
  return error.error?.message ?? error.message ?? 'Unexpected error.';
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);
  const logger = inject(Logger);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const apiError: ApiError = {
        status: error.status,
        message: describe(error),
        url: req.urlWithParams,
        timestamp: Date.now(),
      };

      logger.error(`${req.method} ${apiError.url} failed (${apiError.status})`);
      notifications.error(apiError.message);

      return throwError(() => apiError);
    }),
  );
};
