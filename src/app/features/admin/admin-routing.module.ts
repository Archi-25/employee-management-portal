import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { roleGuard } from '@core/guards/role.guard';
import { AdminShell } from './pages/admin-shell';
import { AdminOverview } from './pages/admin-overview';
import { AdminAnnouncements } from './pages/admin-announcements';
import { AdminAudit } from './pages/admin-audit';
import { AdminSettings } from './pages/admin-settings';
import { AdminSystem } from './pages/admin-system';

const routes: Routes = [
  {
    path: '',
    component: AdminShell,
    canActivateChild: [roleGuard('MANAGER', 'ADMIN')],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: AdminOverview, title: 'Admin · Overview' },
      { path: 'announcements', component: AdminAnnouncements, title: 'Admin · Announcements' },
      { path: 'system', component: AdminSystem, title: 'Admin · System health' },
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
