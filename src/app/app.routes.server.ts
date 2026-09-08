import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Parameterised and data-driven screens render per request.
  { path: 'employees/**', renderMode: RenderMode.Server },
  { path: 'departments/**', renderMode: RenderMode.Server },
  { path: 'attendance', renderMode: RenderMode.Server },
  { path: 'leave', renderMode: RenderMode.Server },
  { path: 'settings', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },
  // Everything else is static enough to prerender at build time.
  { path: '**', renderMode: RenderMode.Prerender },
];
