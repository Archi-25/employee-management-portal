import { Announcement } from '@core/models/announcement.model';
import {
  Address,
  Department,
  Employee,
  EmployeeStatus,
  EmploymentType,
  Gender,
  Role,
} from '@core/models/employee.model';
import {
  AppNotification,
  AttendanceRecord,
  AttendanceStatus,
  DepartmentRecord,
  EmployeeDocument,
  LeaveBalance,
  LeaveRequest,
} from '@core/models/hr.model';

type Row = [
  first: string,
  last: string,
  title: string,
  department: Department,
  employmentType: EmploymentType,
  status: EmployeeStatus,
  role: Role,
  salary: number,
  joinedOn: string,
  dateOfBirth: string,
  location: string,
  city: string,
  state: string,
  managerId: number | null,
  gender: Gender,
  skills: string,
  color: string,
];

const ROWS: readonly Row[] = [
  [
    'Aarav',
    'Mehta',
    'Principal Engineer',
    'Engineering',
    'Full-time',
    'ACTIVE',
    'ADMIN',
    189000,
    '2017-03-06',
    '1986-09-12',
    'Bengaluru',
    'Bengaluru',
    'Karnataka',
    null,
    'Male',
    'Angular|RxJS|Architecture|Nx',
    '#2a78d6',
  ],
  [
    'Riya',
    'Sharma',
    'Engineering Manager',
    'Engineering',
    'Full-time',
    'ACTIVE',
    'MANAGER',
    172000,
    '2019-08-19',
    '1989-02-24',
    'Pune',
    'Pune',
    'Maharashtra',
    1,
    'Female',
    'Delivery|Coaching|TypeScript',
    '#eb6834',
  ],
  [
    'Daniel',
    'Okafor',
    'Senior Frontend Engineer',
    'Engineering',
    'Full-time',
    'ACTIVE',
    'EMPLOYEE',
    141000,
    '2021-01-11',
    '1992-09-08',
    'Lagos',
    'Lagos',
    'Lagos',
    2,
    'Male',
    'Angular|Signals|Testing',
    '#1baf7a',
  ],
  [
    'Mei',
    'Tanaka',
    'Product Designer',
    'Design',
    'Full-time',
    'ON_LEAVE',
    'EMPLOYEE',
    118000,
    '2020-05-04',
    '1994-06-30',
    'Osaka',
    'Osaka',
    'Kansai',
    6,
    'Female',
    'Design systems|Figma|Accessibility',
    '#eda100',
  ],
  [
    'Sofia',
    'Ramirez',
    'Finance Analyst',
    'Finance',
    'Full-time',
    'ACTIVE',
    'EMPLOYEE',
    96000,
    '2022-02-14',
    '1995-11-19',
    'Madrid',
    'Madrid',
    'Madrid',
    9,
    'Female',
    'Forecasting|SQL|Excel',
    '#e87ba4',
  ],
  [
    'Noah',
    'Fischer',
    'People Partner',
    'People Ops',
    'Full-time',
    'ACTIVE',
    'MANAGER',
    104000,
    '2018-11-26',
    '1987-09-09',
    'Berlin',
    'Berlin',
    'Berlin',
    1,
    'Male',
    'Hiring|Policy|Mediation',
    '#4a3aa7',
  ],
  [
    'Ishita',
    'Rao',
    'QA Engineer',
    'Engineering',
    'Full-time',
    'PROBATION',
    'EMPLOYEE',
    88000,
    '~18',
    '1998-03-15',
    'Hyderabad',
    'Hyderabad',
    'Telangana',
    2,
    'Female',
    'Playwright|Vitest|CI',
    '#008300',
  ],
  [
    'Liam',
    'O’Connor',
    'Account Executive',
    'Sales',
    'Full-time',
    'ACTIVE',
    'EMPLOYEE',
    112000,
    '2023-09-18',
    '1993-09-07',
    'Dublin',
    'Dublin',
    'Leinster',
    12,
    'Male',
    'Enterprise sales|Negotiation',
    '#e34948',
  ],
  [
    'Amara',
    'Diallo',
    'Support Lead',
    'Support',
    'Full-time',
    'ACTIVE',
    'MANAGER',
    94000,
    '2019-04-01',
    '1990-12-02',
    'Dakar',
    'Dakar',
    'Dakar',
    1,
    'Female',
    'Escalations|Zendesk|Process',
    '#2a78d6',
  ],
  [
    'Tomas',
    'Nowak',
    'Data Engineer',
    'Engineering',
    'Full-time',
    'EXITED',
    'EMPLOYEE',
    133000,
    '2016-07-25',
    '1988-05-21',
    'Kraków',
    'Kraków',
    'Lesser Poland',
    2,
    'Male',
    'Airflow|dbt|Python',
    '#eb6834',
  ],
  [
    'Priya',
    'Nair',
    'UI Designer',
    'Design',
    'Full-time',
    'ACTIVE',
    'EMPLOYEE',
    92000,
    '~9',
    '1997-09-10',
    'Kochi',
    'Kochi',
    'Kerala',
    6,
    'Female',
    'Figma|Prototyping|Motion',
    '#1baf7a',
  ],
  [
    'Marcus',
    'Hale',
    'Sales Director',
    'Sales',
    'Full-time',
    'ACTIVE',
    'MANAGER',
    158000,
    '2018-02-12',
    '1984-07-04',
    'Chicago',
    'Chicago',
    'Illinois',
    1,
    'Male',
    'Pipeline|Forecasting|Coaching',
    '#eda100',
  ],
  [
    'Yuki',
    'Sato',
    'Marketing Specialist',
    'Marketing',
    'Part-time',
    'ACTIVE',
    'EMPLOYEE',
    71000,
    '~71',
    '1996-09-08',
    'Tokyo',
    'Tokyo',
    'Kanto',
    14,
    'Female',
    'SEO|Content|Analytics',
    '#e87ba4',
  ],
  [
    'Elena',
    'Petrova',
    'Head of Marketing',
    'Marketing',
    'Full-time',
    'ACTIVE',
    'MANAGER',
    149000,
    '2020-10-05',
    '1985-11-30',
    'Sofia',
    'Sofia',
    'Sofia',
    1,
    'Female',
    'Brand|Campaigns|PR',
    '#4a3aa7',
  ],
  [
    'Omar',
    'Haddad',
    'Support Engineer',
    'Support',
    'Contract',
    'ACTIVE',
    'EMPLOYEE',
    78000,
    '~42',
    '1999-01-16',
    'Amman',
    'Amman',
    'Amman',
    9,
    'Male',
    'Troubleshooting|SQL|Docs',
    '#008300',
  ],
  [
    'Grace',
    'Lindqvist',
    'Payroll Specialist',
    'Finance',
    'Full-time',
    'ACTIVE',
    'EMPLOYEE',
    84000,
    '2023-04-03',
    '1991-09-14',
    'Stockholm',
    'Stockholm',
    'Stockholm',
    5,
    'Female',
    'Payroll|Compliance|Excel',
    '#e34948',
  ],
];

