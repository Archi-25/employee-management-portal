export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'ON_LEAVE';

export const ATTENDANCE_STATUSES: readonly AttendanceStatus[] = [
  'PRESENT',
  'ABSENT',
  'LATE',
  'ON_LEAVE',
] as const;

export interface AttendanceRecord {
  readonly id: number;
  employeeId: number;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
}

export type LeaveType = 'Annual' | 'Sick' | 'Casual' | 'Unpaid';

export const LEAVE_TYPES: readonly LeaveType[] = ['Annual', 'Sick', 'Casual', 'Unpaid'] as const;

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveRequest {
  readonly id: number;
  employeeId: number;
  type: LeaveType;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
  decidedBy: string | null;
}

export type LeaveDraft = Omit<LeaveRequest, 'id' | 'status' | 'appliedOn' | 'decidedBy' | 'days'>;

export interface LeaveBalance {
  employeeId: number;
  annual: number;
  sick: number;
  casual: number;
}

export interface DepartmentRecord {
  readonly id: number;
  name: string;
  code: string;
  headId: number | null;
  description: string;
}

export type DepartmentDraft = Omit<DepartmentRecord, 'id'>;

export type DocumentType = 'Resume' | 'Offer Letter' | 'ID Proof' | 'Certificate' | 'Other';

export const DOCUMENT_TYPES: readonly DocumentType[] = [
  'Resume',
  'Offer Letter',
  'ID Proof',
  'Certificate',
  'Other',
] as const;

export interface EmployeeDocument {
  readonly id: number;
  employeeId: number;
  name: string;
  type: DocumentType;
  size: number;
  uploadedOn: string;
}

export type NotificationKind = 'leave' | 'joiner' | 'payroll' | 'birthday' | 'system';

export interface AppNotification {
  readonly id: number;
  kind: NotificationKind;
  message: string;
  at: string;
  read: boolean;
  link: string | null;
}

export function countLeaveDays(from: string, to: string): number {
  const start = new Date(from);
  const end = new Date(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }
  let days = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      days += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}
