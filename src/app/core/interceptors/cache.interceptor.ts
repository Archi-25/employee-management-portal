import { HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { APP_CONFIG } from '@core/tokens/app-config.token';
import { CACHE_BYPASS } from '@core/interceptors/cache.context';

interface CacheEntry {
  response: HttpResponse<unknown>;
  storedAt: number;
}

const store = new Map<string, CacheEntry>();

export function clearHttpCache(): void {
  store.clear();
}

export function httpCacheSize(): number {
  return store.size;
}

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  const { httpCacheTtlMs } = inject(APP_CONFIG);

  if (req.method !== 'GET') {
    // Any write invalidates cached reads — cheapest correct strategy here.
    return next(req).pipe(tap(() => clearHttpCache()));
  }

  if (req.context.get(CACHE_BYPASS)) {
    return next(req);
  }

  const key = req.urlWithParams;
  const hit = store.get(key);

  if (hit && Date.now() - hit.storedAt < httpCacheTtlMs) {
    return of(hit.response.clone()) as Observable<HttpEvent<unknown>>;
  }

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        store.set(key, { response: event.clone(), storedAt: Date.now() });
      }
    }),
  );
};
