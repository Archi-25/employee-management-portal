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
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { Employee, fullName } from '@core/models/employee.model';
import { TooltipDirective } from '@shared/directives/tooltip.directive';
import { RoleBadgeDirective } from '@shared/directives/role-badge.directive';
import { InitialsPipe } from '@shared/pipes/initials.pipe';
import { TenurePipe } from '@shared/pipes/tenure.pipe';

export interface ProfileNote {
  employeeId: number;
  text: string;
  at: number;
}

/**
 * An employee's record card: identity, key facts, skills, biography and the
 * private notes a manager keeps against them.
 *
 * Reused on the employee detail page and anywhere else a full record is shown.
 * The host supplies its own banner, actions and footer through the projection
 * slots, so the same component serves different surrounding pages.
 */
@Component({
  selector: 'app-employee-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DatePipe,
    InitialsPipe,
    TenurePipe,
    TooltipDirective,
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

  // --------------------------------------------------------------- queries --
  /** Decorator query for a DOM element. */
  @ViewChild('noteBox') noteBoxRef?: ElementRef<HTMLTextAreaElement>;
  /** Decorator query returning a live `QueryList`. */
  @ViewChildren('skillChip') skillChips?: QueryList<ElementRef<HTMLElement>>;

  /** Signal queries — no lifecycle hook needed, and they are typed non-nullable. */
  readonly headerRef = viewChild<ElementRef<HTMLElement>>('profileHeader');
  readonly skillChipSignals = viewChildren<ElementRef<HTMLElement>>('skillChip');

  protected readonly notes = signal<ProfileNote[]>([]);

  protected get displayName(): string {
    return fullName(this.employee);
  }

  protected get statusHint(): string {
    const hints: Record<Employee['status'], string> = {
      ACTIVE: 'Currently working',
      ON_LEAVE: 'On approved leave',
      PROBATION: 'Within probation period',
      EXITED: 'No longer with the company',
    };
    return hints[this.employee.status];
  }

  ngAfterViewInit(): void {
    // @ViewChild results are only guaranteed from this hook onwards.
    this.noteBoxRef?.nativeElement.setAttribute('data-ready', 'true');
  }

  /**
   * Roving-tabindex keyboard navigation across the skill chips. This is what the
   * `@ViewChildren` QueryList is for: the handler needs the live list of chip
   * elements to decide which one to focus next.
   */
  protected onSkillKeydown(event: KeyboardEvent): void {
    const chips = this.skillChips?.map((ref) => ref.nativeElement) ?? [];
    if (chips.length === 0) {
      return;
    }

    const current = chips.indexOf(document.activeElement as HTMLElement);
    let next: number;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = (current + 1) % chips.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = (current - 1 + chips.length) % chips.length;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = chips.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    chips[next]?.focus();
  }

  /** Clears the notes list and returns focus to the input via @ViewChild. */
  protected clearNotes(): void {
    this.notes.set([]);
    this.noteBoxRef?.nativeElement.focus();
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
    noteBox.focus();
  }
}
