import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap } from 'rxjs/operators';
import { Announcement, AnnouncementDraft } from '@core/models/announcement.model';
import { Employee, EmployeeDraft, nextEmployeeCode } from '@core/models/employee.model';
import {
  AppNotification,
  AttendanceRecord,
  DepartmentDraft,
  DepartmentRecord,
  EmployeeDocument,
  LeaveBalance,
  LeaveDraft,
  LeaveRequest,
  countLeaveDays,
} from '@core/models/hr.model';
import {
  ANNOUNCEMENT_SEED,
  ATTENDANCE_SEED,
  DEPARTMENT_SEED,
  DOCUMENT_SEED,
  EMPLOYEE_SEED,
  LEAVE_BALANCE_SEED,
  LEAVE_SEED,
  NOTIFICATION_SEED,
} from '@core/services/employee-seed';

/**
 * The portal ships without a server, so this interceptor terminates the chain
 * and answers `/api/**` from memory. It is registered LAST, which means auth,
 * error, cache and profiling all run against it exactly as they would against a
 * real backend — swapping in a real API means deleting this one file.
 */
const LATENCY_MS = 180;

interface Db {
  employees: Employee[];
  departments: DepartmentRecord[];
  attendance: AttendanceRecord[];
  leave: LeaveRequest[];
  balances: LeaveBalance[];
  documents: EmployeeDocument[];
  notifications: AppNotification[];
  announcements: Announcement[];
}

const clone = <T>(rows: readonly T[]): T[] => rows.map((row) => ({ ...row }));

function seed(): Db {
  return {
    employees: clone(EMPLOYEE_SEED),
    departments: clone(DEPARTMENT_SEED),
    attendance: clone(ATTENDANCE_SEED),
    leave: clone(LEAVE_SEED),
    balances: clone(LEAVE_BALANCE_SEED),
    documents: clone(DOCUMENT_SEED),
    notifications: clone(NOTIFICATION_SEED),
    announcements: clone(ANNOUNCEMENT_SEED),
  };
}

let db: Db = seed();
const nextId = (rows: { id: number }[]): number =>
  rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;

export function resetMockBackend(): void {
  db = seed();
}

// ----------------------------------------------------------------- responses

const ok = <T>(body: T, status = 200) => of(new HttpResponse({ status, body }));
const noContent = () => of(new HttpResponse<null>({ status: 204 }));
const page = <T>(items: T[]) => ok({ items, total: items.length });

function fail(status: number, message: string, url: string): Observable<never> {
  return throwError(
    () => new HttpErrorResponse({ status, url, statusText: message, error: { message } }),
  );
}

const notFound = (url: string) => fail(404, 'Not Found', url);
const forbidden = (url: string, message: string) => fail(403, message, url);

// ------------------------------------------------------------------ handlers

function handleEmployees(
  req: HttpRequest<unknown>,
  path: string,
  role: string,
): Observable<HttpResponse<unknown>> | null {
  const idMatch = /^\/api\/employees\/(\d+)$/.exec(path);

  if (path === '/api/employees' && req.method === 'GET') {
    const search = (req.params.get('search') ?? '').toLowerCase();
    const department = req.params.get('department');
    const status = req.params.get('status');

    return page(
      db.employees.filter((employee) => {
        const haystack =
          `${employee.firstName} ${employee.lastName} ${employee.email} ${employee.title} ${employee.code}`.toLowerCase();
        return (
          (!search || haystack.includes(search)) &&
          (!department || employee.department === department) &&
          (!status || employee.status === status)
        );
      }),
    );
  }

  if (path === '/api/employees' && req.method === 'POST') {
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      return forbidden(req.url, 'Only managers may add employees.');
    }
    const created: Employee = {
      ...(req.body as EmployeeDraft),
      id: nextId(db.employees),
      code: nextEmployeeCode(db.employees),
    };
    db.employees = [created, ...db.employees];
    return ok(created, 201);
  }

  if (!idMatch) {
    return null;
  }

  const id = Number(idMatch[1]);
  const index = db.employees.findIndex((employee) => employee.id === id);
  if (index === -1) {
    return notFound(req.url);
  }

  if (req.method === 'GET') {
    return ok({ ...db.employees[index] });
  }

  if (req.method === 'PUT') {
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      return forbidden(req.url, 'Only managers may edit employee records.');
    }
    db.employees[index] = { ...db.employees[index], ...(req.body as Partial<EmployeeDraft>), id };
    return ok({ ...db.employees[index] });
  }

  if (req.method === 'DELETE') {
    if (role !== 'ADMIN') {
      return forbidden(req.url, 'Only administrators may delete employee records.');
    }
    db.employees.splice(index, 1);
    return noContent();
  }

  return null;
}

