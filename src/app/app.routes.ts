import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';

/**
 * Root route table. Every screen is lazily loaded, so the initial bundle
 * carries only the shell and whatever the landing route needs.
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  {
    path: 'dashboard',
    title: 'Dashboard · Employee Management Portal',
    loadComponent: () => import('@features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'login',
    title: 'Sign in · Employee Management Portal',
    loadComponent: () => import('@features/auth/login').then((m) => m.Login),
  },
  {
    path: 'employees',
    canActivate: [authGuard],
    loadChildren: () =>
      import('@features/employees/employees.routes').then((m) => m.EMPLOYEE_ROUTES),
  },
  {
    path: 'departments',
    canActivate: [authGuard],
    loadChildren: () =>
      import('@features/departments/departments.routes').then((m) => m.DEPARTMENT_ROUTES),
  },
  {
    path: 'attendance',
    title: 'Attendance · Employee Management Portal',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@features/attendance/attendance-page').then((m) => m.AttendancePage),
  },
  {
    path: 'leave',
    title: 'Leave · Employee Management Portal',
    canActivate: [authGuard],
    loadComponent: () => import('@features/leave/leave-page').then((m) => m.LeavePage),
  },
  {
    path: 'settings',
    title: 'Settings · Employee Management Portal',
    canActivate: [authGuard],
    loadComponent: () => import('@features/settings/settings-page').then((m) => m.SettingsPage),
  },

  // The admin area is a lazily loaded NgModule with its own environment injector.
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('MANAGER', 'ADMIN')],
    loadChildren: () => import('@features/admin/admin.module').then((m) => m.AdminModule),
  },

  {
    path: 'forbidden',
    title: 'Not permitted',
    loadComponent: () => import('@features/misc/forbidden').then((m) => m.Forbidden),
  },
  {
    path: '**',
    title: 'Page not found',
    loadComponent: () => import('@features/misc/not-found').then((m) => m.NotFound),
  },
];
