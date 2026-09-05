import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { roleGuard } from '@core/guards/role.guard';
import { AdminShell } from './pages/admin-shell';
import { AdminOverview } from './pages/admin-overview';
import { AdminInterceptors } from './pages/admin-interceptors';
import { AdminAudit } from './pages/admin-audit';
import { AdminSettings } from './pages/admin-settings';
import { AdminTeamList } from './pages/admin-team-list';
import { AdminTeamDetail } from './pages/admin-team-detail';

/**
 * MODULE 4 — NESTED routes, three levels deep:
 *
 *   /admin                       → AdminShell   (has its own <router-outlet>)
 *     /admin/overview            → AdminOverview
 *     /admin/teams               → AdminTeamList  (has its own <router-outlet>)
 *       /admin/teams/:id         → AdminTeamDetail
 *     /admin/interceptors        → AdminInterceptors
 *     /admin/audit               → AdminAudit
 *     /admin/settings            → AdminSettings  (ADMIN only)
 *
 * `canActivateChild` runs for every child navigation, not just the first, so a
 * role downgrade mid-session is caught immediately.
 */
const routes: Routes = [
  {
    path: '',
    component: AdminShell,
    canActivateChild: [roleGuard('MANAGER', 'ADMIN')],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: AdminOverview, title: 'Admin · Overview' },
      {
        path: 'teams',
        component: AdminTeamList,
        title: 'Admin · Teams',
        children: [{ path: ':id', component: AdminTeamDetail, title: 'Admin · Team' }],
      },
      { path: 'interceptors', component: AdminInterceptors, title: 'Admin · HTTP' },
      { path: 'audit', component: AdminAudit, title: 'Admin · Audit log' },
      {
        path: 'settings',
        component: AdminSettings,
        title: 'Admin · Settings',
        canActivate: [roleGuard('ADMIN')],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
