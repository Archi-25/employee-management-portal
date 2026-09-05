import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';

/**
 * MODULE 4 — root route table.
 *
 * Standalone screens are loaded with `loadComponent`, the employees feature with
 * `loadChildren` over a routes array, and the admin area with `loadChildren`
 * over a real lazy `NgModule`.
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
    title: 'Sign in',
    loadComponent: () => import('@features/auth/login').then((m) => m.Login),
  },
  {
    path: 'employees',
    canActivate: [authGuard],
    loadChildren: () =>
      import('@features/employees/employees.routes').then((m) => m.EMPLOYEE_ROUTES),
  },
  {
    path: 'directives',
    title: 'Custom directives',
    loadComponent: () =>
      import('@features/directives-lab/directives-lab').then((m) => m.DirectivesLab),
  },
  {
    path: 'di',
    title: 'Dependency injection',
    loadComponent: () => import('@features/di-lab/di-lab').then((m) => m.DiLab),
  },
  {
    path: 'rxjs',
    title: 'RxJS',
    loadComponent: () => import('@features/rxjs-lab/rxjs-lab').then((m) => m.RxjsLab),
  },
  {
    path: 'security',
    title: 'Security',
    loadComponent: () => import('@features/security/security-lab').then((m) => m.SecurityLab),
  },
  {
    path: 'modern',
    title: 'Modern Angular',
    loadComponent: () => import('@features/modern/modern-angular').then((m) => m.ModernAngular),
  },

  // A lazy-loaded NgModule, not a standalone component (MODULE 4).
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
    title: 'Not found',
    loadComponent: () => import('@features/misc/not-found').then((m) => m.NotFound),
  },
];
