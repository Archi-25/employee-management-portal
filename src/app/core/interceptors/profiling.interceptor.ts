import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize, tap } from 'rxjs/operators';
import { ProfilingService } from '@core/services/profiling.service';

export const profilingInterceptor: HttpInterceptorFn = (req, next) => {
  const profiling = inject(ProfilingService);
  const startedAt = performance.now();
  let status: number | 'CACHE' | 'ERROR' = 'ERROR';
  let sawNetworkResponse = false;

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          sawNetworkResponse = true;
          status = event.status;
        }
      },
      error: () => {
        status = 'ERROR';
      },
    }),
    finalize(() => {
      const durationMs = Math.round((performance.now() - startedAt) * 100) / 100;
      profiling.record({
        method: req.method,
        url: req.urlWithParams,
        // A synchronous response under a millisecond is the cache short-circuit.
        status: sawNetworkResponse && durationMs < 1 ? 'CACHE' : status,
        durationMs,
      });
    }),
  );
};
