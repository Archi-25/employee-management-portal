import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { ConsoleLogger } from './logger.service';
import { Logger } from '@core/tokens/logger.token';

const STORAGE_KEY = 'emp-portal-session';

describe('AuthService', () => {
  let auth: AuthService;

  function freshService(): AuthService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ConsoleLogger, { provide: Logger, useExisting: ConsoleLogger }],
    });
    return TestBed.inject(AuthService);
  }

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    TestBed.configureTestingModule({
      providers: [ConsoleLogger, { provide: Logger, useExisting: ConsoleLogger }],
    });
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => localStorage.removeItem(STORAGE_KEY));

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

  describe('remember me', () => {
    it('does not persist the session by default', () => {
      auth.login('Riya', 'MANAGER');

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(freshService().isAuthenticated()).toBe(false);
    });

    it('restores a remembered session on the next visit', () => {
      auth.login('Riya', 'MANAGER', true);

      const restored = freshService();
      expect(restored.isAuthenticated()).toBe(true);
      expect(restored.displayName()).toBe('Riya');
      expect(restored.role()).toBe('MANAGER');
    });

    it('keeps a remembered session in step with a role switch', () => {
      auth.login('Riya', 'MANAGER', true);
      auth.switchRole('ADMIN');

      expect(freshService().role()).toBe('ADMIN');
    });

    it('forgets the session on logout', () => {
      auth.login('Riya', 'MANAGER', true);
      auth.logout();

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(freshService().isAuthenticated()).toBe(false);
    });

    it('ignores corrupt stored data instead of throwing', () => {
      localStorage.setItem(STORAGE_KEY, '{ not json');

      expect(() => freshService()).not.toThrow();
      expect(freshService().isAuthenticated()).toBe(false);
    });
  });
});
