import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, SecurityContext, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '@core/services/auth.service';
import { AnnouncementStore } from '@core/state/announcement.store';
import { Card } from '@shared/components/card/card';
import { ConfirmDialog } from '@shared/components/confirm-dialog/confirm-dialog';
import { DialogCloseDirective } from '@shared/directives/dialog-close.directive';

/**
 * Compose and manage company announcements.
 *
 * The body is rich text typed by a human, so it is untrusted by definition.
 * The live preview binds it with `[innerHTML]`, which sanitises it, and the
 * panel underneath shows exactly what the sanitiser kept — so an author can see
 * before publishing that their `<script>` or `onclick` will not survive.
 */
@Component({
  selector: 'app-admin-announcements',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule, Card, ConfirmDialog, DialogCloseDirective],
  template: `
    <div class="split">
      <app-card heading="New announcement" subtitle="Basic HTML is allowed and sanitised on render">
        <form [formGroup]="form" (ngSubmit)="publish()" class="form">
          <label class="field">
            <span>Title</span>
            <input formControlName="title" placeholder="Open enrolment closes Friday" />
            @if (form.controls.title.touched && form.controls.title.invalid) {
              <em class="error">A title is required.</em>
            }
          </label>

          <label class="field">
            <span>Body</span>
            <textarea formControlName="bodyHtml" rows="5"
                      placeholder="<p>Details go here…</p>"></textarea>
          </label>

          <label class="check">
            <input type="checkbox" formControlName="pinned" />
            <span>Pin to the top of the dashboard</span>
          </label>

          <div class="actions">
            <button type="submit" class="btn" [disabled]="store.loading()">Publish</button>
            <button type="button" class="btn btn--ghost" (click)="form.reset(defaults)">
              Reset
            </button>
          </div>
        </form>
      </app-card>

      <app-card heading="Preview" subtitle="Exactly what readers will see">
        @if (bodyValue()) {
          <div class="preview" [innerHTML]="bodyValue()"></div>

          @if (wasModified()) {
            <p class="warn">
              The sanitiser removed part of this markup — scripts, event handlers and
              <code>javascript:</code> URLs are never rendered.
            </p>
            <details>
              <summary>Show sanitised source</summary>
              <pre class="sanitised">{{ sanitised() }}</pre>
            </details>
          } @else {
            <p class="ok">All markup in this body is safe to render.</p>
          }
        } @else {
          <p class="hint">Nothing to preview yet.</p>
        }
      </app-card>
    </div>

    <app-card heading="Published" [subtitle]="store.count() + ' announcements'">
      @if (store.ordered().length) {
        <ul class="list">
          @for (item of store.ordered(); track item.id) {
            <li>
              <div class="list__text">
                <strong>{{ item.title }}</strong>
                <small>{{ item.author }} · {{ item.postedAt | date: 'medium' }}</small>
              </div>
              @if (item.pinned) {
                <span class="pin">Pinned</span>
              }
              <button type="button" class="btn btn--ghost btn--sm" (click)="pendingId.set(item.id)">
                Remove
              </button>
            </li>
          }
        </ul>
      } @else {
        <p class="hint">Nothing published yet.</p>
      }
    </app-card>

    @if (pendingId() !== null) {
      <app-confirm-dialog
        heading="Remove announcement?"
        confirmLabel="Remove"
        (confirmed)="remove()"
        (cancelled)="pendingId.set(null)"
      >
        <p>It will disappear from the dashboard immediately.</p>
        <button dialog-extra-actions type="button" class="btn btn--ghost" appDialogClose
                (click)="pendingId.set(null)">
          Not now
        </button>
      </app-confirm-dialog>
    }
  `,
  styleUrl: './admin-announcements.css',
})
export class AdminAnnouncements {
  protected readonly store = inject(AnnouncementStore);
  private readonly auth = inject(AuthService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly fb = inject(FormBuilder);

  protected readonly defaults = { title: '', bodyHtml: '', pinned: false };
  protected readonly pendingId = signal<number | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(4)]],
    bodyHtml: ['<p>Write the announcement here.</p>', Validators.required],
    pinned: [false],
  });

  /** Raw author input, tracked as a signal so the preview stays reactive. */
  protected readonly bodyValue = signal(this.form.controls.bodyHtml.value);

  protected readonly sanitised = computed(
    () => this.sanitizer.sanitize(SecurityContext.HTML, this.bodyValue()) ?? '',
  );

  /** True when sanitisation actually changed the markup. */
  protected readonly wasModified = computed(
    () => this.sanitised().replace(/\s+/g, '') !== this.bodyValue().replace(/\s+/g, ''),
  );

  constructor() {
    this.form.controls.bodyHtml.valueChanges.subscribe((value) =>
      this.bodyValue.set(value ?? ''),
    );
    void this.store.load();
  }

  protected async publish(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { title, bodyHtml, pinned } = this.form.getRawValue();
    await this.store.publish({ title, bodyHtml, pinned, author: this.auth.displayName() });
    this.form.reset(this.defaults);
    this.bodyValue.set('');
  }

  protected async remove(): Promise<void> {
    const id = this.pendingId();
    this.pendingId.set(null);
    if (id !== null) {
      await this.store.remove(id);
    }
  }
}
