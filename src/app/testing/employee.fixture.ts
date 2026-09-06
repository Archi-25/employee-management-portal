import { Employee, EmployeeDraft } from '@core/models/employee.model';

/**
 * Test fixtures. One place to add a field when the model grows, instead of
 * every spec that happens to need an Employee.
 */
const BASE: Employee = {
  id: 42,
  code: 'EMP042',
  firstName: 'Mei',
  lastName: 'Tanaka',
  email: 'mei.tanaka@acme.io',
  phone: '+91 9812345678',
  dateOfBirth: '1994-06-30',
  gender: 'Female',
  title: 'Product Designer',
  department: 'Design',
  employmentType: 'Full-time',
  joinedOn: '2020-05-04',
  managerId: null,
  salary: 118000,
  status: 'ACTIVE',
  role: 'EMPLOYEE',
  location: 'Osaka',
  skills: ['Design systems', 'Figma', 'Accessibility'],
  address: { line1: '12 Maple Street', city: 'Osaka', state: 'Kansai', pincode: '400013' },
  bioHtml: '<p>Bio</p><img src="x" onerror="alert(1)">',
  avatarColor: '#eda100',
};

export function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return { ...BASE, ...overrides };
}

export function makeEmployeeDraft(overrides: Partial<EmployeeDraft> = {}): EmployeeDraft {
  const { id: _id, ...draft } = BASE;
  return { ...draft, ...overrides };
}
