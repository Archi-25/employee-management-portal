import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ConsoleLogger } from '@core/services/logger.service';
import { Logger } from '@core/tokens/logger.token';
import { authGuard } from './auth.guard';
import { roleGuard } from './role.guard';
import { HasUnsavedChanges, unsavedChangesGuard } from './unsaved-changes.guard';

function setup() {
  TestBed.configureTestingModule({
    providers: [ConsoleLogger, { provide: Logger, useExisting: ConsoleLogger }, provideRouter([])],
  });
  return {
    auth: TestBed.inject(AuthService),
    router: TestBed.inject(Router),
  };
}

/** Guards are functions that must run inside an injection context. */
function run<T>(fn: () => T): T {
  return TestBed.runInInjectionContext(fn);
}

describe('authGuard', () => {
  it('redirects an anonymous visitor to /login carrying the target url', () => {
    const { auth } = setup();
    auth.logout();

    const result = run(() => authGuard({} as never, { url: '/employees/3' } as never)) as UrlTree;

    expect(result instanceof UrlTree).toBe(true);
    expect(result.toString()).toContain('/login');
    expect(result.toString()).toContain('redirectTo');
  });

  it('lets an authenticated visitor through', () => {
    const { auth } = setup();
    auth.login('Riya', 'MANAGER');

    expect(run(() => authGuard({} as never, { url: '/employees' } as never))).toBe(true);
  });
});

describe('roleGuard', () => {
  it('admits a role at or above the requirement', () => {
    const { auth } = setup();
    auth.login('Aarav', 'ADMIN');

    expect(run(() => roleGuard('MANAGER')({} as never, {} as never))).toBe(true);
  });

  it('sends an under-privileged role to /forbidden', () => {
    const { auth } = setup();
    auth.login('Daniel', 'EMPLOYEE');

    const result = run(() => roleGuard('ADMIN')({} as never, {} as never)) as UrlTree;

    expect(result instanceof UrlTree).toBe(true);
    expect(result.toString()).toContain('/forbidden');
  });

  it('accepts any one of several allowed roles', () => {
    const { auth } = setup();
    auth.login('Riya', 'MANAGER');

    expect(run(() => roleGuard('MANAGER', 'ADMIN')({} as never, {} as never))).toBe(true);
  });
});

describe('unsavedChangesGuard', () => {
  const clean: HasUnsavedChanges = { hasUnsavedChanges: () => false };
  const dirty: HasUnsavedChanges = { hasUnsavedChanges: () => true };

  it('allows navigation away from a clean form without prompting', () => {
    expect(unsavedChangesGuard(clean, {} as never, {} as never, {} as never)).toBe(true);
  });

  it('asks for confirmation when the form is dirty', () => {
    const original = globalThis.confirm;
    globalThis.confirm = () => false;

    expect(unsavedChangesGuard(dirty, {} as never, {} as never, {} as never)).toBe(false);

    globalThis.confirm = () => true;
    expect(unsavedChangesGuard(dirty, {} as never, {} as never, {} as never)).toBe(true);

    globalThis.confirm = original;
  });
});
