import { Routes } from '@angular/router';

/** Nested feature routes: a list that hosts its own child detail outlet. */
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
