import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AdminRoutingModule } from './admin-routing.module';
import { provideFeatureFlags } from '@core/tokens/feature-flags.token';
import { Logger } from '@core/tokens/logger.token';
import { scopedLoggerFactory } from '@core/services/logger.service';
import { AdminShell } from './pages/admin-shell';
import { AdminOverview } from './pages/admin-overview';
import { AdminInterceptors } from './pages/admin-interceptors';
import { AdminAudit } from './pages/admin-audit';
import { AdminSettings } from './pages/admin-settings';
import { AdminTeamList } from './pages/admin-team-list';
import { AdminTeamDetail } from './pages/admin-team-detail';

/**
 * MODULE 4 — a genuine lazy-loaded `NgModule`.
 *
 * The root router reaches this through `loadChildren`, so nothing here is in the
 * initial bundle. The components inside are standalone, which is why they appear
 * in `imports` rather than `declarations` — that is the supported way to mix the
 * two APIs, and it means this module can be deleted later without touching them.
 *
 * MODULE 5 — the `providers` array below creates an ENVIRONMENT injector scoped
 * to this lazy module. Its `Logger` shadows the root one for every component
 * underneath, and it is destroyed with the module.
 */
@NgModule({
  imports: [
    CommonModule,
    AdminRoutingModule,
    AdminShell,
    AdminOverview,
    AdminInterceptors,
    AdminAudit,
    AdminSettings,
    AdminTeamList,
    AdminTeamDetail,
  ],
  providers: [
    { provide: Logger, useFactory: scopedLoggerFactory('admin-module') },
    ...provideFeatureFlags(
      { key: 'admin.bulk-actions', enabled: true },
      { key: 'admin.payroll-export', enabled: false },
    ),
  ],
})
export class AdminModule {}
