import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Per-route render modes.
 *
 * Public, static pages are prerendered at build time for the fastest possible
 * first paint. Data-driven pages render per request. The admin area is
 * client-rendered: it is private, highly interactive, and the shareable badge
 * mounts a real Shadow DOM root, which has no server-side equivalent.
 */
export const serverRoutes: ServerRoute[] = [
  // Parameterised and data-driven screens render per request.
  { path: 'employees/**', renderMode: RenderMode.Server },
  { path: 'departments/**', renderMode: RenderMode.Server },
  // The admin area is private and interactive; there is nothing to gain from
  // prerendering it, and the badge widget needs a real Shadow DOM root.
  { path: 'admin/**', renderMode: RenderMode.Client },
  // Everything else is static enough to prerender at build time.
  { path: '**', renderMode: RenderMode.Prerender },
];
