import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * MODULE 9 — per-route render modes.
 *
 * Most routes are prerendered at build time (fastest possible first paint).
 * Anything that depends on browser-only APIs is marked `Client`, because there
 * is no server equivalent:
 *  - the encapsulation demo mounts a real Shadow DOM root,
 *  - the change-detection demo drives `setInterval` timers,
 *  - employee detail pages are parameterised and cheap to render on demand.
 */
export const serverRoutes: ServerRoute[] = [
  { path: 'employees/encapsulation', renderMode: RenderMode.Client },
  { path: 'employees/change-detection', renderMode: RenderMode.Client },
  { path: 'employees/**', renderMode: RenderMode.Server },
  { path: 'admin/**', renderMode: RenderMode.Client },
  { path: 'rxjs', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Prerender },
];
