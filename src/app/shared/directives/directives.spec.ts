import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Role } from '@core/models/employee.model';
import { AuthService } from '@core/services/auth.service';
import { ConsoleLogger } from '@core/services/logger.service';
import { Logger } from '@core/tokens/logger.token';
import { HasRoleDirective } from './has-role.directive';
import { HighlightDirective } from './highlight.directive';
import { RoleBadgeDirective } from './role-badge.directive';
import { UnlessDirective } from './unless.directive';

@Component({
  imports: [HasRoleDirective],
  template: `
    <p *appHasRole="'ADMIN'; else: fallback" id="granted">admin only</p>
    <ng-template #fallback><p id="denied">denied</p></ng-template>
  `,
})
class HasRoleHost {}

@Component({
  imports: [UnlessDirective],
  template: `<p *appUnless="hidden()" id="target">visible</p>`,
})
class UnlessHost {
  readonly hidden = signal(false);
}

@Component({
  imports: [HighlightDirective],
  template: `<p [appHighlight]="'#123456'" highlightLabel="probe" id="target">hover me</p>`,
})
class HighlightHost {}

@Component({
  imports: [RoleBadgeDirective],
  template: `<span [appRoleBadge]="role()" id="host"></span>`,
})
class BadgeHost {
  readonly role = signal<Role>('MANAGER');
}

function providers() {
  return [ConsoleLogger, { provide: Logger, useExisting: ConsoleLogger }];
}

describe('HasRoleDirective', () => {
  it('stamps the template when the role clears the bar', async () => {
    TestBed.configureTestingModule({ providers: providers() });
    TestBed.inject(AuthService).login('Aarav', 'ADMIN');

    const fixture = TestBed.createComponent(HasRoleHost);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('#granted')).not.toBeNull();
    expect(element.querySelector('#denied')).toBeNull();
  });

  it('renders the else template and removes the element entirely', async () => {
    TestBed.configureTestingModule({ providers: providers() });
    TestBed.inject(AuthService).login('Daniel', 'EMPLOYEE');

    const fixture = TestBed.createComponent(HasRoleHost);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('#granted')).toBeNull();
    expect(element.querySelector('#denied')?.textContent).toBe('denied');
  });

  it('reacts to a role change without a re-render of the host', async () => {
    TestBed.configureTestingModule({ providers: providers() });
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

describe('UnlessDirective', () => {
  it('renders while the condition is false and removes it when true', async () => {
    const fixture = TestBed.createComponent(UnlessHost);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('#target')).not.toBeNull();

    fixture.componentInstance.hidden.set(true);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('#target')).toBeNull();
  });
});

describe('HighlightDirective', () => {
  it('binds tabindex and the data attribute set through Renderer2', async () => {
    const fixture = TestBed.createComponent(HighlightHost);
    await fixture.whenStable();

    const target = (fixture.nativeElement as HTMLElement).querySelector('#target');
    expect(target?.getAttribute('tabindex')).toBe('0');
    expect(target?.getAttribute('data-highlight')).toBe('probe');
  });

  it('toggles the host class and background on mouseenter/mouseleave', async () => {
    const fixture = TestBed.createComponent(HighlightHost);
    await fixture.whenStable();
    const target = (fixture.nativeElement as HTMLElement).querySelector(
      '#target',
    ) as HTMLElement;

    target.dispatchEvent(new MouseEvent('mouseenter'));
    await fixture.whenStable();
    expect(target.classList.contains('is-highlighted')).toBe(true);
    expect(target.style.backgroundColor).not.toBe('');

    target.dispatchEvent(new MouseEvent('mouseleave'));
    await fixture.whenStable();
    expect(target.classList.contains('is-highlighted')).toBe(false);
    expect(target.style.backgroundColor).toBe('');
  });
});

describe('RoleBadgeDirective', () => {
  it('builds the badge with Renderer2 and updates it when the role changes', async () => {
    const fixture = TestBed.createComponent(BadgeHost);
    await fixture.whenStable();

    const host = (fixture.nativeElement as HTMLElement).querySelector('#host') as HTMLElement;
    const badge = host.querySelector('.role-badge');
    expect(badge?.textContent).toBe('MANAGER');
    expect(badge?.getAttribute('aria-label')).toBe('Role: MANAGER');

    fixture.componentInstance.role.set('ADMIN');
    await fixture.whenStable();

    // The same node is reused — the directive never re-creates it.
    expect(host.querySelectorAll('.role-badge').length).toBe(1);
    expect(host.querySelector('.role-badge')?.textContent).toBe('ADMIN');
  });
});
