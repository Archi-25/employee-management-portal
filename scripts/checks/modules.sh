#!/usr/bin/env bash
cd /Users/aarchi/Employee-management-portal
PASS=0; FAIL=0
chk() { # chk "label" "grep-pattern" "path-glob"
  local label="$1" pat="$2" path="${3:-src}"
  local hit
  hit=$(grep -rlE "$pat" $path 2>/dev/null | grep -v "\.spec\.ts" | head -1)
  if [ -z "$hit" ]; then
    hit=$(grep -rlE "$pat" $path 2>/dev/null | head -1)
    [ -n "$hit" ] && { printf "  ⚠️  %-46s %s (tests only)\n" "$label" "${hit#src/app/}"; PASS=$((PASS+1)); return; }
  fi
  if [ -n "$hit" ]; then printf "  ✅ %-46s %s\n" "$label" "${hit#src/app/}"; PASS=$((PASS+1))
  else printf "  ❌ %-46s NOT FOUND\n" "$label"; FAIL=$((FAIL+1)); fi
}
chkf() { # chkf "label" "file"
  local label="$1" f="$2"
  if [ -e "$f" ]; then printf "  ✅ %-46s %s\n" "$label" "$f"; PASS=$((PASS+1))
  else printf "  ❌ %-46s MISSING: %s\n" "$label" "$f"; FAIL=$((FAIL+1)); fi
}

echo "MODULE 1 — Component Data Binding & Template Interaction"
chk "Employee Profile Component" "class EmployeeProfile"
chk "@Input" "@Input\("
chk "@Output" "@Output\("
chk "signal input() / output()" "= (input|output)(\.required)?[<(]"
chk "ViewEncapsulation.Emulated" "ViewEncapsulation.Emulated"
chk "ViewEncapsulation.None" "ViewEncapsulation.None"
chk "ViewEncapsulation.ShadowDom" "ViewEncapsulation.ShadowDom"
chk "Local template references (#ref)" "#noteBox|#skillChip|#profileHeader"
chk "@ViewChild" "@ViewChild\("
chk "@ViewChildren" "@ViewChildren\("
chk "signal viewChild()/viewChildren()" "viewChild<|viewChildren<"
chk "ng-content" "<ng-content"

echo; echo "MODULE 2 — Custom Directives"
chk "Role-based directive" "class HasRoleDirective"
chk "Renderer2" "Renderer2"
chk "@HostListener" "@HostListener\("
chk "@HostBinding" "@HostBinding\("
chk "Structural directive (TemplateRef)" "TemplateRef" "src/app/shared/directives"

echo; echo "MODULE 3 — Change Detection"
chk "OnPush strategy" "ChangeDetectionStrategy.OnPush"
chk "Default strategy (for comparison)" "ChangeDetectionStrategy.Default"
chk "Zoneless change detection" "provideZonelessChangeDetection"
chk "@for track (stable keys)" "@for .*track"
chk "Pure pipes over template methods" "@Pipe\(\{ name: 'tenure'"
chk "Debounced input" "debounceTime"

echo; echo "MODULE 4 — Advanced Routing"
chk "Lazy-loaded Admin NgModule" "loadChildren.*AdminModule"
chk "@NgModule" "@NgModule"
chk "Nested routes (children)" "children: \["
chk "PathLocationStrategy" "PathLocationStrategy"
chk "CanActivate guard" "CanActivateFn"
chk "CanActivateChild guard" "canActivateChild"
chk "CanDeactivate guard" "CanDeactivateFn"
chk "Resolver" "ResolveFn"

echo; echo "MODULE 5 — Dependency Injection"
chk "Hierarchical DI (component providers)" "viewProviders:|providers: \[PanelContext|providers: \[\{ provide: Logger"
chk "useValue" "useValue"
chk "useClass" "useClass"
chk "useFactory" "useFactory"
chk "useExisting" "useExisting"
chk "multi: true" "multi: true"
chk "InjectionToken" "new InjectionToken"
chk "@Optional" "@Optional\(\)"
chk "@Host" "@Host\(\)"
chk "skipSelf" "skipSelf"

echo; echo "MODULE 6 — RxJS"
chk "Custom observable (new Observable)" "new Observable<"
chk "Observer object" "Observer<"
chk "map operator" "\bmap\("
chk "filter / distinctUntilChanged" "distinctUntilChanged|[^a-zA-Z]filter\("
chk "takeUntil" "takeUntil"
chk "Subject teardown" "destroy\\\$"

echo; echo "MODULE 7 — Security"
chk "DomSanitizer" "DomSanitizer"
chk "SecurityContext / sanitize()" "SecurityContext"
chk "XSS payload in seed (proof)" "onerror"

echo; echo "MODULE 8 — HTTP Interceptors"
chkf "Auth interceptor" "src/app/core/interceptors/auth.interceptor.ts"
chkf "Error interceptor" "src/app/core/interceptors/error.interceptor.ts"
chkf "Caching interceptor" "src/app/core/interceptors/cache.interceptor.ts"
chkf "Profiling interceptor" "src/app/core/interceptors/profiling.interceptor.ts"
chk "Registered in provideHttpClient" "withInterceptors"

echo; echo "MODULE 9 — Modern Angular"
chk "Standalone components" "@Component"
chk "signal()" "signal\("
chk "computed()" "computed\("
chk "effect()" "effect\("
chk "i18n markers" "i18n="
chkf "i18n source messages" "src/locale/messages.xlf"
chkf "i18n French translation" "src/locale/messages.fr.xlf"
chkf "SSR server entry" "src/server.ts"
chkf "SSR route render modes" "src/app/app.routes.server.ts"
chk "State management (SignalStore)" "signalStore"
chkf "Nx workspace config" "nx.json"
chkf "Nx project config" "project.json"
chkf "Sonar config" "sonar-project.properties"
chkf "ESLint config" "eslint.config.js"

echo; echo "SUBMISSION"
chkf "Git repository" ".git"
chkf "README" "README.md"
chkf "Assessment mapping doc" "docs/ASSESSMENT.md"

echo
echo "──────────────────────────────────────────────────────"
printf "  PASS: %d    FAIL: %d\n" "$PASS" "$FAIL"
