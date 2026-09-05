# Employee Management Portal

An enterprise-grade Angular 22 reference application built for the **Angular Advanced Training –
Practical Assessment**. Every module in the brief is implemented as a working, navigable screen
rather than an isolated snippet, and each one is annotated in the source with the module it
answers.

Standalone components throughout, **zoneless** change detection, signal-based state, SSR with
hydration, build-time i18n, and an Nx-managed workspace.

---

## Quick start

```bash
npm install
npm start                 # http://localhost:4200
```

| Command | What it does |
| --- | --- |
| `npm start` | Dev server (SSR dev-server, hydration active) |
| `npm run start:fr` | Dev server serving the French locale |
| `npm run build` | Production build — browser + server bundles |
| `npm run build:i18n` | Production build emitting `en-US` **and** `fr` |
| `npm run serve:ssr` | Run the built Express SSR server (port 4000) |
| `npm test` | Unit tests (Vitest) with coverage |
| `npm run lint` | ESLint over TypeScript **and** templates |
| `npm run extract-i18n` | Re-extract `src/locale/messages.xlf` |
| `npm run sonar` | SonarQube scan (`sonar-project.properties`) |
| `npx nx graph` | Nx project/task graph |

> This is an **Nx workspace**, so `angular.json` has been replaced by `nx.json` + `project.json`.
> Use `nx <target>` (or the npm scripts above) instead of `ng <target>`.

---

## Where each assessment module lives

| Module | Requirement | Route | Key source |
| --- | --- | --- | --- |
| **1** | Employee Profile component | `/employees` | [`employee-profile.ts`](src/app/features/employees/employee-profile/employee-profile.ts) |
| **1** | `@Input` / `@Output` | `/employees` | same — decorator **and** `input()`/`output()` forms side by side |
| **1** | ViewEncapsulation demo | `/employees/encapsulation` | [`encapsulation-demo.ts`](src/app/features/employees/encapsulation/encapsulation-demo.ts) |
| **1** | Local refs, ViewChild, ViewChildren | `/employees` | `employee-profile.ts` — decorator queries **and** signal queries |
| **1** | `ng-content` | `/employees` | `employee-profile.ts` (4 slots), [`card.ts`](src/app/shared/components/card/card.ts) (3 slots) |
| **2** | Role-based directive | `/directives` | [`has-role.directive.ts`](src/app/shared/directives/has-role.directive.ts) |
| **2** | `Renderer2` | `/directives` | [`role-badge.directive.ts`](src/app/shared/directives/role-badge.directive.ts) |
| **2** | `@HostListener` / `@HostBinding` | `/directives` | [`highlight.directive.ts`](src/app/shared/directives/highlight.directive.ts) |
| **2** | Structural directive | `/directives` | `has-role.directive.ts`, [`unless.directive.ts`](src/app/shared/directives/unless.directive.ts) |
| **3** | Default vs OnPush | `/employees/change-detection` | [`default-panel.ts`](src/app/features/employees/change-detection/default-panel.ts), [`on-push-panel.ts`](src/app/features/employees/change-detection/on-push-panel.ts) |
| **3** | Performance optimisation | `/employees/change-detection` | [`change-detection-page.ts`](src/app/features/employees/change-detection/change-detection-page.ts) |
| **4** | Lazy-loaded Admin **NgModule** | `/admin` | [`admin.module.ts`](src/app/features/admin/admin.module.ts) |
| **4** | Nested routes | `/admin/teams/:id` | [`admin-routing.module.ts`](src/app/features/admin/admin-routing.module.ts) — 3 levels deep |
| **4** | `PathLocationStrategy` | everywhere | [`app.config.ts`](src/app/app.config.ts) |
| **5** | Hierarchical DI | `/di` | [`di-lab.ts`](src/app/features/di-lab/di-lab.ts) |
| **5** | Providers | `/di` | `useValue`, `useClass`, `useFactory`, `useExisting`, `multi` — all five |
| **5** | `@Optional`, `@Host` | `/di` | `di-lab.ts` (plus `@Self`, `skipSelf`) |
| **6** | Custom observable | `/rxjs` | [`employee.service.ts`](src/app/core/services/employee.service.ts) |
| **6** | Observer | `/rxjs` | `employee.service.ts` → `watchStatusChanges` |
| **6** | `map`, `filter`, `takeUntil` | `/rxjs` | [`rxjs-lab.ts`](src/app/features/rxjs-lab/rxjs-lab.ts) |
| **7** | `DomSanitizer` | `/security` | [`security-lab.ts`](src/app/features/security/security-lab.ts) |
| **7** | XSS prevention | `/security` | same — one payload through six binding contexts |
| **8** | Auth interceptor | `/admin/interceptors` | [`auth.interceptor.ts`](src/app/core/interceptors/auth.interceptor.ts) |
| **8** | Error interceptor | `/admin/interceptors` | [`error.interceptor.ts`](src/app/core/interceptors/error.interceptor.ts) |
| **8** | Caching interceptor | `/admin/interceptors` | [`cache.interceptor.ts`](src/app/core/interceptors/cache.interceptor.ts) |
| **8** | Profiling interceptor | `/admin/interceptors` | [`profiling.interceptor.ts`](src/app/core/interceptors/profiling.interceptor.ts) |
| **9** | Standalone components | everywhere | every component; the only `NgModule` is the lazy admin one |
| **9** | Signals | `/modern` | [`modern-angular.ts`](src/app/features/modern/modern-angular.ts) |
| **9** | i18n | `/modern` | [`src/locale/`](src/locale), `npm run build:i18n` |
| **9** | SSR | `/modern` | [`server.ts`](src/server.ts), [`app.routes.server.ts`](src/app/app.routes.server.ts) |
| **9** | State management | `/modern` | [`employee.store.ts`](src/app/core/state/employee.store.ts) |
| **9** | Nx workspace | — | `nx.json`, `project.json` |
| **9** | Sonar issues | — | `sonar-project.properties`, `eslint.config.js` |

