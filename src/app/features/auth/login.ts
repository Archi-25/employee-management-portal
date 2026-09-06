import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Role } from '@core/models/employee.model';
import { AuthService } from '@core/services/auth.service';

interface DemoAccount {
  readonly email: string;
  readonly name: string;
  readonly role: Role;
  readonly blurb: string;
}

/** Sign-in shortcuts, so a reviewer can switch roles without inventing details. */
const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { email: 'admin@acme.io', name: 'Aarav Mehta', role: 'ADMIN', blurb: 'Full access, including delete and settings' },
  { email: 'manager@acme.io', name: 'Riya Sharma', role: 'MANAGER', blurb: 'Team, approvals and salaries' },
  { email: 'employee@acme.io', name: 'Daniel Okafor', role: 'EMPLOYEE', blurb: 'Own profile, attendance and leave' },
];

const MIN_PASSWORD_LENGTH = 6;

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly accounts = DEMO_ACCOUNTS;
  protected readonly showPassword = signal(false);
  protected readonly submitting = signal(false);
  protected readonly failed = signal(false);

  protected readonly redirectTo = signal(
    this.route.snapshot.queryParamMap.get('redirectTo') ?? '',
  );

  protected readonly form = this.fb.nonNullable.group({
    email: ['admin@acme.io', [Validators.required, Validators.email]],
    password: ['portal123', [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)]],
    remember: [true],
  });

  protected showError(name: 'email' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && control.touched;
  }

  protected useAccount(account: DemoAccount): void {
    this.form.patchValue({ email: account.email, password: 'portal123' });
    this.failed.set(false);
  }

  protected async submit(): Promise<void> {
    this.failed.set(false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password, remember } = this.form.getRawValue();
    const account = DEMO_ACCOUNTS.find(
      (candidate) => candidate.email.toLowerCase() === email.trim().toLowerCase(),
    );

    // Simulated auth: any known demo address with a long-enough password.
    if (!account || password.length < MIN_PASSWORD_LENGTH) {
      this.failed.set(true);
      return;
    }

    this.submitting.set(true);
    this.auth.login(account.name, account.role, remember);
    this.submitting.set(false);

    await this.router.navigateByUrl(this.redirectTo() || '/dashboard');
  }
}
