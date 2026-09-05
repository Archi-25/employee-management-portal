/** Roles recognised by the portal, ordered from least to most privileged. */
export type Role = 'GUEST' | 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

export const ROLES: readonly Role[] = ['GUEST', 'EMPLOYEE', 'MANAGER', 'ADMIN'] as const;

export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'PROBATION' | 'EXITED';

export type Department =
  | 'Engineering'
  | 'Design'
  | 'Finance'
  | 'People Ops'
  | 'Sales'
  | 'Support';

export interface Employee {
  readonly id: number;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  department: Department;
  role: Role;
  status: EmployeeStatus;
  salary: number;
  /** ISO-8601 date, e.g. `2021-04-19`. */
  joinedOn: string;
  location: string;
  skills: string[];
  /** Rich HTML biography — deliberately untrusted, see the Security module. */
  bioHtml: string;
  avatarColor: string;
}

export type EmployeeDraft = Omit<Employee, 'id'>;

export interface EmployeeFilter {
  search: string;
  department: Department | 'ALL';
  status: EmployeeStatus | 'ALL';
}

export const EMPTY_FILTER: EmployeeFilter = {
  search: '',
  department: 'ALL',
  status: 'ALL',
};

export function fullName(employee: Pick<Employee, 'firstName' | 'lastName'>): string {
  return `${employee.firstName} ${employee.lastName}`.trim();
}
