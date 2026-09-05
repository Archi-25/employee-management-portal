# Assessment coverage

This document is the examiner's map. The application itself is a straight
Employee Management Portal with no teaching pages in it — every required
technique is used where a real product would use it, and this table says where.

Routes are given as you would reach them in the running app.

---

## Module 1 — Component data binding & template interaction

| Requirement | Where it is used | File |
| --- | --- | --- |
| Employee Profile component | Profile tab of an employee record | `src/app/features/employees/employee-profile/employee-profile.ts` |
| `@Input` | `employee` on the profile; `heading`/`subtitle` on `Card` | `employee-profile.ts`, `shared/components/card/card.ts` |
| `@Output` | `edit`, `remove`, `noteAdded` from the profile | `employee-profile.ts` |
| Signal `input()` / `output()` | `dense`, `showSalary`; `confirmed`/`cancelled` on the dialog | `employee-profile.ts`, `shared/components/confirm-dialog/confirm-dialog.ts` |
| `ViewEncapsulation.Emulated` | The default everywhere else | — |
| `ViewEncapsulation.ShadowDom` | Shareable employee badge — must resist the host page's styles | `shared/components/badge-widget/badge-widget.ts` |
| `ViewEncapsulation.None` | Printable record — `@page` rules must reach the document | `shared/components/print-record/print-record.ts` |
| Local template references | `#noteBox`, `#skillList`, `#skillChip`, `#profileHeader` | `employee-profile.html` |
| `@ViewChild` | `noteBoxRef` — clearing the notes field | `employee-profile.ts` |
| `@ViewChildren` | `skillChips` (a `QueryList`) — focusing the first skill | `employee-profile.ts` |
| Signal queries | `headerRef()`, `skillChipSignals()`, dialog's `cancelButton()` | `employee-profile.ts`, `confirm-dialog.ts` |
| `ng-content` | 4 slots on the profile, 3 on `Card`, 2 on the dialog | `employee-profile.html`, `card.ts`, `confirm-dialog.ts` |

**See it:** `/employees/1` → Overview tab (profile, projected banner/actions/footer),
Shareable badge tab (Shadow DOM), Printable record tab (global print styles).

---

## Module 2 — Custom directives

| Requirement | Where it is used | File |
| --- | --- | --- |
| Role-based directive | Hides Add / Edit / Remove from users who may not use them | `shared/directives/has-role.directive.ts` |
| Structural directive | `*appHasRole` and `*appFeatureFlag` — both own an `<ng-template>` | `has-role.directive.ts`, `feature-flag.directive.ts` |
| `Renderer2` | Tooltip bubble and role badge are built node by node, never with `innerHTML` | `tooltip.directive.ts`, `role-badge.directive.ts` |
| `@HostListener` | Tooltip show/hide; click-outside closes the row menu; Escape closes the dialog | `tooltip.directive.ts`, `click-outside.directive.ts`, `confirm-dialog.ts` |
| `@HostBinding` | Tooltip host gets `tabindex`, `aria-describedby` and a marker class | `tooltip.directive.ts` |

**See it:** `/employees` → hover a status chip (tooltip), open a row's `⋯` menu and
click elsewhere (click-outside), compare the menu contents as EMPLOYEE vs ADMIN
(role directive). `/admin/system` → the *Export payroll* button is absent because
its feature flag is off.

---

## Module 3 — Change detection

| Requirement | How it is met |
| --- | --- |
| OnPush | **Every** component in the application declares `ChangeDetectionStrategy.OnPush`. It is enforced by the `@angular-eslint/prefer-on-push-component-change-detection` rule, so a new component cannot opt out silently. |
| Immutable updates | The store never mutates an employee; `update` maps to a new object so OnPush inputs see a new reference (`core/state/employee.store.ts`). |
| Zoneless | `provideZonelessChangeDetection()` — change detection is driven by signals and template events, not by monkey-patched browser APIs (`app.config.ts`). |
| `@for` with `track` | Every list tracks by `id`, so rows are moved rather than rebuilt when the directory is sorted or filtered. |
| Pure pipes over methods | `initials`, `tenure` — a method in a template re-runs on every check; a pure pipe does not. |
| Debounced input | Search goes through a `Subject` + `debounceTime(250)`, so typing does not re-filter per keystroke (`employee-list.ts`). |
| Lazy routes | Every screen is a separate chunk; nothing off-screen is downloaded. |

### Default vs OnPush

The product uses OnPush everywhere, so there is no Default component left to point
at. The difference, stated plainly:

```ts
// Default: Angular checks this view on EVERY change-detection pass of the
// application, whether or not anything it displays actually changed.
changeDetection: ChangeDetectionStrategy.Default

// OnPush: Angular checks it only when
//   1. an @Input receives a NEW REFERENCE (in-place mutation is invisible),
//   2. an event fires from inside this view or a child,
//   3. a signal read in the template changes, or an async pipe emits,
//   4. ChangeDetectorRef.markForCheck() is called explicitly.
changeDetection: ChangeDetectionStrategy.OnPush
```

