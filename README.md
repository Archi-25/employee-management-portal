# Employee Management Portal

An internal HR portal for managing an organisation's people: browse and search
the directory, open an employee's record, manage team structure, publish company
announcements, and administer access and system health.

Built with Angular 22 — standalone components, zoneless change detection,
signal-based state, server-side rendering, and build-time internationalisation.

> Built for the **Angular Advanced Training – Practical Assessment**.

---

## Quick start

```bash
npm install
npm start          # http://localhost:4200
```

Sign in at `/login` — no password, just pick a role. Start as **MANAGER** to see
most of the portal, or **ADMIN** for all of it.

---

## What's in it

### Dashboard
Six KPI tiles (headcount, active, on leave, new joiners, attendance rate, pending
approvals), a headcount-by-department chart, recent joiners, a combined activity
feed, upcoming birthdays, today's attendance breakdown, and the announcement feed.

### Employees
The main working screen. Search by name, employee ID, email or job title; filter
by department, status, employment type and designation; sort any column; page
through the results. Each row has an action menu for viewing, editing or removing
a record — the options shown depend on your role, and deletes go through a
confirmation dialog.

Open a record for a tabbed profile:

| Tab | Contents |
| --- | --- |
| **Personal** | Identity, contact details, skills, private notes, address |
| **Professional** | Designation, department, employment type, reporting manager, salary |
| **Attendance** | Last ten recorded days with a present/late/absent summary |
| **Leave** | Full leave history for that employee |
| **Documents** | Resumes, offer letters and certificates — upload, download, delete |

Two extra views are available: a **shareable badge** designed to be embedded in
other internal tools, and a **printable record** for HR files.

### Add / edit employee
One reactive form in three sections — personal, professional and address — with
required, email, phone-pattern, length, minimum-age and not-in-the-future
validation. Errors appear inline on blur or on submit, focus jumps to the first
invalid field, and Save / Reset / Cancel sit in a sticky action bar. Leaving with
unsaved edits prompts first.

### Attendance
Daily check-in and check-out records with present / late / absent / on-leave
tiles and an attendance rate. Filter by date, status and employee. Employees see
only their own row; managers see everyone.

### Leave
Leave balances per type, an apply-for-leave form that counts working days as you
pick dates, and full request history. Managers get **Approve** and **Reject** on
pending rows; approving draws the days down from the right balance.

### Departments
Full CRUD for administrators — create, rename, reassign the department head, and
delete (blocked while employees are still assigned). Select a team to see its
members and payroll.

### Admin *(managers and administrators)*
- **Overview** — organisation summary
- **Announcements** — compose and publish company notices, with a live preview
- **System health** — API request volume, latency, cache effectiveness
- **Audit log** — activity recorded across the portal
- **Settings** — configuration *(administrators only)*

### Profile & settings
Your profile, a change-password form, a **theme switcher** (system / light /
dark), company information, and a role preview for checking what each role sees.

### Notifications
A bell in the header with an unread count, a dropdown of recent items, deep links
to the relevant page, and mark-one / mark-all-read.

---

## Roles

| Role | Can do |
| --- | --- |
| `GUEST` | Dashboard only |
| `EMPLOYEE` | Own profile, own attendance, apply for leave, view leave history, browse the directory and departments |
| `MANAGER` | The above, plus salaries, all attendance, approving and rejecting leave, adding and editing employees, and the admin area |
| `ADMIN` | Everything, including deleting employees, department CRUD and settings |

Roles are enforced in three places: route guards block navigation, the
`*appHasRole` directive keeps unavailable actions out of the DOM entirely, and the
API rejects a request whose role header is insufficient — so hiding a button is
never the only thing standing between a user and an action they may not take.

Sign in with any of the demo accounts shown on the login page; the password is
`portal123`. Tick **Remember me** and the session survives a reload.

---

## Commands

| Command | What it does |
| --- | --- |
| `npm start` | Dev server |
| `npm run start:fr` | Dev server in French |
| `npm run build` | Production build — browser + server bundles |
| `npm run build:i18n` | Production build emitting `en-US` **and** `fr` |
| `npm run serve:ssr` | Run the built SSR server (port 4000) |
| `npm test` | 160 unit tests with coverage |
| `npm run lint` | ESLint over TypeScript and templates |
| `npm run extract-i18n` | Re-extract translatable strings |
| `npm run sonar` | SonarQube scan |
| `npx nx graph` | Nx task graph |

> This is an **Nx workspace**: `angular.json` is replaced by `nx.json` +
> `project.json`. Use `npm run <script>` or `nx <target>` — **not** `ng <target>`.

---

## How it's built

```
src/app/
├── core/       no UI — models, DI tokens, services, interceptors, guards, state
├── shared/     reusable UI — directives, pipes, presentational components
└── features/   screens — one folder per feature, lazily routed
```

Imports may only travel **`features` → `shared` → `core`**. That rule is enforced
by ESLint, so `npm run lint` fails if a layer reaches the wrong way.

### Data flow

```
Component → SignalStore → Service → HttpClient
                                       │
   profiling → auth → cache → error → mock backend
```

Every screen reads from a signal store; stores call services; services use
`HttpClient`; requests pass through four interceptors.

### There is no external backend

`mockBackendInterceptor` sits at the **end** of the interceptor chain and answers
`/api/**` from memory. This is deliberate: the auth, caching, error and profiling
interceptors all run for real against it, exactly as they would against a live
server. Swapping in a real API means deleting one interceptor.

**Data resets on reload**, because the "database" is a module-level object.
Authentication is simulated: there is no credential check, and the session lives
in a signal. Ticking *Remember me* persists it to `localStorage` so it survives a
refresh; leaving it unticked keeps it to the tab.

---

## Security

Announcement bodies and employee biographies are author-written rich text, so they
are treated as untrusted. They are rendered through `[innerHTML]`, which runs
Angular's sanitiser: `<script>`, event-handler attributes such as `onerror`, and
`javascript:` URLs are stripped, while legitimate formatting survives.

`bypassSecurityTrust*` is not used anywhere in this application.

The seed data includes a real XSS payload in one announcement so this is provable
rather than merely claimed — see the test in
`features/announcements/announcement-panel.spec.ts`.

---

## Deployment note

`security.allowedHosts` in `project.json` lists `localhost` and `127.0.0.1`. A
real deployment must add its own domain, or the SSR server will reject every
request with a 400.
