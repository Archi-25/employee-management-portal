import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

/**
 * Default vs OnPush, demonstrated by behaviour rather than by prose.
 *
 * The application itself is OnPush everywhere — that is the correct setting and
 * it is enforced by lint, so there is no Default-strategy component left to
 * point at. These two throwaway components exist purely to prove the difference
 * the assessment asks about, and to pin down the failure mode that makes OnPush
 * worth understanding.
 */
interface Row {
  salary: number;
}

@Component({
  selector: 'app-cd-default',
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection -- the subject of this spec
  changeDetection: ChangeDetectionStrategy.Default,
  template: `<span id="value">{{ row.salary }}</span>`,
})
class DefaultPanel {
  @Input({ required: true }) row!: Row;
}

@Component({
  selector: 'app-cd-onpush',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span id="value">{{ row.salary }}</span>`,
})
class OnPushPanel {
  @Input({ required: true }) row!: Row;
}

@Component({
  imports: [DefaultPanel, OnPushPanel],
  template: `
    <app-cd-default [row]="row()" />
    <app-cd-onpush [row]="row()" />
    <button type="button" (click)="tick()">tick</button>
  `,
})
class Host {
  readonly row = signal<Row>({ salary: 100 });
  readonly ticks = signal(0);

  /** Something unrelated changing, to force a change-detection pass. */
  tick(): void {
    this.ticks.update((value) => value + 1);
  }

  /** Same object, new field value — the reference never changes. */
  mutateInPlace(): void {
    this.row().salary += 50;
  }

  /** New object — the reference changes. */
  replaceReference(): void {
    this.row.set({ salary: this.row().salary + 50 });
  }
}

describe('Default vs OnPush change detection', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const read = (selector: string) =>
      element.querySelector(`${selector} #value`)?.textContent?.trim();
    return { fixture, element, read };
  }

  it('both render the initial value', async () => {
    const { read } = await setup();

    expect(read('app-cd-default')).toBe('100');
    expect(read('app-cd-onpush')).toBe('100');
  });

  it('OnPush misses an in-place mutation that Default picks up', async () => {
    const { fixture, element, read } = await setup();

    fixture.componentInstance.mutateInPlace();
    // An unrelated event drives a change-detection pass.
    (element.querySelector('button') as HTMLElement).click();
    await fixture.whenStable();

    // Default re-reads the object on every pass, so it shows the new number.
    expect(read('app-cd-default')).toBe('150');
    // OnPush was never marked dirty — its input reference did not change.
    expect(read('app-cd-onpush')).toBe('100');
  });

  it('both update when the reference is replaced', async () => {
    const { fixture, read } = await setup();

    fixture.componentInstance.replaceReference();
    await fixture.whenStable();

    expect(read('app-cd-default')).toBe('150');
    expect(read('app-cd-onpush')).toBe('150');
  });

  it('is why the store replaces records instead of mutating them', async () => {
    const { fixture, read } = await setup();

    // Two immutable updates in a row, the pattern EmployeeStore.update() uses.
    fixture.componentInstance.replaceReference();
    await fixture.whenStable();
    fixture.componentInstance.replaceReference();
    await fixture.whenStable();

    expect(read('app-cd-onpush')).toBe('200');
  });
});
