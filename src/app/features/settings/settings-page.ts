import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';
import { ThemeService, ThemePreference } from '@core/services/theme.service';
import { EmployeeStore } from '@core/state/employee.store';
import { APP_CONFIG } from '@core/tokens/app-config.token';
import { RouterLink } from '@angular/router';
import { Card } from '@shared/components/card/card';
import { HasRoleDirective } from '@shared/directives/has-role.directive';
import { InitialsPipe } from '@shared/pipes/initials.pipe';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const next = group.get('nextPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return !next || !confirm || next === confirm ? null : { mismatch: true };
}

const THEMES: readonly { value: ThemePreference; label: string; hint: string }[] = [
  { value: 'system', label: 'System', hint: 'Follow your operating system' },
  { value: 'light', label: 'Light', hint: 'Always light' },
  { value: 'dark', label: 'Dark', hint: 'Always dark' },
];

@Component({
  selector: 'app-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Card, HasRoleDirective, InitialsPipe],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.css',
})
export class SettingsPage {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  protected readonly config = inject(APP_CONFIG);
  private readonly employees = inject(EmployeeStore);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly themes = THEMES;
  protected readonly passwordSaved = signal(false);

  protected readonly me = computed(() => {
    const id = this.auth.employeeId();
    return id === null ? null : this.employees.byId(id);
  });

  protected readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      nextPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  protected showError(name: 'currentPassword' | 'nextPassword' | 'confirmPassword'): boolean {
    const control = this.passwordForm.controls[name];
    return control.invalid && control.touched;
  }

  protected changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    // Simulated: this portal has no credential store.
    this.passwordForm.reset();
    this.passwordSaved.set(true);
    this.notifications.success('Password updated.');
  }

  protected setTheme(value: ThemePreference): void {
    this.theme.set(value);
  }
}
