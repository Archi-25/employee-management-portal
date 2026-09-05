import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AdminRoutingModule } from './admin-routing.module';
import { provideFeatureFlags } from '@core/tokens/feature-flags.token';
import { Logger } from '@core/tokens/logger.token';
import { scopedLoggerFactory } from '@core/services/logger.service';
import { AdminShell } from './pages/admin-shell';
import { AdminOverview } from './pages/admin-overview';
import { AdminAnnouncements } from './pages/admin-announcements';
import { AdminAudit } from './pages/admin-audit';
import { AdminSettings } from './pages/admin-settings';
import { AdminSystem } from './pages/admin-system';

/**
 * The administration area, loaded on demand.
 *
 * Most people never open it, so keeping it behind `loadChildren` keeps its code
 * out of the initial bundle entirely. The components inside are standalone,
 * which is why they appear in `imports` rather than `declarations`.
 *
 * The `providers` array creates an environment injector scoped to this module:
 * its `Logger` shadows the root one for everything underneath, so admin activity
 * is tagged as such in the audit log, and its feature flags are merged with the
 * application-wide ones.
 */
@NgModule({
  imports: [
    CommonModule,
    AdminRoutingModule,
    AdminShell,
    AdminOverview,
    AdminAnnouncements,
    AdminAudit,
    AdminSettings,
    AdminSystem,
  ],
  providers: [
    { provide: Logger, useFactory: scopedLoggerFactory('admin') },
    ...provideFeatureFlags(
      { key: 'admin.bulk-actions', enabled: true },
      { key: 'admin.payroll-export', enabled: false },
    ),
  ],
})
export class AdminModule {}
