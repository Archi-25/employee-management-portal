import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Role } from '@core/models/employee.model';
import { AuthService } from '@core/services/auth.service';
import { ThemeService } from '@core/services/theme.service';
import { NotificationStore } from '@core/state/notification.store';
import { APP_CONFIG } from '@core/tokens/app-config.token';
import { NotificationBell } from '@shared/components/notification-bell/notification-bell';
import { ToastHost } from '@shared/components/toast-host/toast-host';
import { ClickOutsideDirective } from '@shared/directives/click-outside.directive';
import { Icon, IconName } from '@shared/components/icon/icon';
import { InitialsPipe } from '@shared/pipes/initials.pipe';

interface NavItem {
  readonly path: string;
  readonly label: string;
  readonly icon: IconName;
  readonly minRole?: Role;
}

const NAV: readonly NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/employees', label: 'Employees', icon: 'users', minRole: 'EMPLOYEE' },
  { path: '/attendance', label: 'Attendance', icon: 'clock', minRole: 'EMPLOYEE' },
  { path: '/leave', label: 'Leave', icon: 'calendar', minRole: 'EMPLOYEE' },
  { path: '/departments', label: 'Departments', icon: 'building', minRole: 'EMPLOYEE' },
  { path: '/admin', label: 'Admin', icon: 'sliders', minRole: 'MANAGER' },
];

const THEME_LABEL = { system: 'System', light: 'Light', dark: 'Dark' } as const;
const THEME_ICON = {
  system: 'monitor',
  light: 'sun',
  dark: 'moon',
} as const satisfies Record<string, IconName>;

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NotificationBell,
    ToastHost,
    ClickOutsideDirective,
    Icon,
    InitialsPipe,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationStore);
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  protected readonly config = inject(APP_CONFIG);

  protected readonly menuOpen = signal(false);
  protected readonly accountOpen = signal(false);

  protected readonly visibleNav = computed(() =>
    NAV.filter((item) => !item.minRole || this.auth.hasRole(item.minRole)),
  );

  protected readonly themeLabel = computed(() => THEME_LABEL[this.theme.preference()]);
  protected readonly themeIcon = computed(() => THEME_ICON[this.theme.preference()]);

  constructor() {
    void this.notifications.load();
  }

  protected signOut(): void {
    this.accountOpen.set(false);
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