function handleDepartments(
  req: HttpRequest<unknown>,
  path: string,
  role: string,
): Observable<HttpResponse<unknown>> | null {
  const idMatch = /^\/api\/departments\/(\d+)$/.exec(path);

  if (path === '/api/departments' && req.method === 'GET') {
    return page(clone(db.departments));
  }

  if (path === '/api/departments' && req.method === 'POST') {
    if (role !== 'ADMIN') {
      return forbidden(req.url, 'Only administrators may add departments.');
    }
    const created: DepartmentRecord = {
      ...(req.body as DepartmentDraft),
      id: nextId(db.departments),
    };
    db.departments = [...db.departments, created];
    return ok(created, 201);
  }

  if (!idMatch) {
    return null;
  }

  const id = Number(idMatch[1]);
  const index = db.departments.findIndex((department) => department.id === id);
  if (index === -1) {
    return notFound(req.url);
  }

  if (req.method === 'PUT') {
    if (role !== 'ADMIN') {
      return forbidden(req.url, 'Only administrators may edit departments.');
    }
    db.departments[index] = { ...db.departments[index], ...(req.body as DepartmentDraft), id };
    return ok({ ...db.departments[index] });
  }

  if (req.method === 'DELETE') {
    if (role !== 'ADMIN') {
      return forbidden(req.url, 'Only administrators may delete departments.');
    }
    const inUse = db.employees.some((e) => e.department === db.departments[index].name);
    if (inUse) {
      return fail(409, 'This department still has employees assigned to it.', req.url);
    }
    db.departments.splice(index, 1);
    return noContent();
  }

  return null;
}

function handleAttendance(
  req: HttpRequest<unknown>,
  path: string,
): Observable<HttpResponse<unknown>> | null {
  if (path !== '/api/attendance' || req.method !== 'GET') {
    return null;
  }

  const date = req.params.get('date');
  const employeeId = req.params.get('employeeId');
  const status = req.params.get('status');

  return page(
    db.attendance.filter(
      (record) =>
        (!date || record.date === date) &&
        (!employeeId || record.employeeId === Number(employeeId)) &&
        (!status || record.status === status),
    ),
  );
}

function handleLeave(
  req: HttpRequest<unknown>,
  path: string,
  role: string,
): Observable<HttpResponse<unknown>> | null {
  if (path === '/api/leave' && req.method === 'GET') {
    const employeeId = req.params.get('employeeId');
    const status = req.params.get('status');
    return page(
      db.leave.filter(
        (request) =>
          (!employeeId || request.employeeId === Number(employeeId)) &&
          (!status || request.status === status),
      ),
    );
  }

  if (path === '/api/leave' && req.method === 'POST') {
    const draft = req.body as LeaveDraft;
    const created: LeaveRequest = {
      ...draft,
      id: nextId(db.leave),
      days: countLeaveDays(draft.from, draft.to),
      status: 'PENDING',
      appliedOn: new Date().toISOString().slice(0, 10),
      decidedBy: null,
    };
    db.leave = [created, ...db.leave];
    return ok(created, 201);
  }

  if (path === '/api/leave-balances' && req.method === 'GET') {
    return page(clone(db.balances));
  }

  const decisionMatch = /^\/api\/leave\/(\d+)\/(approve|reject)$/.exec(path);
  if (decisionMatch && req.method === 'POST') {
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      return forbidden(req.url, 'Only managers may decide leave requests.');
    }
    const id = Number(decisionMatch[1]);
    const index = db.leave.findIndex((request) => request.id === id);
    if (index === -1) {
      return notFound(req.url);
    }

    const approved = decisionMatch[2] === 'approve';
    const request = db.leave[index];
    db.leave[index] = {
      ...request,
      status: approved ? 'APPROVED' : 'REJECTED',
      decidedBy: (req.body as { decidedBy?: string })?.decidedBy ?? 'Manager',
    };

    // Approving consumes the allowance, the way a real system would.
    if (approved) {
      const balance = db.balances.find((entry) => entry.employeeId === request.employeeId);
      if (balance) {
        if (request.type === 'Annual') balance.annual = Math.max(0, balance.annual - request.days);
        if (request.type === 'Sick') balance.sick = Math.max(0, balance.sick - request.days);
        if (request.type === 'Casual') balance.casual = Math.max(0, balance.casual - request.days);
      }
    }

    return ok({ ...db.leave[index] });
  }

  return null;
}

