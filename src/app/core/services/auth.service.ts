import { PLATFORM_ID, Injectable, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Role } from '@core/models/employee.model';
import { Logger } from '@core/tokens/logger.token';

const STORAGE_KEY = 'emp-portal-session';

export interface Session {
  employeeId: number | null;
  displayName: string;
  role: Role;
  token: string;
}

const RANK: Record<Role, number> = { GUEST: 0, EMPLOYEE: 1, MANAGER: 2, ADMIN: 3 };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly logger = inject(Logger);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly session = signal<Session | null>(this.restore());

  readonly currentSession = this.session.asReadonly();
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly role = computed<Role>(() => this.session()?.role ?? 'GUEST');
  readonly displayName = computed(() => this.session()?.displayName ?? 'Guest');
  readonly token = computed(() => this.session()?.token ?? null);
  readonly employeeId = computed(() => this.session()?.employeeId ?? null);

  login(
    displayName: string,
    role: Role,
    remember = false,
    employeeId: number | null = null,
  ): Session {
    const session: Session = {
      employeeId,
      displayName,
      role,
      token: `emp-portal.${role.toLowerCase()}.${Date.now().toString(36)}`,
    };
    this.session.set(session);
    this.persist(remember ? session : null);
    this.logger.info(`Signed in as ${displayName} (${role})`);
    return session;
  }

  switchRole(role: Role): void {
    const current = this.session();
    if (!current) {
      this.login('Demo User', role);
      return;
    }
    const next: Session = { ...current, role, token: `emp-portal.${role.toLowerCase()}` };
    this.session.set(next);
    // Keep a remembered session in step with the role being previewed.
    if (this.isRemembered()) {
      this.persist(next);
    }
    this.logger.info(`Role switched to ${role}`);
  }

  logout(): void {
    this.logger.info('Signed out');
    this.session.set(null);
    this.persist(null);
  }

  private isRemembered(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  }

  private persist(session: Session | null): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      if (session) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Blocked storage: the session still holds for this tab.
    }
  }

  private restore(): Session | null {
    if (!this.isBrowser) {
      // Never restore on the server — rendered HTML must not assume a session.
      return null;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as Partial<Session>;
      return parsed.displayName && parsed.role
        ? {
            employeeId: parsed.employeeId ?? null,
            displayName: parsed.displayName,
            role: parsed.role,
            token: parsed.token ?? `emp-portal.${parsed.role.toLowerCase()}`,
          }
        : null;
    } catch {
      return null;
    }
  }

  hasRole(required: Role | readonly Role[]): boolean {
    const roles: readonly Role[] = Array.isArray(required) ? required : [required as Role];
    const active = RANK[this.role()];
    return roles.some((role) => active >= RANK[role]);
  }
}
