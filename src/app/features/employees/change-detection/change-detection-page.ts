import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Employee } from '@core/models/employee.model';
import { EmployeeStore } from '@core/state/employee.store';
import { Card } from '@shared/components/card/card';
import { StatTile } from '@shared/components/stat-tile/stat-tile';
import { DefaultPanel } from './default-panel';
import { OnPushPanel } from './on-push-panel';

/**
 * MODULE 3 — side-by-side comparison plus the performance levers.
 *
 * The noise timer runs an empty interval that only dirties the application. The
 * Default panel is re-checked by every tick; the OnPush panel is not.
 */
@Component({
  selector: 'app-change-detection-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, StatTile, DefaultPanel, OnPushPanel],
  template: `
    <header class="page-head">
      <h1>Change detection: Default vs OnPush</h1>
      <p>
        Both panels render the same record. Start the noise timer and watch only the Default
        panel's check counter climb.
      </p>
    </header>

    <div class="tiles">
      <app-stat-tile label="Noise ticks" [value]="ticks()" accent="#dc2626" />
      <app-stat-tile label="Mutations (in place)" [value]="mutations()" accent="#f59e0b" />
      <app-stat-tile label="Immutable updates" [value]="replacements()" accent="#16a34a" />
      <app-stat-tile label="Rows in store" [value]="store.total()" accent="#6366f1" />
    </div>

    <app-card heading="Controls" subtitle="Drive both panels with identical traffic">
      <div class="row">
        <button type="button" class="btn" (click)="toggleNoise()">
          {{ noiseOn() ? 'Stop' : 'Start' }} noise timer
        </button>
        <button type="button" class="btn btn--ghost" (click)="mutateInPlace()">
          Mutate salary in place (breaks OnPush)
        </button>
        <button type="button" class="btn btn--ghost" (click)="replaceReference()">
          Replace reference (OnPush updates)
        </button>
        <button type="button" class="btn btn--ghost" (click)="reset()">Reset</button>
      </div>
      <p class="hint">
        In-place mutation changes the number the Default panel prints but leaves the OnPush panel
        stale, because its input reference never changed. Replacing the object fixes it.
      </p>
    </app-card>

    @if (subject(); as employee) {
      <div class="grid">
        <app-default-panel [employee]="employee" />
        <app-on-push-panel [employee]="employee" />
      </div>
    } @else {
      <p class="hint">Loading directory…</p>
    }

    <app-card heading="Performance checklist" subtitle="What actually moves the needle">
      <ul class="checklist">
        <li><strong>OnPush everywhere</strong> — prune whole subtrees from each pass.</li>
        <li><strong>Immutable updates</strong> — new references are what OnPush can see.</li>
        <li><strong>Signals</strong> — a signal read in a template marks only that view dirty.</li>
        <li><strong>&#64;for track</strong> — stable keys let Angular move DOM nodes instead of rebuilding them.</li>
        <li><strong>Pure pipes over template methods</strong> — a method re-runs on every check.</li>
        <li><strong>&#64;defer / lazy routes</strong> — never render or download what is off-screen.</li>
        <li><strong>Zoneless / <code>runOutsideAngular</code></strong> — keep high-frequency work out of change detection.</li>
      </ul>
    </app-card>
  `,
  styles: `
    .tiles {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
      margin: 1rem 0;
    }
    .checklist { margin: 0; padding-left: 1.1rem; display: grid; gap: 0.35rem; font-size: 0.9rem; }
  `,
})
export class ChangeDetectionPage implements OnDestroy {
  protected readonly store = inject(EmployeeStore);

  protected readonly ticks = signal(0);
  protected readonly mutations = signal(0);
  protected readonly replacements = signal(0);
  protected readonly noiseOn = signal(false);

  /** Local copy so the demo can mutate without corrupting the store. */
  private readonly local = signal<Employee | null>(null);
  protected readonly subject = computed(() => this.local() ?? this.store.employees()[0] ?? null);

  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    this.stopNoise();
  }

  protected toggleNoise(): void {
    if (this.noiseOn()) {
      this.stopNoise();
      return;
    }
    this.noiseOn.set(true);
    this.timer = setInterval(() => this.ticks.update((value) => value + 1), 500);
  }

  /** Mutates the existing object — the OnPush panel never sees it. */
  protected mutateInPlace(): void {
    const employee = this.subject();
    if (!employee) {
      return;
    }
    // Same object, new field value. Nothing about the input reference changed,
    // so OnPush has no way to know — it keeps rendering the stale number.
    employee.salary += 1000;
    this.mutations.update((value) => value + 1);
  }

  /** Produces a new reference — both panels update. */
  protected replaceReference(): void {
    const employee = this.subject();
    if (!employee) {
      return;
    }
    this.local.set({ ...employee, salary: employee.salary + 1000 });
    this.replacements.update((value) => value + 1);
  }

  protected reset(): void {
    this.stopNoise();
    this.local.set(null);
    this.ticks.set(0);
    this.mutations.set(0);
    this.replacements.set(0);
  }

  private stopNoise(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.noiseOn.set(false);
  }
}