The failure mode OnPush introduces is the one worth knowing: mutating
`employee.salary` in place updates a Default view but leaves an OnPush view
showing the old number, because its input reference never changed. That is
exactly why `EmployeeStore.update()` replaces the object instead of mutating it.

---

## Module 4 — Advanced routing

| Requirement | Where it is used | File |
| --- | --- | --- |
| Lazy-loaded Admin **NgModule** | `/admin`, reached via `loadChildren` | `features/admin/admin.module.ts` |
| Nested routes | `/admin/*` under a shell with its own outlet; `/departments/:name` under the department list | `admin-routing.module.ts`, `departments/departments.routes.ts` |
| `PathLocationStrategy` | Provided explicitly; `<base href="/">` makes deep links resolve | `app.config.ts`, `src/index.html` |
| `CanActivate` | `authGuard` on every private area | `core/guards/auth.guard.ts` |
| `CanActivateChild` | Re-checks the role on each admin child navigation | `core/guards/role.guard.ts` |
| `CanDeactivate` | Warns before leaving a dirty employee form | `core/guards/unsaved-changes.guard.ts` |
| Resolver | Employee record fetched before the detail route activates | `core/resolvers/employee.resolver.ts` |

**Verify the laziness:** run `npm run build` and look for a chunk named
`admin-module` in the output — it is not in the initial bundle.

---

## Module 5 — Dependency injection

| Requirement | Where it is used | File |
| --- | --- | --- |
| Hierarchical DI | `AdminModule` re-provides `Logger`, so admin activity is tagged `admin` in the audit log instead of `root` | `admin.module.ts`, `pages/admin-audit.ts` |
| `useValue` | `APP_CONFIG` behind an `InjectionToken` | `core/tokens/app-config.token.ts` |
| `useExisting` | Aliases the abstract `Logger` onto the `ConsoleLogger` singleton — one instance, two tokens | `app.config.ts` |
| `useFactory` | Scoped logger built at injection time | `core/services/logger.service.ts` |
| `useClass` | `LocationStrategy` → `PathLocationStrategy` | `app.config.ts` |
| `multi: true` | `FEATURE_FLAGS`, contributed by the root **and** by the lazy admin module | `core/tokens/feature-flags.token.ts` |
| `@Host()` | `[appDialogClose]` finds the surrounding dialog and cannot escape it | `shared/directives/dialog-close.directive.ts` |
| `@Optional()` | Same directive is inert outside a dialog rather than throwing; `ANALYTICS` is never provided | `dialog-close.directive.ts`, `core/tokens/analytics.token.ts` |
| `skipSelf` | Reaching the root logger past a local override | `core/di.spec.ts` |
| `viewProviders` | `DialogRef` — visible to the dialog's own template only | `confirm-dialog.ts` |

### The `@Host()` subtlety

`@Host()` resolves a component's **`viewProviders`** but **not** its
`providers`. Both sit on the same element, but `providers` is one step further
out so that projected content can reach it too — and that extra step is past
where `@Host()` stops. `ConfirmDialog` therefore declares `DialogRef` in
`viewProviders`; declaring it in `providers` would make `[appDialogClose]`
silently resolve to `null`. This is the same contract `formControlName` has with
its parent form. Asserted in `core/di.spec.ts` and `shared/directives/directives.spec.ts`.

---

## Module 6 — RxJS

| Requirement | Where it is used | File |
| --- | --- | --- |
| Custom observable | `new Observable(subscriber => …)` for the dashboard presence feed, with a teardown that stops the poll when the last subscriber leaves | `core/services/headcount-feed.service.ts` |
| `Observer` object | The dashboard subscribes with an explicit `{ next, error, complete }` | `features/dashboard/dashboard.ts` |
| `map` | Reshapes the API envelope into a plain array | `core/services/employee.service.ts` |
| `filter` | Applied over the presence stream | `headcount-feed.service.ts` |
| `takeUntil` | A `destroy$` Subject closes every long-lived subscription on destroy | `dashboard.ts`, `employee-list.ts` |
| `debounceTime` + `distinctUntilChanged` | Directory search | `employee-list.ts` |
| `switchMap` / `firstValueFrom` | Store methods await the HTTP call | `core/state/employee.store.ts` |

**See it:** `/dashboard` → the *Online now* tile updates from the custom
observable. Navigate away and the poll stops — the teardown logs it.

---

## Module 7 — Security

| Requirement | Where it is used | File |
| --- | --- | --- |
| `DomSanitizer` | Announcement bodies are author-written rich text; the admin preview shows what sanitisation kept | `features/announcements/announcement-panel.ts`, `pages/admin-announcements.ts` |
| XSS prevention | Announcement rendering, employee bio, and the tooltip (`setProperty` on `textContent`, never `innerHTML`) | as above, plus `tooltip.directive.ts`, `role-badge.directive.ts` |