function handleDocuments(
  req: HttpRequest<unknown>,
  path: string,
): Observable<HttpResponse<unknown>> | null {
  if (path === '/api/documents' && req.method === 'GET') {
    const employeeId = req.params.get('employeeId');
    return page(db.documents.filter((doc) => !employeeId || doc.employeeId === Number(employeeId)));
  }

  if (path === '/api/documents' && req.method === 'POST') {
    const created: EmployeeDocument = {
      ...(req.body as Omit<EmployeeDocument, 'id' | 'uploadedOn'>),
      id: nextId(db.documents),
      uploadedOn: new Date().toISOString().slice(0, 10),
    };
    db.documents = [created, ...db.documents];
    return ok(created, 201);
  }

  const idMatch = /^\/api\/documents\/(\d+)$/.exec(path);
  if (idMatch && req.method === 'DELETE') {
    db.documents = db.documents.filter((doc) => doc.id !== Number(idMatch[1]));
    return noContent();
  }

  return null;
}

function handleNotifications(
  req: HttpRequest<unknown>,
  path: string,
): Observable<HttpResponse<unknown>> | null {
  if (path === '/api/notifications' && req.method === 'GET') {
    return page(clone(db.notifications));
  }

  const readMatch = /^\/api\/notifications\/(\d+)\/read$/.exec(path);
  if (readMatch && req.method === 'POST') {
    const id = Number(readMatch[1]);
    db.notifications = db.notifications.map((item) =>
      item.id === id ? { ...item, read: true } : item,
    );
    return ok(db.notifications.find((item) => item.id === id) ?? null);
  }

  if (path === '/api/notifications/read-all' && req.method === 'POST') {
    db.notifications = db.notifications.map((item) => ({ ...item, read: true }));
    return page(clone(db.notifications));
  }

  return null;
}

function handleAnnouncements(
  req: HttpRequest<unknown>,
  path: string,
  role: string,
): Observable<HttpResponse<unknown>> | null {
  if (path === '/api/announcements' && req.method === 'GET') {
    return page(clone(db.announcements));
  }

  if (path === '/api/announcements' && req.method === 'POST') {
    const created: Announcement = {
      ...(req.body as AnnouncementDraft),
      id: nextId(db.announcements),
      postedAt: new Date().toISOString(),
    };
    db.announcements = [created, ...db.announcements];
    return ok(created, 201);
  }

  const idMatch = /^\/api\/announcements\/(\d+)$/.exec(path);
  if (idMatch && req.method === 'DELETE') {
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      return forbidden(req.url, 'Only managers may remove announcements.');
    }
    db.announcements = db.announcements.filter((item) => item.id !== Number(idMatch[1]));
    return noContent();
  }

  return null;
}

// -------------------------------------------------------------------- router

const HANDLERS = [
  handleEmployees,
  handleDepartments,
  handleLeave,
  handleAnnouncements,
  (req: HttpRequest<unknown>, path: string) => handleAttendance(req, path),
  (req: HttpRequest<unknown>, path: string) => handleDocuments(req, path),
  (req: HttpRequest<unknown>, path: string) => handleNotifications(req, path),
];

function route(req: HttpRequest<unknown>): Observable<HttpResponse<unknown>> {
  const path = new URL(req.url, 'http://localhost').pathname;
  const role = req.headers.get('X-Portal-Role') ?? 'GUEST';

  // Deliberate failure endpoint used by the system-health page.
  if (path === '/api/boom') {
    return fail(500, 'Simulated backend failure.', req.url);
  }

  for (const handler of HANDLERS) {
    const response = handler(req, path, role);
    if (response) {
      return response;
    }
  }
  return notFound(req.url);
}

export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) {
    return next(req);
  }
  // `mergeMap` defers the handler so latency applies to the work itself.
  return of(null).pipe(
    mergeMap(() => route(req)),
    delay(LATENCY_MS),
  );
};
