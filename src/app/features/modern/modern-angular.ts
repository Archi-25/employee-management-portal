import { isPlatformServer } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { Employee } from '@core/models/employee.model';
import { EmployeeStore } from '@core/state/employee.store';
import { Card } from '@shared/components/card/card';
import { StatTile } from '@shared/components/stat-tile/stat-tile';

/**
 * MODULE 9 — the modern Angular surface: signals, standalone, i18n, SSR and
 * state management, each demonstrated rather than described.
 */
@Component({
  selector: 'app-modern-angular',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, StatTile],
  templateUrl: './modern-angular.html',
  styleUrl: './modern-angular.css',
})
export class ModernAngular {
  protected readonly store = inject(EmployeeStore);
  private readonly platformId = inject(PLATFORM_ID);

  // --- signal ---------------------------------------------------------------
  protected readonly raise = signal(5);

  // --- computed: derived, memoised, recalculated lazily ----------------------
  protected readonly projectedPayroll = computed(() =>
    Math.round(this.store.payrollTotal() * (1 + this.raise() / 100)),
  );
  protected readonly payrollDelta = computed(
    () => this.projectedPayroll() - this.store.payrollTotal(),
  );

  /**
   * `linkedSignal` — writable, but resets itself whenever its source changes.
   * Here the highlighted employee follows the roster, yet the user can still
   * pick a different one until the roster reloads.
   */
  protected readonly highlighted = linkedSignal<Employee[], Employee | null>({
    source: () => this.store.employees(),
    computation: (employees, previous) => {
      const stillPresent = employees.some((e) => e.id === previous?.value?.id);
      return stillPresent ? (previous?.value ?? null) : (employees[0] ?? null);
    },
  });

  // --- effect: a side effect that re-runs when its dependencies change --------
  protected readonly effectLog = signal<string[]>([]);

  protected readonly platform = isPlatformServer(this.platformId) ? 'server' : 'browser';
  protected readonly renderedOn = signal(this.platform);

  constructor() {
    effect(() => {
      const percent = this.raise();
      const projected = this.projectedPayroll();
      // Effects run outside change detection; they are for syncing with the
      // outside world (logging, analytics, DOM APIs), never for deriving state.
      this.effectLog.update((log) =>
        [`raise=${percent}% → projected ${projected.toLocaleString('en-US')}`, ...log].slice(0, 5),
      );
    });
  }

  protected setRaise(value: string): void {
    this.raise.set(Number(value));
  }

  protected pick(employee: Employee): void {
    this.highlighted.set(employee);
  }
}
