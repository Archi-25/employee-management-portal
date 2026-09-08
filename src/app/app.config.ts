import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { LocationStrategy, PathLocationStrategy } from '@angular/common';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withRouterConfig,
} from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { cacheInterceptor } from '@core/interceptors/cache.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { mockBackendInterceptor } from '@core/interceptors/mock-backend.interceptor';
import { profilingInterceptor } from '@core/interceptors/profiling.interceptor';
import { ConsoleLogger } from '@core/services/logger.service';
import { Logger } from '@core/tokens/logger.token';
import { provideFeatureFlags } from '@core/tokens/feature-flags.token';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideZonelessChangeDetection(),

    provideRouter(
      routes,
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      withComponentInputBinding(),
    ),
    { provide: LocationStrategy, useClass: PathLocationStrategy },

    provideHttpClient(
      withFetch(),
      withInterceptors([
        profilingInterceptor,
        authInterceptor,
        cacheInterceptor,
        errorInterceptor,
        mockBackendInterceptor,
      ]),
    ),

    provideClientHydration(withEventReplay()),

    ConsoleLogger,
    { provide: Logger, useExisting: ConsoleLogger },
    ...provideFeatureFlags(
      { key: 'portal.dark-mode', enabled: true },
      { key: 'portal.beta-search', enabled: false },
    ),
  ],
};
