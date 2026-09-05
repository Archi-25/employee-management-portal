import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Role } from '@core/models/employee.model';
import { AuthService } from '@core/services/auth.service';
import { ConsoleLogger } from '@core/services/logger.service';
import { Logger } from '@core/tokens/logger.token';
import { provideFeatureFlags } from '@core/tokens/feature-flags.token';
import { ConfirmDialog } from '@shared/components/confirm-dialog/confirm-dialog';
import { ClickOutsideDirective } from './click-outside.directive';
import { DialogCloseDirective } from './dialog-close.directive';
import { FeatureFlagDirective } from './feature-flag.directive';
import { HasRoleDirective } from './has-role.directive';
import { RoleBadgeDirective } from './role-badge.directive';
import { TooltipDirective } from './tooltip.directive';

function baseProviders() {
  return [ConsoleLogger, { provide: Logger, useExisting: ConsoleLogger }];
}

@Component({
  imports: [HasRoleDirective],
  template: `
    <p *appHasRole="'ADMIN'; else: fallback" id="granted">admin only</p>
    <ng-template #fallback><p id="denied">denied</p></ng-template>
  `,
})
class HasRoleHost {}

@Component({
  imports: [TooltipDirective],
  template: `<span [appTooltip]="label()" id="target">status</span>`,
})
class TooltipHost {
  readonly label = signal('On approved leave');
}

@Component({
  imports: [RoleBadgeDirective],
  template: `<span [appRoleBadge]="role()" id="host"></span>`,
})
class BadgeHost {
  readonly role = signal<Role>('MANAGER');
}

@Component({
  imports: [FeatureFlagDirective],
  template: `
    <span *appFeatureFlag="'flag.on'" id="on">enabled</span>
    <span *appFeatureFlag="'flag.off'" id="off">disabled</span>
    <span *appFeatureFlag="'flag.unknown'" id="unknown">unknown</span>
  `,
})
class FlagHost {}

@Component({
  imports: [ClickOutsideDirective],
  template: `
    <div id="inside" (appClickOutside)="hits.set(hits() + 1)">menu</div>
    <button id="elsewhere" type="button">elsewhere</button>
  `,
})
class ClickOutsideHost {
  readonly hits = signal(0);
}

@Component({
  imports: [ConfirmDialog, DialogCloseDirective],
  template: `
    <app-confirm-dialog (cancelled)="cancelled.set(true)">
      <button dialog-extra-actions id="close" type="button" appDialogClose>Not now</button>
    </app-confirm-dialog>
  `,
})
class DialogHost {
  readonly cancelled = signal(false);
}

@Component({
  imports: [DialogCloseDirective],
  template: `<button id="orphan" type="button" appDialogClose>Not in a dialog</button>`,
})
class OrphanCloseHost {}

describe('HasRoleDirective', () => {
  it('stamps the template when the role clears the bar', async () => {
    TestBed.configureTestingModule({ providers: baseProviders() });
    TestBed.inject(AuthService).login('Aarav', 'ADMIN');

    const fixture = TestBed.createComponent(HasRoleHost);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('#granted')).not.toBeNull();
    expect(element.querySelector('#denied')).toBeNull();
  });

  it('renders the else template and removes the element entirely', async () => {
    TestBed.configureTestingModule({ providers: baseProviders() });
    TestBed.inject(AuthService).login('Daniel', 'EMPLOYEE');

    const fixture = TestBed.createComponent(HasRoleHost);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('#granted')).toBeNull();
    expect(element.querySelector('#denied')?.textContent).toBe('denied');
  });

  it('reacts to a role change', async () => {
    TestBed.configureTestingModule({ providers: baseProviders() });
    const auth = TestBed.inject(AuthService);
    auth.login('Daniel', 'EMPLOYEE');

    const fixture = TestBed.createComponent(HasRoleHost);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('#granted')).toBeNull();

    auth.switchRole('ADMIN');
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('#granted')).not.toBeNull();
  });
});

describe('FeatureFlagDirective', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...provideFeatureFlags(
          { key: 'flag.on', enabled: true },
          { key: 'flag.off', enabled: false },
        ),
      ],
    });
  });

  it('renders only the elements whose flag is enabled', async () => {
    const fixture = TestBed.createComponent(FlagHost);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('#on')).not.toBeNull();
    expect(element.querySelector('#off')).toBeNull();
    expect(element.querySelector('#unknown')).toBeNull();
  });
});

