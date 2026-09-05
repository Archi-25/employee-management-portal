import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
  computed,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { Employee, Role, fullName } from '@core/models/employee.model';
import { HighlightDirective } from '@shared/directives/highlight.directive';
import { RoleBadgeDirective } from '@shared/directives/role-badge.directive';
import { InitialsPipe } from '@shared/pipes/initials.pipe';
import { TenurePipe } from '@shared/pipes/tenure.pipe';

export interface ProfileNote {
  employeeId: number;
  text: string;
  at: number;
}

/**
 * MODULE 1 — the reference component for template interaction.
 *
 * Demonstrates, in one place:
 *  - `@Input()` / `@Output()` (decorator form) alongside `input()` / `output()`
 *    (signal form), so both APIs are visible side by side;
 *  - `@ViewChild` / `@ViewChildren` (QueryList) alongside the signal queries
 *    `viewChild()` / `viewChildren()`;
 *  - template local references (`#noteBox`, `#skillList`) passed straight into
 *    handlers without any TypeScript query at all;
 *  - `<ng-content>` projection with named slots.
 */
@Component({
  selector: 'app-employee-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DatePipe,
    InitialsPipe,
    TenurePipe,
    HighlightDirective,
    RoleBadgeDirective,
  ],
  templateUrl: './employee-profile.html',
  styleUrl: './employee-profile.css',
})
export class EmployeeProfile implements AfterViewInit {
  // ---------------------------------------------------------------- inputs --
  /** Decorator input, kept to show the classic API next to the signal one. */
  @Input({ required: true }) employee!: Employee;

  /** Signal inputs: read as functions, usable inside `computed`. */
  readonly dense = input(false);
  /**
   * `transform` lets the input accept a plain attribute (`showSalary="false"`)
   * as well as a real boolean binding, normalising both to a boolean.
   */
  readonly showSalary = input(true, {
    transform: (value: boolean | string) => (typeof value === 'string' ? value !== 'false' : value),
  });

  // --------------------------------------------------------------- outputs --
  /** Decorator output. */
  @Output() readonly edit = new EventEmitter<Employee>();
  /** Signal outputs — same wire format, less boilerplate. */
  readonly remove = output<Employee>();
  readonly noteAdded = output<ProfileNote>();
  readonly roleRequested = output<Role>();

  // --------------------------------------------------------------- queries --
  /** Decorator query for a DOM element. */
  @ViewChild('noteBox') noteBoxRef?: ElementRef<HTMLTextAreaElement>;
  /** Decorator query returning a live `QueryList`. */
  @ViewChildren('skillChip') skillChips?: QueryList<ElementRef<HTMLElement>>;

  /** Signal queries — no lifecycle hook needed, and they are typed non-nullable. */
  readonly headerRef = viewChild<ElementRef<HTMLElement>>('profileHeader');
  readonly skillChipSignals = viewChildren<ElementRef<HTMLElement>>('skillChip');

  protected readonly skillCount = computed(() => this.skillChipSignals().length);
  protected readonly notes = signal<ProfileNote[]>([]);
  protected readonly measuredHeaderWidth = signal(0);
  protected readonly lastFocusedSkill = signal<string | null>(null);

  protected get displayName(): string {
    return fullName(this.employee);
  }

  ngAfterViewInit(): void {
    // `@ViewChild` results are only guaranteed here — before this hook they are
    // undefined. Signal queries (`headerRef()`) have no such restriction.
    this.measuredHeaderWidth.set(
      Math.round(this.headerRef()?.nativeElement.getBoundingClientRect().width ?? 0),
    );
  }

  /** Called with a template local reference — no query required. */
  protected focusNote(noteBox: HTMLTextAreaElement): void {
    noteBox.focus();
    noteBox.select();
  }

  /** Uses the decorator `@ViewChild` handle instead. */
  protected clearNoteViaViewChild(): void {
    const element = this.noteBoxRef?.nativeElement;
    if (element) {
      element.value = '';
      element.focus();
    }
  }

  /** Walks the `QueryList` from `@ViewChildren`. */
  protected highlightFirstSkill(): void {
    const first = this.skillChips?.first?.nativeElement;
    if (!first) {
      return;
    }
    first.focus();
    this.lastFocusedSkill.set(first.textContent?.trim() ?? null);
  }

  protected addNote(noteBox: HTMLTextAreaElement): void {
    const text = noteBox.value.trim();
    if (!text) {
      return;
    }
    const note: ProfileNote = { employeeId: this.employee.id, text, at: Date.now() };
    this.notes.update((list) => [note, ...list]);
    this.noteAdded.emit(note);
    noteBox.value = '';
  }
}
