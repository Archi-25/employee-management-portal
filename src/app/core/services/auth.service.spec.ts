import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { ConsoleLogger } from './logger.service';
import { Logger } from '@core/tokens/logger.token';

describe('AuthService', () => {
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConsoleLogger, { provide: Logger, useExisting: ConsoleLogger }],
    });
    auth = TestBed.inject(AuthService);
  });

  it('starts unauthenticated as GUEST', () => {
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.role()).toBe('GUEST');
    expect(auth.token()).toBeNull();
  });

  it('issues a session and a token on login', () => {
    auth.login('Riya', 'MANAGER');

    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.displayName()).toBe('Riya');
    expect(auth.token()).toContain('manager');
  });

  it('treats roles as a hierarchy, not a set', () => {
    auth.login('Aarav', 'ADMIN');

    expect(auth.hasRole('EMPLOYEE')).toBe(true);
    expect(auth.hasRole('MANAGER')).toBe(true);
    expect(auth.hasRole('ADMIN')).toBe(true);
  });

  it('denies a role above the current one', () => {
    auth.login('Daniel', 'EMPLOYEE');

    expect(auth.hasRole('MANAGER')).toBe(false);
    expect(auth.hasRole(['MANAGER', 'ADMIN'])).toBe(false);
    expect(auth.hasRole(['EMPLOYEE', 'ADMIN'])).toBe(true);
  });

  it('clears the session on logout', () => {
    auth.login('Riya', 'MANAGER');
    auth.logout();

    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.role()).toBe('GUEST');
  });
});
