import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '@core/guards/unsaved-changes.guard';
import { roleGuard } from '@core/guards/role.guard';
import { employeeResolver } from '@core/resolvers/employee.resolver';

export const EMPLOYEE_ROUTES: Routes = [
  {
    path: '',
    title: 'Employees · Employee Management Portal',
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
    path: ':id',
    title: 'Employee profile',
    resolve: { employee: employeeResolver },
    loadComponent: () => import('./employee-detail/employee-detail').then((m) => m.EmployeeDetail),
  },
  {
    path: ':id/edit',
    title: 'Edit employee',
    canActivate: [roleGuard('MANAGER', 'ADMIN')],
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () => import('./employee-form/employee-form').then((m) => m.EmployeeForm),
  },
];
