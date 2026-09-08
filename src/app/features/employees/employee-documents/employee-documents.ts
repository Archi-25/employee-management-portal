import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { DOCUMENT_TYPES, DocumentType, EmployeeDocument } from '@core/models/hr.model';
import { HrService } from '@core/services/hr.service';
import { NotificationService } from '@core/services/notification.service';
import { ConfirmDialog } from '@shared/components/confirm-dialog/confirm-dialog';
import { DialogCloseDirective } from '@shared/directives/dialog-close.directive';
import { HasRoleDirective } from '@shared/directives/has-role.directive';

const ICONS: Record<DocumentType, string> = {
  Resume: '📄',
  'Offer Letter': '📝',
  'ID Proof': '🪪',
  Certificate: '🎓',
  Other: '📎',
};

@Component({
  selector: 'app-employee-documents',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, ConfirmDialog, DialogCloseDirective, HasRoleDirective],
  template: `
    <div class="docs">
      <div class="docs__head">
        <p class="hint">{{ documents().length }} document(s) on file.</p>

        <label *appHasRole="['MANAGER', 'ADMIN']" class="upload">
          <input type="file" (change)="onFile($event)" hidden />
          <span class="btn btn--sm">Upload document</span>
        </label>
      </div>

      @if (documents().length) {
        <ul class="list">
          @for (doc of documents(); track doc.id) {
            <li>
              <span class="icon" aria-hidden="true">{{ icon(doc.type) }}</span>
              <span class="meta">
                <strong>{{ doc.name }}</strong>
                <small>
                  {{ doc.type }} · {{ doc.size / 1024 | number: '1.0-0' }} KB ·
                  {{ doc.uploadedOn | date: 'd MMM y' }}
                </small>
              </span>
              <span class="actions">
                <button type="button" class="link" (click)="download(doc)">Download</button>
                <button
                  *appHasRole="'ADMIN'"
                  type="button"
                  class="link link--danger"
                  (click)="deleting.set(doc)"
                >
                  Delete
                </button>
              </span>
            </li>
          }
        </ul>
      } @else {
        <p class="empty">No documents uploaded for this employee yet.</p>
      }
    </div>

    @if (deleting(); as doc) {
      <app-confirm-dialog
        heading="Delete document?"
        confirmLabel="Delete"
        (confirmed)="confirmDelete()"
        (cancelled)="deleting.set(null)"
      >
        <p>
          <strong>{{ doc.name }}</strong> will be removed from this employee's file.
        </p>
        <button
          dialog-extra-actions
          type="button"
          class="btn btn--ghost"
          appDialogClose
          (click)="deleting.set(null)"
        >
          Not now
        </button>
      </app-confirm-dialog>
    }
  `,
  styleUrl: './employee-documents.css',
})
export class EmployeeDocuments {
  readonly employeeId = input.required<number>();

  private readonly hr = inject(HrService);
  private readonly notifications = inject(NotificationService);

  protected readonly documents = signal<EmployeeDocument[]>([]);
  protected readonly deleting = signal<EmployeeDocument | null>(null);
  protected readonly types = DOCUMENT_TYPES;

  constructor() {
    queueMicrotask(() => this.load());
  }

  protected icon(type: DocumentType): string {
    return ICONS[type];
  }

  protected load(): void {
    this.hr.documents(this.employeeId()).subscribe({
      next: (documents) => this.documents.set(documents),
      error: () => this.documents.set([]),
    });
  }

  protected onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.hr
      .uploadDocument({
        employeeId: this.employeeId(),
        name: file.name,
        type: this.guessType(file.name),
        size: file.size,
      })
      .subscribe({
        next: (created) => {
          this.documents.update((list) => [created, ...list]);
          this.notifications.success(`${created.name} added to the file.`);
        },
        error: () => this.notifications.error('Could not record that document.'),
      });

    input.value = '';
  }

  protected download(doc: EmployeeDocument): void {
    this.notifications.info(`${doc.name} is a demo record — there is no file to download.`);
  }

  protected confirmDelete(): void {
    const doc = this.deleting();
    this.deleting.set(null);
    if (!doc) {
      return;
    }
    this.hr.deleteDocument(doc.id).subscribe({
      next: () => {
        this.documents.update((list) => list.filter((item) => item.id !== doc.id));
        this.notifications.success('Document deleted.');
      },
      error: () => this.notifications.error('Could not delete that document.'),
    });
  }

  private guessType(name: string): DocumentType {
    const lower = name.toLowerCase();
    if (lower.includes('resume') || lower.includes('cv')) return 'Resume';
    if (lower.includes('offer')) return 'Offer Letter';
    if (lower.includes('id') || lower.includes('passport')) return 'ID Proof';
    if (lower.includes('cert') || lower.includes('degree')) return 'Certificate';
    return 'Other';
  }
}
