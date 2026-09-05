import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '@core/guards/unsaved-changes.guard';
import { roleGuard } from '@core/guards/role.guard';
import { employeeResolver } from '@core/resolvers/employee.resolver';

/**
 * MODULE 4 — feature routes loaded lazily by the root router with
 * `loadChildren`. Standalone components use `loadComponent` per route, so each
 * screen is its own chunk.
 */
export const EMPLOYEE_ROUTES: Routes = [
  {
    path: '',
    title: 'Employee directory',
    loadComponent: () => import('./employee-list/employee-list').then((m) => m.EmployeeList),
  },
  {
    path: 'new',
    title: 'New employee',
    canActivate: [roleGuard('MANAGER', 'ADMIN')],
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () => import('./employee-form/employee-form').then((m) => m.EmployeeForm),
  },
  {
    path: 'encapsulation',
    title: 'View encapsulation',
    loadComponent: () =>
      import('./encapsulation/encapsulation-demo').then((m) => m.EncapsulationPage),
  },
  {
    path: 'change-detection',
    title: 'Change detection',
    loadComponent: () =>
      import('./change-detection/change-detection-page').then((m) => m.ChangeDetectionPage),
  },
  {
    path: ':id',
    title: 'Employee profile',
    resolve: { employee: employeeResolver },
    loadComponent: () =>
      import('./employee-detail/employee-detail').then((m) => m.EmployeeDetail),
  },
  {
    path: ':id/edit',
    title: 'Edit employee',
    canActivate: [roleGuard('MANAGER', 'ADMIN')],
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () => import('./employee-form/employee-form').then((m) => m.EmployeeForm),
  },
];