---

## Architecture

```
src/app/
├── core/          # no UI. models, DI tokens, services, interceptors, guards, state
├── shared/        # reusable UI. directives, pipes, presentational components
├── features/      # screens. one folder per feature, lazily routed
└── app.{ts,config.ts,routes.ts}
```

Imports may only travel **`features` → `shared` → `core`**. That is not a convention note — it is
enforced by `no-restricted-imports` rules in `eslint.config.js`, and `npm run lint` fails on a
violation. Path aliases (`@core/*`, `@shared/*`, `@features/*`) keep the layer visible at every
import site.

### Data flow

There is no external backend. `mockBackendInterceptor` sits at the **end** of the interceptor
chain and answers `/api/**` from memory, which means the auth, caching, error and profiling
interceptors all run for real against it — exactly as they would against a live server.

```
Component → EmployeeStore (SignalStore) → EmployeeService → HttpClient
                                                              │
   profiling → auth → cache → error → mockBackend  ◄───────────┘
```

---

## Module notes

### 1 · Component data binding & template interaction

`EmployeeProfile` deliberately shows both generations of each API next to each other:

* `@Input()` / `@Output() EventEmitter` **and** `input()` / `output()`
* `@ViewChild` / `@ViewChildren` (a `QueryList`, only valid from `ngAfterViewInit`) **and**
  `viewChild()` / `viewChildren()` (signals, valid immediately)
* template local references (`#noteBox`, `#skillList`) passed directly into handlers with no
  TypeScript query at all

Content projection uses four slots — `[profile-banner]`, `[profile-actions]`,
`[profile-footer]` and the catch-all — with a default rendered when a slot is left empty.

### 2 · Custom directives

Two structural (`*appHasRole` with an `else` branch, `*appUnless` written the classic setter way
so the `<ng-template>` desugaring is obvious) and two attribute directives. `HighlightDirective`
carries `@HostBinding` for class/attribute/style, `@HostListener` for five events, and `Renderer2`
for the platform-agnostic DOM writes. `RoleBadgeDirective` builds its DOM with
`createElement`/`setProperty`/`setStyle` — never `innerHTML`, so there is no injection surface.

### 3 · Change detection

The two panels render the same record under the two strategies, each with a live "checked N times"
counter driven by an impure pipe used as a probe. A noise timer dirties the application without
touching either input: the Default panel's counter climbs, the OnPush panel's does not. The
**Mutate in place** button then demonstrates the failure mode — the Default panel prints the new
salary while OnPush stays stale, because its input reference never changed.

### 4 · Advanced routing

`AdminModule` is a genuine lazy `NgModule` behind `loadChildren` (verify it: `admin-module` is its
own chunk in the build output). Its routes nest three levels deep — `/admin` → `/admin/teams` →
`/admin/teams/:id` — with a `<router-outlet>` at each level. Guards cover `CanActivate`,
`CanActivateChild` (so a mid-session role downgrade is caught) and `CanDeactivate`, plus a
resolver on the employee detail route. `PathLocationStrategy` is provided explicitly and
`<base href="/">` is what makes deep links work.

### 5 · Dependency injection

All five provider kinds appear: `useValue` (`APP_CONFIG`), `useClass`, `useFactory` (scoped
loggers), `useExisting` (aliasing the abstract `Logger` onto the `ConsoleLogger` singleton) and
`multi: true` (`FEATURE_FLAGS`, contributed by the root **and** by the lazy admin module).

