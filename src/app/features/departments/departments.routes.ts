import { Routes } from '@angular/router';

export const DEPARTMENT_ROUTES: Routes = [
  {
    path: '',
    title: 'Departments',
    loadComponent: () => import('./department-list').then((m) => m.DepartmentList),
    children: [
      {
        path: ':name',
        title: 'Department',
        loadComponent: () => import('./department-detail').then((m) => m.DepartmentDetail),
      },
    ],
  },
];
