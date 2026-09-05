import { Injectable, computed, inject, signal } from '@angular/core';
import { Role } from '@core/models/employee.model';
import { Logger } from '@core/tokens/logger.token';

export interface Session {
  userId: number;
  displayName: string;
  role: Role;
  token: string;
}

const RANK: Record<Role, number> = { GUEST: 0, EMPLOYEE: 1, MANAGER: 2, ADMIN: 3 };

/**
 * MODULE 9 — signal-based session state. No `BehaviorSubject` plumbing: templates,
 * guards and directives all read the same signals.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly logger = inject(Logger);
  private readonly session = signal<Session | null>(null);

  readonly currentSession = this.session.asReadonly();
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly role = computed<Role>(() => this.session()?.role ?? 'GUEST');
  readonly displayName = computed(() => this.session()?.displayName ?? 'Guest');
  readonly token = computed(() => this.session()?.token ?? null);

  login(displayName: string, role: Role): Session {
    const session: Session = {
      userId: 1,
      displayName,
      role,
      token: `emp-portal.${role.toLowerCase()}.${Date.now().toString(36)}`,
    };
    this.session.set(session);
    this.logger.info(`Signed in as ${displayName} (${role})`);
    return session;
  }

  /** Switches role without a round trip — used by the demo toolbar. */
  switchRole(role: Role): void {
    const current = this.session();
    if (!current) {
      this.login('Demo User', role);
      return;
    }
    this.session.set({ ...current, role, token: `emp-portal.${role.toLowerCase()}` });
    this.logger.info(`Role switched to ${role}`);
  }

  logout(): void {
    this.logger.info('Signed out');
    this.session.set(null);
  }

  /** True when the active role is at least as privileged as `required`. */
  hasRole(required: Role | readonly Role[]): boolean {
    const roles: readonly Role[] = Array.isArray(required) ? required : [required as Role];
    const active = RANK[this.role()];
    return roles.some((role) => active >= RANK[role]);
  }
}