Two `DiPanel` instances each provide their own `PanelContextService`, producing distinct instance
ids — the visible proof that a component-level provider is per-instance. The lazy `AdminModule`
creates an environment injector whose `Logger` shadows the root one for everything beneath it.

A subtlety the page demonstrates explicitly: **`@Host()` can see the host component's
`viewProviders` but not its `providers`.** Both live on the same element, but `providers` sits one
step further out so projected content can reach it too — and that extra step is past where
`@Host()` stops. `di-hierarchy.spec.ts` asserts both halves.

### 6 · RxJS

`headcountFeed()` is a hand-written `new Observable(subscriber => …)` with a real teardown
function, so you can watch the producer start on first subscribe and stop on `takeUntil`.
`watchStatusChanges()` takes an explicit `Observer` object (`next`/`error`/`complete`) rather than
positional callbacks. The page also has a `filterPositive()` custom operator and a
`debounceTime` → `distinctUntilChanged` → `switchMap` type-ahead over the HTTP layer.

### 7 · Security

One hostile payload — `<script>`, an `onerror` handler and a `javascript:` href — rendered through
six binding contexts so the difference is observable rather than asserted: interpolation,
`[innerHTML]`, an explicit `sanitize()` call showing what was stripped, a legitimate
`bypassSecurityTrustHtml` on a developer-authored constant, URL sanitisation, and resource URLs
behind a host allowlist. The stored employee bio carries a live `onerror` payload that is stripped
on render.

### 8 · HTTP interceptors

Registration order is outermost-first and each position is deliberate:

| Order | Interceptor | Why it sits there |
| --- | --- | --- |
| 1 | `profiling` | Wraps everything, so it can time a cache hit that never reaches the network |
| 2 | `auth` | Runs before the cache, so cached entries are already role-tagged |
| 3 | `cache` | TTL cache for GETs; any write invalidates it |
| 4 | `error` | Closest to the transport — sees the raw failure before anything transforms it |
| 5 | `mockBackend` | Terminates the chain in place of a server |

`/admin/interceptors` drives all of it live: request table, cache-hit counter, an `HttpContext`
token to bypass the cache per request, and a `/api/boom` endpoint that returns 500.

### 9 · Modern Angular

* **Signals** — `signal`, `computed`, `effect` and `linkedSignal` (the highlighted employee follows
  the roster but stays user-overridable until it reloads).
* **State** — `@ngrx/signals` `signalStore` with `withState` / `withComputed` / `withMethods` /
  `withHooks`. No actions, reducers or effects boilerplate.
* **i18n** — 19 marked messages with stable ids (`@@dashboard.title`), a French translation in
  `src/locale/messages.fr.xlf`, translated at build time. The default build stays single-locale so
  `dist/{browser,server}` keep their flat layout; `npm run build:i18n` emits both locales.
* **SSR** — per-route render modes in `app.routes.server.ts`. Most routes prerender; the
  encapsulation demo is `Client` because Shadow DOM has no server equivalent; `/employees` is
  `Server` because it is parameterised. Hydration uses `withEventReplay()`.
* **Nx** — cacheable `build` / `test` / `lint` targets. Re-run any of them for a cache hit.
* **Sonar** — `sonar-project.properties` with narrowly-scoped rule exclusions, each justified
  inline. ESLint runs the angular-eslint template rules plus accessibility checks.

---

## Testing

```bash
npm test
```

65 tests across 8 files: the full interceptor chain (header injection, cache hits, `CACHE_BYPASS`,
write invalidation, 403 on a non-admin delete, error normalisation), the SignalStore, all four
custom directives, the guards, DI hierarchy semantics, the pipes, and `EmployeeProfile` (queries,
every projection slot, both output styles, and that the bio is escaped rather than parsed).

---

## Try it

1. **Sign in** at `/login` and pick a role — the whole portal reacts. `*appHasRole` stamps and
   removes elements, guards redirect, the `Authorization` header changes, and the salary column
   appears or disappears.
2. Open `/admin/interceptors`, press **GET** twice, and watch the second request come back as a
   `CACHE` row in well under a millisecond.
3. Sign in as `EMPLOYEE` and try to delete someone from `/employees` — the mock backend returns
   403 and the error interceptor turns it into a toast.
4. Open `/employees/change-detection`, start the noise timer, and compare the two check counters.
5. Run `npm run build:i18n` and serve `dist/employee-management-portal/browser/fr/`.

## Notes and limitations

* The backend is in-memory: **data resets on reload**. This is intentional — it keeps the
  interceptor chain honest without requiring a server to run the assessment.
* Authentication is simulated. There is no password check and the session lives in a signal, not
  in storage, so it does not survive a reload.
* `security.allowedHosts` in `project.json` lists `localhost` and `127.0.0.1`. A real deployment
  must add its own domain or the SSR server will reject requests.
