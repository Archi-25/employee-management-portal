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

    // MODULE 3 — zoneless. Change detection is driven by signals, template
    // events and async-pipe emissions instead of monkey-patched browser APIs.
    provideZonelessChangeDetection(),

    provideRouter(
      routes,
      // MODULE 4 — clean URLs backed by the History API. This is the default
      // strategy; declaring it makes the choice explicit (and `<base href="/">`
      // in index.html is what makes it work on a deep link).
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      withComponentInputBinding(),
    ),
    { provide: LocationStrategy, useClass: PathLocationStrategy },

    // MODULE 8 — interceptor chain, OUTERMOST FIRST.
    // profiling wraps everything (so it can time a cache hit); auth runs before
    // the cache so entries are role-tagged; error sits closest to the transport;
    // the mock backend terminates the chain in place of a real server.
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

    // MODULE 9 — SSR hydration with event replay: interactions that happen
    // before hydration finishes are captured and replayed afterwards.
    provideClientHydration(withEventReplay()),

    // MODULE 5 — provider kinds at root. `useExisting` ALIASES the abstract
    // `Logger` token onto the concrete `ConsoleLogger` singleton, so both tokens
    // resolve to one instance (`useClass` would create a second one).
    ConsoleLogger,
    { provide: Logger, useExisting: ConsoleLogger },
    ...provideFeatureFlags(
      { key: 'portal.dark-mode', enabled: true },
      { key: 'portal.beta-search', enabled: false },
    ),
  ],
};
