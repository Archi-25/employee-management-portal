/** Roles recognised by the portal, ordered from least to most privileged. */
export type Role = 'GUEST' | 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

export const ROLES: readonly Role[] = ['GUEST', 'EMPLOYEE', 'MANAGER', 'ADMIN'] as const;

export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'PROBATION' | 'EXITED';

export const EMPLOYEE_STATUSES: readonly EmployeeStatus[] = [
  'ACTIVE',
  'ON_LEAVE',
  'PROBATION',
  'EXITED',
] as const;

export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Intern';

export const EMPLOYMENT_TYPES: readonly EmploymentType[] = [
  'Full-time',
  'Part-time',
  'Contract',
  'Intern',
] as const;

export type Gender = 'Female' | 'Male' | 'Non-binary' | 'Prefer not to say';

export const GENDERS: readonly Gender[] = [
  'Female',
  'Male',
  'Non-binary',
  'Prefer not to say',
] as const;

export type Department =
  'Engineering' | 'Design' | 'Finance' | 'People Ops' | 'Sales' | 'Support' | 'Marketing';

export const DEPARTMENTS: readonly Department[] = [
  'Engineering',
  'Design',
  'Finance',
  'People Ops',
  'Sales',
  'Support',
  'Marketing',
] as const;

export interface Address {
  line1: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Employee {
  readonly id: number;
  /** Human-facing identifier shown in the UI, e.g. `EMP001`. */
  code: string;

  // --- personal ---
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** ISO-8601 date. */
  dateOfBirth: string;
  gender: Gender;

  // --- professional ---
  title: string;
  department: Department;
  employmentType: EmploymentType;
  /** ISO-8601 date. */
  joinedOn: string;
  managerId: number | null;
  salary: number;
  status: EmployeeStatus;
  role: Role;
  location: string;
  skills: string[];

  // --- other ---
  address: Address;
  /** Rich text written by People Ops; sanitised before render. */
  bioHtml: string;
  avatarColor: string;
}

export type EmployeeDraft = Omit<Employee, 'id'>;

export interface EmployeeFilter {
  search: string;
  department: Department | 'ALL';
  status: EmployeeStatus | 'ALL';
  employmentType: EmploymentType | 'ALL';
  designation: string | 'ALL';
}

export const EMPTY_FILTER: EmployeeFilter = {
  search: '',
  department: 'ALL',
  status: 'ALL',
  employmentType: 'ALL',
  designation: 'ALL',
};

export function fullName(employee: Pick<Employee, 'firstName' | 'lastName'>): string {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

/** Next free code in the `EMP###` sequence. */
export function nextEmployeeCode(existing: readonly Employee[]): string {
  const highest = existing.reduce((max, employee) => {
    const parsed = Number.parseInt(employee.code.replace(/\D/g, ''), 10);
    return Number.isNaN(parsed) ? max : Math.max(max, parsed);
  }, 0);
  return `EMP${String(highest + 1).padStart(3, '0')}`;
}

/** Day-of-year comparison so birthdays can be found without the year. */
export function birthdayWithinDays(dateOfBirth: string, days: number, now = new Date()): boolean {
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    return false;
  }
  const next = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
  if (next < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    next.setFullYear(now.getFullYear() + 1);
  }
  const diff = (next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= -0.5 && diff <= days;
}