The seeded announcement *"Engineering all-hands moved to Thursday"* deliberately
contains `<img src="x" onerror="alert(...)">`. It is stored, it is served by the
API, and it never executes — the `onerror` attribute is absent from the rendered
DOM, including in server-rendered HTML. Asserted in
`features/announcements/announcement-panel.spec.ts`.

The admin composer goes further: it calls `DomSanitizer.sanitize()` explicitly and
warns the author when their markup was modified, so the removal is visible before
publishing rather than discovered afterwards.

`bypassSecurityTrust*` is **not used anywhere in the application.** That is the
correct answer for a portal that renders user-authored content.

---

## Module 8 — HTTP interceptors

Registration order is outermost-first, and each position is deliberate
(`app.config.ts`):

| Order | Interceptor | Why it sits there | File |
| --- | --- | --- | --- |
| 1 | Profiling | Wraps everything, so it can time a cache hit that never reaches the network | `core/interceptors/profiling.interceptor.ts` |
| 2 | Auth | Runs before the cache, so cached entries are already role-tagged | `auth.interceptor.ts` |
| 3 | Caching | TTL cache for GETs; any write invalidates it; `CACHE_BYPASS` opts out per request | `cache.interceptor.ts` |
| 4 | Error | Closest to the transport — sees the raw failure before anything transforms it, raises one toast, re-throws a normalised `ApiError` | `error.interceptor.ts` |
| 5 | Mock backend | Terminates the chain in place of a server | `mock-backend.interceptor.ts` |

**See it:** `/admin/system` shows request volume, average latency, cache hits and
a table of recent requests — all collected by the profiling interceptor. Browse
the directory, then return to that page.

**Error path:** sign in as EMPLOYEE and try to remove someone. The backend returns
403, the error interceptor turns it into a toast, and the store leaves the list
untouched.

---

## Module 9 — Modern Angular

| Requirement | How it is met |
| --- | --- |
| Standalone components | Every component. The only `NgModule` is `AdminModule`, kept deliberately to demonstrate lazy module loading. |
| Signals | `signal`, `computed` throughout; state, derived values and view queries are all signals. `core/state/*.store.ts`, every feature component. |
| i18n | `@angular/localize` with 22 marked messages and stable ids (`@@dashboard.title`). French translation in `src/locale/messages.fr.xlf`, applied at build time. `npm run build:i18n`. |
| SSR | `@angular/ssr` + Express. Per-route render modes in `app.routes.server.ts`: public pages prerender, data-driven pages render per request, admin is client-rendered. Hydration uses `withEventReplay()`. |
| State management | `@ngrx/signals` SignalStore — `withState` / `withComputed` / `withMethods` / `withHooks`. Two stores: `employee.store.ts`, `announcement.store.ts`. |
| Nx workspace | `nx.json` + `project.json`. `build`, `test` and `lint` are cacheable targets — re-run any of them for a cache hit. |
| Sonar | `sonar-project.properties` with narrowly-scoped, individually justified exclusions. ESLint runs angular-eslint's template and accessibility rules, plus architectural boundary rules. |

---

## Architecture

```
src/app/
├── core/       no UI — models, DI tokens, services, interceptors, guards, state
├── shared/     reusable UI — directives, pipes, presentational components
└── features/   screens — one folder per feature, lazily routed
```

Imports may only travel **`features` → `shared` → `core`**. This is enforced, not
merely documented: `no-restricted-imports` rules in `eslint.config.js` fail
`npm run lint` if `core` imports `shared`, or `shared` imports `features`.

## Tests

`npm test` — 78 tests across 10 files:

| File | Covers |
| --- | --- |
| `core/interceptors/interceptors.spec.ts` | The real chain: header injection, cache hits, `CACHE_BYPASS`, write invalidation, 403 on a non-admin delete, error normalisation |
| `core/state/employee.store.spec.ts` | Loading, filtering, derived values, create/update/remove, failure handling |
| `core/di.spec.ts` | Every provider kind, hierarchical shadowing, `skipSelf`, optional tokens |
| `shared/components/confirm-dialog/confirm-dialog.spec.ts` | `DialogRef` view scoping, projection defaults, focus management, outputs |
| `core/guards/guards.spec.ts` | `authGuard`, `roleGuard`, `unsavedChangesGuard` |
| `core/services/auth.service.spec.ts` | Session lifecycle and the role hierarchy |
| `shared/directives/directives.spec.ts` | All six directives, including `@Host()` resolution and its inert fallback |
| `shared/pipes/pipes.spec.ts` | `initials`, `tenure` |
| `features/employees/employee-profile/employee-profile.spec.ts` | Queries, all four projection slots, both output styles, bio escaping |
| `features/announcements/announcement-panel.spec.ts` | Ordering, rendering, and that the stored XSS payload never reaches the DOM |
