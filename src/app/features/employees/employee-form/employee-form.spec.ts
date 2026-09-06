import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AbstractControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { EmployeeStore } from '@core/state/employee.store';
import { configureFeatureTest } from '../../../testing/test-setup';
import { EmployeeForm } from './employee-form';

/** Stubs the route so the component can be mounted in create or edit mode. */
function withRouteParam(id?: string) {
  return {
    provide: ActivatedRoute,
    useValue: {
      paramMap: of(convertToParamMap(id ? { id } : {})),
      snapshot: { paramMap: convertToParamMap(id ? { id } : {}) },
    },
  };
}

describe('EmployeeForm', () => {
  let fixture: ComponentFixture<EmployeeForm>;
  let element: HTMLElement;
  let store: InstanceType<typeof EmployeeStore>;

  async function setup(id?: string) {
    configureFeatureTest('ADMIN', [withRouteParam(id)]);
    store = TestBed.inject(EmployeeStore);
    await store.load();

    fixture = TestBed.createComponent(EmployeeForm);
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
  }

  /** The form is `protected`, so reach it through a narrow structural cast. */
  const form = (): FormGroup =>
    (fixture.componentInstance as unknown as { form: FormGroup }).form;
  const control = (name: string): AbstractControl => form().controls[name];

  const validValues = {
    firstName: 'Nina',
    lastName: 'Berg',
    email: 'nina.berg@acme.io',
    phone: '+91 9812345678',
    dateOfBirth: '1995-04-12',
    gender: 'Female',
    title: 'Site Reliability Engineer',
    department: 'Engineering',
    employmentType: 'Full-time',
    joinedOn: '2026-01-15',
    managerId: null,
    salary: 125000,
    status: 'ACTIVE',
    role: 'EMPLOYEE',
    location: 'Oslo',
    skills: 'Kubernetes, Terraform',
    line1: '4 Storgata',
    city: 'Oslo',
    state: 'Oslo',
    pincode: '0155',
  };

  describe('validation', () => {
    it('starts invalid, because required fields are empty', async () => {
      await setup();

      expect(form().invalid).toBe(true);
      expect(control('firstName').hasError('required')).toBe(true);
    });

    it('rejects a malformed email', async () => {
      await setup();

      control('email').setValue('not-an-email');
      expect(control('email').hasError('email')).toBe(true);

      control('email').setValue('nina.berg@acme.io');
      expect(control('email').valid).toBe(true);
    });

    it('rejects a phone number that is too short or has letters', async () => {
      await setup();

      control('phone').setValue('123');
      expect(control('phone').valid).toBe(false);

      control('phone').setValue('call-me');
      expect(control('phone').valid).toBe(false);

      control('phone').setValue('+91 9812345678');
      expect(control('phone').valid).toBe(true);
    });

    it('enforces a minimum name length', async () => {
      await setup();

      control('firstName').setValue('A');
      expect(control('firstName').hasError('minlength')).toBe(true);

      control('firstName').setValue('Nina');
      expect(control('firstName').valid).toBe(true);
    });

    it('rejects a date of birth under 18 years ago', async () => {
      await setup();
      const tooRecent = new Date();
      tooRecent.setFullYear(tooRecent.getFullYear() - 10);

      control('dateOfBirth').setValue(tooRecent.toISOString().slice(0, 10));
      expect(control('dateOfBirth').hasError('tooYoung')).toBe(true);

      control('dateOfBirth').setValue('1995-04-12');
      expect(control('dateOfBirth').valid).toBe(true);
    });

    it('rejects a joining date in the future', async () => {
      await setup();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      control('joinedOn').setValue(tomorrow.toISOString().slice(0, 10));
      expect(control('joinedOn').hasError('future')).toBe(true);

      control('joinedOn').setValue('2026-01-15');
      expect(control('joinedOn').valid).toBe(true);
    });

    it('rejects a non-positive salary', async () => {
      await setup();

      control('salary').setValue(0);
      expect(control('salary').hasError('min')).toBe(true);

      control('salary').setValue(90000);
      expect(control('salary').valid).toBe(true);
    });

    it('rejects a pincode that is not 4 to 8 digits', async () => {
      await setup();

      control('pincode').setValue('abc');
      expect(control('pincode').valid).toBe(false);

      control('pincode').setValue('0155');
      expect(control('pincode').valid).toBe(true);
    });

    it('accepts a fully populated form', async () => {
      await setup();

      form().patchValue(validValues);
      expect(form().valid).toBe(true);
    });
  });

  describe('submitting', () => {
    it('does not create anything while the form is invalid', async () => {
      await setup();
      const before = store.total();

      const submit = element.querySelector('button[type="submit"]') as HTMLElement;
      submit.click();
      await fixture.whenStable();

      expect(store.total()).toBe(before);
      expect(element.textContent).toContain('Some fields still need attention');
    });

    it('creates the employee once the form is valid', async () => {
      await setup();
      const before = store.total();

      form().patchValue(validValues);
      (element.querySelector('button[type="submit"]') as HTMLElement).click();
      await fixture.whenStable();

      expect(store.total()).toBe(before + 1);
      const created = store.employees()[0];
      expect(created.firstName).toBe('Nina');
      // Skills arrive as a comma string and are stored as an array.
      expect(created.skills).toEqual(['Kubernetes', 'Terraform']);
      // The address is nested, not flat.
      expect(created.address.city).toBe('Oslo');
      // The employee code is assigned by the API, never typed by the user.
      expect(created.code).toMatch(/^EMP\d{3}$/);
    });
  });

  describe('edit mode', () => {
    it('pre-fills the form from the existing record', async () => {
      await setup('3');

      expect(control('firstName').value).toBe('Daniel');
      expect(control('department').value).toBe('Engineering');
      expect(control('city').value).toBeTruthy();
    });

    it('starts pristine, so leaving immediately is not blocked', async () => {
      await setup('3');

      expect(form().dirty).toBe(false);
      expect(fixture.componentInstance.hasUnsavedChanges()).toBe(false);
    });

    it('blocks navigation once a field is edited', async () => {
      await setup('3');

      control('title').setValue('Staff Engineer');
      control('title').markAsDirty();

      expect(fixture.componentInstance.hasUnsavedChanges()).toBe(true);
    });
  });
});