function resolveDate(value: string): string {
  if (!value.startsWith('~')) {
    return value;
  }
  const date = new Date();
  date.setDate(date.getDate() - Number(value.slice(1)));
  return date.toISOString().slice(0, 10);
}

function makeAddress(city: string, state: string, index: number): Address {
  return {
    line1: `${10 + index * 7} Maple Street`,
    city,
    state,
    pincode: String(400001 + index * 13),
  };
}

function toEmployee(row: Row, index: number): Employee {
  const [
    firstName,
    lastName,
    title,
    department,
    employmentType,
    status,
    role,
    salary,
    joinedOn,
    dateOfBirth,
    location,
    city,
    state,
    managerId,
    gender,
    skills,
    avatarColor,
  ] = row;

  const id = index + 1;
  return {
    id,
    code: `EMP${String(id).padStart(3, '0')}`,
    firstName,
    lastName,
    email:
      `${firstName}.${lastName}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ’']/g, '') + '@acme.io',
    phone: `+91 98${String(10000000 + id * 137).slice(0, 8)}`,
    dateOfBirth,
    gender,
    title,
    department,
    employmentType,
    joinedOn: resolveDate(joinedOn),
    managerId,
    salary,
    status,
    role,
    location,
    skills: skills.split('|'),
    address: makeAddress(city, state, index),
    bioHtml:
      id === 1
        ? '<p>Owns the <strong>platform architecture</strong> guild. ' +
          '<img src="x" onerror="alert(\'XSS from bio\')"> Writes more RFCs than code.</p>'
        : `<p>${title} in ${department}, based in ${location}.</p>`,
    avatarColor,
  };
}

export const EMPLOYEE_SEED: readonly Employee[] = ROWS.map(toEmployee);

// --------------------------------------------------------------- departments

export const DEPARTMENT_SEED: readonly DepartmentRecord[] = [
  {
    id: 1,
    name: 'Engineering',
    code: 'ENG',
    headId: 2,
    description: 'Platform, product and data engineering.',
  },
  {
    id: 2,
    name: 'Design',
    code: 'DSN',
    headId: 6,
    description: 'Product design and the design system.',
  },
  {
    id: 3,
    name: 'Finance',
    code: 'FIN',
    headId: 9,
    description: 'Payroll, planning and reporting.',
  },
  {
    id: 4,
    name: 'People Ops',
    code: 'POP',
    headId: 6,
    description: 'Hiring, onboarding and employee relations.',
  },
  {
    id: 5,
    name: 'Sales',
    code: 'SLS',
    headId: 12,
    description: 'New business and account management.',
  },
  {
    id: 6,
    name: 'Support',
    code: 'SUP',
    headId: 9,
    description: 'Customer support and escalations.',
  },
  {
    id: 7,
    name: 'Marketing',
    code: 'MKT',
    headId: 14,
    description: 'Brand, campaigns and communications.',
  },
];

// ---------------------------------------------------------------- attendance

function attendanceStatusFor(employeeId: number, dayOffset: number): AttendanceStatus {
  const seed = (employeeId * 7 + dayOffset * 3) % 12;
  if (seed === 0) return 'ABSENT';
  if (seed === 1 || seed === 7) return 'LATE';
  if (seed === 4) return 'ON_LEAVE';
  return 'PRESENT';
}

function isoDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function buildAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  let id = 1;

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const date = isoDate(dayOffset);
    const weekday = new Date(date).getDay();
    if (weekday === 0 || weekday === 6) {
      continue;
    }

    for (const employee of EMPLOYEE_SEED) {
      if (employee.status === 'EXITED') {
        continue;
      }
      const status = attendanceStatusFor(employee.id, dayOffset);
      records.push({
        id: id++,
        employeeId: employee.id,
        date,
        checkIn:
          status === 'ABSENT' || status === 'ON_LEAVE'
            ? null
            : status === 'LATE'
              ? '10:12'
              : '09:18',
        checkOut: status === 'ABSENT' || status === 'ON_LEAVE' ? null : '18:05',
        status,
      });
    }
  }
  return records;
}

export const ATTENDANCE_SEED: readonly AttendanceRecord[] = buildAttendance();

// --------------------------------------------------------------------- leave

export const LEAVE_SEED: readonly LeaveRequest[] = [
  {
    id: 1,
    employeeId: 4,
    type: 'Sick',
    from: isoDate(3),
    to: isoDate(1),
    days: 3,
    reason: 'Flu, doctor advised rest.',
    status: 'APPROVED',
    appliedOn: isoDate(5),
    decidedBy: 'Noah Fischer',
  },
  {
    id: 2,
    employeeId: 3,
    type: 'Casual',
    from: isoDate(-4),
    to: isoDate(-5),
    days: 2,
    reason: 'Family function.',
    status: 'PENDING',
    appliedOn: isoDate(1),
    decidedBy: null,
  },
  {
    id: 3,
    employeeId: 8,
    type: 'Annual',
    from: isoDate(-10),
    to: isoDate(-14),
    days: 5,
    reason: 'Holiday booked in March.',
    status: 'PENDING',
    appliedOn: isoDate(2),
    decidedBy: null,
  },
  {
    id: 4,
    employeeId: 11,
    type: 'Casual',
    from: isoDate(9),
    to: isoDate(9),
    days: 1,
    reason: 'Personal errand.',
    status: 'REJECTED',
    appliedOn: isoDate(12),
    decidedBy: 'Noah Fischer',
  },
  {
    id: 5,
    employeeId: 7,
    type: 'Sick',
    from: isoDate(6),
    to: isoDate(6),
    days: 1,
    reason: 'Migraine.',
    status: 'APPROVED',
    appliedOn: isoDate(6),
    decidedBy: 'Riya Sharma',
  },
  {
    id: 6,
    employeeId: 13,
    type: 'Annual',
    from: isoDate(-20),
    to: isoDate(-24),
    days: 5,
    reason: 'Trip home.',
    status: 'PENDING',
    appliedOn: isoDate(0),
    decidedBy: null,
  },
];

export const LEAVE_BALANCE_SEED: readonly LeaveBalance[] = EMPLOYEE_SEED.map((employee) => ({
  employeeId: employee.id,
  annual: 12 - (employee.id % 4),
  sick: 5 - (employee.id % 3),
  casual: 3 + (employee.id % 2),
}));

// ----------------------------------------------------------------- documents

export const DOCUMENT_SEED: readonly EmployeeDocument[] = EMPLOYEE_SEED.slice(0, 8).flatMap(
  (employee, index) => [
    {
      id: index * 2 + 1,
      employeeId: employee.id,
      name: `${employee.code}-resume.pdf`,
      type: 'Resume' as const,
      size: 184320 + index * 2048,
      uploadedOn: employee.joinedOn,
    },
    {
      id: index * 2 + 2,
      employeeId: employee.id,
      name: `${employee.code}-offer-letter.pdf`,
      type: 'Offer Letter' as const,
      size: 96256 + index * 1024,
      uploadedOn: employee.joinedOn,
    },
  ],
);

// ------------------------------------------------------------- notifications

export const NOTIFICATION_SEED: readonly AppNotification[] = [
  {
    id: 1,
    kind: 'leave',
    message: '3 leave requests are waiting for your approval.',
    at: isoDate(0),
    read: false,
    link: '/leave',
  },
  {
    id: 2,
    kind: 'joiner',
    message: 'Omar Haddad joined the Support team.',
    at: isoDate(1),
    read: false,
    link: '/employees/15',
  },
  {
    id: 3,
    kind: 'payroll',
    message: 'Payroll for this month has been processed.',
    at: isoDate(2),
    read: false,
    link: null,
  },
  {
    id: 4,
    kind: 'birthday',
    message: '4 employees have birthdays this week.',
    at: isoDate(2),
    read: true,
    link: '/dashboard',
  },
  {
    id: 5,
    kind: 'system',
    message: 'Scheduled maintenance on Sunday 02:00–04:00 UTC.',
    at: isoDate(4),
    read: true,
    link: null,
  },
];

// ------------------------------------------------------------- announcements

export const ANNOUNCEMENT_SEED: readonly Announcement[] = [
  {
    id: 1,
    title: 'Open enrolment closes 30 September',
    bodyHtml:
      '<p>Benefits open enrolment closes at <strong>17:00 on 30 September</strong>. ' +
      'Review your elections in the People Ops portal.</p>' +
      '<p><em>Questions?</em> Ask in #people-ops.</p>',
    author: 'Noah Fischer',
    postedAt: '2026-09-01T09:00:00.000Z',
    pinned: true,
  },
  {
    id: 2,
    title: 'Engineering all-hands moved to Thursday',
    bodyHtml:
      '<p>This month’s all-hands moves to <strong>Thursday 14:00</strong>. ' +
      'The agenda covers the platform roadmap and Q4 hiring.</p>' +
      '<img src="x" onerror="alert(\'XSS in announcement\')">',
    author: 'Riya Sharma',
    postedAt: '2026-08-28T11:30:00.000Z',
    pinned: false,
  },
  {
    id: 3,
    title: 'Welcome to our new joiners',
    bodyHtml: '<p>Please welcome <strong>Ishita Rao</strong> to the QA team.</p>',
    author: 'Noah Fischer',
    postedAt: '2026-08-20T08:15:00.000Z',
    pinned: false,
  },
];
