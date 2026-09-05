import {
  ChangeDetectionStrategy,
  Component,
  SecurityContext,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  DomSanitizer,
  SafeHtml,
  SafeResourceUrl,
  SafeUrl,
} from '@angular/platform-browser';
import { EmployeeStore } from '@core/state/employee.store';
import { Card } from '@shared/components/card/card';

const HOSTILE_SAMPLE =
  '<p>Signed off by <strong>People Ops</strong>.</p>' +
  '<img src="x" onerror="alert(\'XSS\')">' +
  '<script>alert("XSS")</script>' +
  '<a href="javascript:alert(1)">Click me</a>';

/** Only these hosts may be framed — an allowlist, not a pattern match. */
const TRUSTED_EMBED_HOSTS = new Set(['www.youtube-nocookie.com', 'player.vimeo.com']);

/**
 * MODULE 7 — Angular's security model, made visible.
 *
 * Angular treats every value bound into the DOM as untrusted and sanitises it
 * for the context it lands in (HTML, style, URL, resource URL). The only way
 * past that is an explicit `bypassSecurityTrust*` call, which is exactly why
 * those methods are named the way they are.
 */
@Component({
  selector: 'app-security-lab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card],
  templateUrl: './security-lab.html',
  styleUrl: './security-lab.css',
})
export class SecurityLab {
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly store = inject(EmployeeStore);

  protected readonly userInput = signal(HOSTILE_SAMPLE);
  protected readonly embedUrl = signal('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  protected readonly trustEmbed = signal(false);

  /** The employee bio from the seed data — it carries a real `onerror` payload. */
  protected readonly bioHtml = computed(() => this.store.employees()[0]?.bioHtml ?? '');

  /**
   * Bound with `[innerHTML]`. Angular runs its HTML sanitiser first: the
   * `<script>` element and the `onerror` attribute are stripped, the safe
   * markup survives. This is the DEFAULT and the right choice almost always.
   */
  protected readonly sanitized = computed<string>(() => this.userInput());

  /**
   * `sanitize()` called directly, so the cleaned string can be shown as text.
   * Useful for proving what the sanitiser removed.
   */
  protected readonly sanitizedSource = computed(
    () => this.sanitizer.sanitize(SecurityContext.HTML, this.userInput()) ?? '',
  );

  /**
   * The legitimate use of `bypassSecurityTrustHtml`: DEVELOPER-AUTHORED markup
   * that the sanitiser would otherwise strip — here an inline `style` attribute
   * and an inline SVG. The string is a compile-time constant, never user input.
   */
  protected readonly trustedHtml: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(
    '<span style="color:#15803d;font-weight:700">Verified badge</span> ' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="#15803d" aria-hidden="true">' +
      '<path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>',
  );

  /** The same markup passed through the sanitiser, for comparison. */
  protected readonly strippedByDefault = computed(
    () =>
      this.sanitizer.sanitize(
        SecurityContext.HTML,
        '<span style="color:#15803d;font-weight:700">Verified badge</span>',
      ) ?? '',
  );

  /** Resource URLs are the strictest context: nothing is sanitised, only trusted. */
  protected readonly safeEmbed = computed<SafeResourceUrl | null>(() => {
    const url = this.embedUrl();
    if (!this.trustEmbed() || !this.isAllowedEmbed(url)) {
      return null;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  protected readonly embedRejected = computed(
    () => this.trustEmbed() && !this.isAllowedEmbed(this.embedUrl()),
  );

  /** A `javascript:` href is neutralised to `unsafe:javascript:` by the URL sanitiser. */
  protected readonly linkUrl = signal('javascript:alert("XSS via href")');
  protected readonly trustedLink = computed<SafeUrl>(() =>
    this.sanitizer.bypassSecurityTrustUrl('https://angular.dev/best-practices/security'),
  );

  protected reset(): void {
    this.userInput.set(HOSTILE_SAMPLE);
  }

  protected onInput(value: string): void {
    this.userInput.set(value);
  }

  protected onEmbedInput(value: string): void {
    this.embedUrl.set(value);
  }

  /** Allowlist check performed BEFORE trusting anything. */
  private isAllowedEmbed(raw: string): boolean {
    try {
      const url = new URL(raw);
      return url.protocol === 'https:' && TRUSTED_EMBED_HOSTS.has(url.hostname);
    } catch {
      return false;
    }
  }
}
