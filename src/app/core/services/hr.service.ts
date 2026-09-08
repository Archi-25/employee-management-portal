import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Page } from '@core/models/api.model';
import {
  AppNotification,
  AttendanceRecord,
  AttendanceStatus,
  DepartmentDraft,
  DepartmentRecord,
  EmployeeDocument,
  LeaveBalance,
  LeaveDraft,
  LeaveRequest,
  LeaveStatus,
} from '@core/models/hr.model';
import { APP_CONFIG } from '@core/tokens/app-config.token';

const items = <T>() => map((page: Page<T>) => page.items);

/** One thin HTTP client for the HR resources that hang off the directory. */
@Injectable({ providedIn: 'root' })
export class HrService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  private url(path: string): string {
    return `${this.config.apiBaseUrl}/${path}`;
  }

  // ------------------------------------------------------------- attendance
  attendance(filters?: {
    date?: string;
    employeeId?: number;
    status?: AttendanceStatus;
  }): Observable<AttendanceRecord[]> {
    let params = new HttpParams();
    if (filters?.date) params = params.set('date', filters.date);
    if (filters?.employeeId) params = params.set('employeeId', filters.employeeId);
    if (filters?.status) params = params.set('status', filters.status);

    return this.http
      .get<Page<AttendanceRecord>>(this.url('attendance'), { params })
      .pipe(items<AttendanceRecord>());
  }

  // ------------------------------------------------------------------ leave
  leave(filters?: { employeeId?: number; status?: LeaveStatus }): Observable<LeaveRequest[]> {
    let params = new HttpParams();
    if (filters?.employeeId) params = params.set('employeeId', filters.employeeId);
    if (filters?.status) params = params.set('status', filters.status);

    return this.http
      .get<Page<LeaveRequest>>(this.url('leave'), { params })
      .pipe(items<LeaveRequest>());
  }

  applyForLeave(draft: LeaveDraft): Observable<LeaveRequest> {
    return this.http.post<LeaveRequest>(this.url('leave'), draft);
  }

  decideLeave(id: number, approve: boolean, decidedBy: string): Observable<LeaveRequest> {
    const action = approve ? 'approve' : 'reject';
    return this.http.post<LeaveRequest>(this.url(`leave/${id}/${action}`), { decidedBy });
  }

  leaveBalances(): Observable<LeaveBalance[]> {
    return this.http
      .get<Page<LeaveBalance>>(this.url('leave-balances'))
      .pipe(items<LeaveBalance>());
  }

  // ------------------------------------------------------------ departments
  departments(): Observable<DepartmentRecord[]> {
    return this.http
      .get<Page<DepartmentRecord>>(this.url('departments'))
      .pipe(items<DepartmentRecord>());
  }

  createDepartment(draft: DepartmentDraft): Observable<DepartmentRecord> {
    return this.http.post<DepartmentRecord>(this.url('departments'), draft);
  }

  updateDepartment(id: number, draft: DepartmentDraft): Observable<DepartmentRecord> {
    return this.http.put<DepartmentRecord>(this.url(`departments/${id}`), draft);
  }

  deleteDepartment(id: number): Observable<void> {
    return this.http.delete<void>(this.url(`departments/${id}`));
  }

  // -------------------------------------------------------------- documents
  documents(employeeId?: number): Observable<EmployeeDocument[]> {
    let params = new HttpParams();
    if (employeeId) params = params.set('employeeId', employeeId);

    return this.http
      .get<Page<EmployeeDocument>>(this.url('documents'), { params })
      .pipe(items<EmployeeDocument>());
  }

  uploadDocument(doc: Omit<EmployeeDocument, 'id' | 'uploadedOn'>): Observable<EmployeeDocument> {
    return this.http.post<EmployeeDocument>(this.url('documents'), doc);
  }

  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>(this.url(`documents/${id}`));
  }

  // ---------------------------------------------------------- notifications
  notifications(): Observable<AppNotification[]> {
    return this.http
      .get<Page<AppNotification>>(this.url('notifications'))
      .pipe(items<AppNotification>());
  }

  markNotificationRead(id: number): Observable<AppNotification> {
    return this.http.post<AppNotification>(this.url(`notifications/${id}/read`), {});
  }

  markAllNotificationsRead(): Observable<AppNotification[]> {
    return this.http
      .post<Page<AppNotification>>(this.url('notifications/read-all'), {})
      .pipe(items<AppNotification>());
  }
}