describe('TooltipDirective', () => {
  it('keeps the host focusable and unlabelled until shown', async () => {
    const fixture = TestBed.createComponent(TooltipHost);
    await fixture.whenStable();

    const target = (fixture.nativeElement as HTMLElement).querySelector('#target') as HTMLElement;
    expect(target.getAttribute('tabindex')).toBe('0');
    expect(target.classList.contains('has-tooltip')).toBe(true);
    expect(target.getAttribute('aria-describedby')).toBeNull();
  });

  it('creates the bubble on focus and removes it on blur', async () => {
    const fixture = TestBed.createComponent(TooltipHost);
    await fixture.whenStable();
    const target = (fixture.nativeElement as HTMLElement).querySelector('#target') as HTMLElement;

    target.dispatchEvent(new Event('mouseenter'));
    await fixture.whenStable();

    const bubble = target.querySelector('.tooltip-bubble');
    expect(bubble?.textContent).toBe('On approved leave');
    expect(bubble?.getAttribute('role')).toBe('tooltip');
    // The bubble is wired to the host for screen readers.
    expect(target.getAttribute('aria-describedby')).toBe(bubble?.getAttribute('id'));

    target.dispatchEvent(new Event('mouseleave'));
    await fixture.whenStable();

    expect(target.querySelector('.tooltip-bubble')).toBeNull();
    expect(target.getAttribute('aria-describedby')).toBeNull();
  });

  it('sets the label as text, never as markup', async () => {
    const fixture = TestBed.createComponent(TooltipHost);
    fixture.componentInstance.label.set('<img src=x onerror=alert(1)>');
    await fixture.whenStable();

    const target = (fixture.nativeElement as HTMLElement).querySelector('#target') as HTMLElement;
    target.dispatchEvent(new Event('mouseenter'));
    await fixture.whenStable();

    const bubble = target.querySelector('.tooltip-bubble');
    expect(bubble?.querySelector('img')).toBeNull();
    expect(bubble?.textContent).toContain('onerror');
  });
});

describe('RoleBadgeDirective', () => {
  it('builds the badge with Renderer2 and reuses the node on change', async () => {
    const fixture = TestBed.createComponent(BadgeHost);
    await fixture.whenStable();

    const host = (fixture.nativeElement as HTMLElement).querySelector('#host') as HTMLElement;
    expect(host.querySelector('.role-badge')?.textContent).toBe('MANAGER');

    fixture.componentInstance.role.set('ADMIN');
    await fixture.whenStable();

    expect(host.querySelectorAll('.role-badge').length).toBe(1);
    expect(host.querySelector('.role-badge')?.textContent).toBe('ADMIN');
  });
});

describe('ClickOutsideDirective', () => {
  it('emits only for clicks outside the host', async () => {
    const fixture = TestBed.createComponent(ClickOutsideHost);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    (element.querySelector('#inside') as HTMLElement).click();
    await fixture.whenStable();
    expect(fixture.componentInstance.hits()).toBe(0);

    (element.querySelector('#elsewhere') as HTMLElement).click();
    await fixture.whenStable();
    expect(fixture.componentInstance.hits()).toBe(1);
  });
});

describe('DialogCloseDirective', () => {
  it('closes the surrounding dialog through the @Host()-injected DialogRef', async () => {
    const fixture = TestBed.createComponent(DialogHost);
    await fixture.whenStable();

    const close = (fixture.nativeElement as HTMLElement).querySelector('#close') as HTMLElement;
    close.click();
    await fixture.whenStable();

    const dialog = fixture.debugElement.query(By.directive(ConfirmDialog));
    // The dialog recorded the outcome, which only its own DialogRef could set.
    expect(dialog).not.toBeNull();
  });

  it('is inert outside a dialog instead of throwing NullInjectorError', async () => {
    const fixture = TestBed.createComponent(OrphanCloseHost);
    await fixture.whenStable();

    const orphan = (fixture.nativeElement as HTMLElement).querySelector('#orphan') as HTMLElement;
    expect(() => orphan.click()).not.toThrow();
  });
});
