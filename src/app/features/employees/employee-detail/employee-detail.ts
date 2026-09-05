import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { Employee, fullName } from '@core/models/employee.model';
import { AuthService } from '@core/services/auth.service';
import { EmployeeStore } from '@core/state/employee.store';
import { Card } from '@shared/components/card/card';
import { BadgeWidget } from '@shared/components/badge-widget/badge-widget';
import { PrintRecord } from '@shared/components/print-record/print-record';
import { ConfirmDialog } from '@shared/components/confirm-dialog/confirm-dialog';
import { DialogCloseDirective } from '@shared/directives/dialog-close.directive';
import { HasRoleDirective } from '@shared/directives/has-role.directive';
import { EmployeeProfile, ProfileNote } from '../employee-profile/employee-profile';

type Tab = 'overview' | 'badge' | 'print';

/**
 * A single employee's record. Reached from the directory or by deep link; the
 * record itself is resolved before activation, so there is no loading state.
 */
@Component({
  selector: 'app-employee-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Card,
    BadgeWidget,
    PrintRecord,
    ConfirmDialog,
    DialogCloseDirective,
    HasRoleDirective,
    EmployeeProfile,
  ],
  templateUrl: './employee-detail.html',
  styleUrl: './employee-detail.css',
})
export class EmployeeDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(EmployeeStore);
  protected readonly auth = inject(AuthService);

  protected readonly employee = toSignal(
    this.route.data.pipe(map((data) => data['employee'] as Employee)),
    { requireSync: true },
  );

  protected readonly tab = signal<Tab>('overview');
  protected readonly confirmingDelete = signal(false);
  protected readonly savedNotes = signal<ProfileNote[]>([]);

  protected readonly displayName = computed(() => fullName(this.employee()));
  protected readonly teammates = computed(() =>
    this.store
      .employees()
      .filter(
        (colleague) =>
          colleague.department === this.employee().department &&
          colleague.id !== this.employee().id,
      )
      .slice(0, 5),
  );

  protected edit(): void {
    void this.router.navigate(['/employees', this.employee().id, 'edit']);
  }

  protected async remove(): Promise<void> {
    this.confirmingDelete.set(false);
    await this.store.remove(this.employee().id);
    void this.router.navigate(['/employees']);
  }

  protected onNoteAdded(note: ProfileNote): void {
    this.savedNotes.update((notes) => [note, ...notes]);
  }

  protected print(): void {
    this.tab.set('print');
    // Let the print view render before handing off to the browser.
    setTimeout(() => globalThis.print?.(), 0);
  }
}
