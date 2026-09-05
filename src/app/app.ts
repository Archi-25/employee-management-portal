import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ROLES, Role } from '@core/models/employee.model';
import { AuthService } from '@core/services/auth.service';
import { APP_CONFIG } from '@core/tokens/app-config.token';
import { ToastHost } from '@shared/components/toast-host/toast-host';
import { RoleBadgeDirective } from '@shared/directives/role-badge.directive';

interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly minRole?: Role;
}

const NAV: readonly NavItem[] = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/employees', label: 'Employees', minRole: 'EMPLOYEE' },
  { path: '/departments', label: 'Departments', minRole: 'EMPLOYEE' },
  { path: '/admin', label: 'Admin', minRole: 'MANAGER' },
];

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, RoleBadgeDirective, ToastHost],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly config = inject(APP_CONFIG);

  protected readonly roles: readonly Role[] = ROLES;
  protected readonly menuOpen = signal(false);

  /** Nav entries the current role may reach — the guards enforce it again. */
  protected readonly visibleNav = computed(() =>
    NAV.filter((item) => !item.minRole || this.auth.hasRole(item.minRole)),
  );

  protected switchRole(role: Role): void {
    this.auth.switchRole(role);
  }

  protected signOut(): void {
    this.auth.logout();
    void this.router.navigate(['/dashboard']);
  }
}
