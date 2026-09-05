import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap } from 'rxjs/operators';
import { Page } from '@core/models/api.model';
import { Employee, EmployeeDraft } from '@core/models/employee.model';
import { EMPLOYEE_SEED } from '@core/services/employee-seed';

/**
 * The portal ships without a backend, so this interceptor terminates the chain
 * and answers `/api/**` from memory. It is registered LAST, which means auth,
 * error, cache and profiling all run against it exactly as they would against a
 * real server.
 */
const LATENCY_MS = 220;

let employees: Employee[] = EMPLOYEE_SEED.map((employee) => ({ ...employee }));
let nextId = employees.length + 1;

export function resetMockBackend(): void {
  employees = EMPLOYEE_SEED.map((employee) => ({ ...employee }));
  nextId = employees.length + 1;
}

function matchesSearch(employee: Employee, term: string): boolean {
  const haystack =
    `${employee.firstName} ${employee.lastName} ${employee.email} ${employee.title}`.toLowerCase();
  return haystack.includes(term.toLowerCase());
}

function collection(req: HttpRequest<unknown>): HttpResponse<Page<Employee>> {
  const search = req.params.get('search') ?? '';
  const department = req.params.get('department');
  const status = req.params.get('status');

  const items = employees.filter(
    (employee) =>
      (!search || matchesSearch(employee, search)) &&
      (!department || employee.department === department) &&
      (!status || employee.status === status),
  );

  return new HttpResponse({ status: 200, body: { items, total: items.length } });
}

function notFound(url: string): HttpErrorResponse {
  return new HttpErrorResponse({ status: 404, statusText: 'Not Found', url });
}

function handle(req: HttpRequest<unknown>): Observable<HttpResponse<unknown>> {
  const url = new URL(req.url, 'http://localhost').pathname;
  const idMatch = /^\/api\/employees\/(\d+)$/.exec(url);
  const id = idMatch ? Number(idMatch[1]) : null;
  const role = req.headers.get('X-Portal-Role') ?? 'GUEST';

  if (url === '/api/employees' && req.method === 'GET') {
    return of(collection(req));
  }

  if (url === '/api/departments' && req.method === 'GET') {
    const names = [...new Set(employees.map((employee) => employee.department))].sort();
    return of(new HttpResponse({ status: 200, body: names }));
  }

  // Deliberate failure endpoint used by the interceptor demo page.
  if (url === '/api/boom') {
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 500,
          statusText: 'Internal Server Error',
          url: req.url,
          error: { message: 'Simulated backend failure.' },
        }),
    );
  }

  if (id !== null) {
    const index = employees.findIndex((employee) => employee.id === id);
    if (index === -1) {
      return throwError(() => notFound(req.url));
    }

    if (req.method === 'GET') {
      return of(new HttpResponse({ status: 200, body: { ...employees[index] } }));
    }

    if (req.method === 'PUT') {
      const patch = req.body as Partial<EmployeeDraft>;
      employees[index] = { ...employees[index], ...patch, id };
      return of(new HttpResponse({ status: 200, body: { ...employees[index] } }));
    }

    if (req.method === 'DELETE') {
      if (role !== 'ADMIN') {
        return throwError(
          () =>
            new HttpErrorResponse({
              status: 403,
              statusText: 'Forbidden',
              url: req.url,
              error: { message: 'Only ADMIN may delete employee records.' },
            }),
        );
      }
      employees.splice(index, 1);
      return of(new HttpResponse({ status: 204 }));
    }
  }

  if (url === '/api/employees' && req.method === 'POST') {
    const created: Employee = { ...(req.body as EmployeeDraft), id: nextId++ };
    employees = [created, ...employees];
    return of(new HttpResponse({ status: 201, body: created }));
  }

  return throwError(() => notFound(req.url));
}

export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) {
    return next(req);
  }

  // `mergeMap` defers the handler so the latency is applied to the work itself.
  return of(null).pipe(
    mergeMap(() => handle(req)),
    delay(LATENCY_MS),
  );
};
