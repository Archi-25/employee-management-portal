import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import {
  mockBackendInterceptor,
  resetMockBackend,
} from '@core/interceptors/mock-backend.interceptor';
import { ConsoleLogger } from '@core/services/logger.service';
import { AnnouncementStore } from '@core/state/announcement.store';
import { Logger } from '@core/tokens/logger.token';
import { AnnouncementPanel } from './announcement-panel';

describe('AnnouncementPanel', () => {
  let store: InstanceType<typeof AnnouncementStore>;

  beforeEach(async () => {
    resetMockBackend();
    TestBed.configureTestingModule({
      providers: [
        ConsoleLogger,
        { provide: Logger, useExisting: ConsoleLogger },
        provideHttpClient(
          withInterceptors([authInterceptor, errorInterceptor, mockBackendInterceptor]),
        ),
      ],
    });
    store = TestBed.inject(AnnouncementStore);
    await store.load();
  });

  it('loads announcements and orders pinned ones first', () => {
    expect(store.count()).toBeGreaterThan(0);
    expect(store.ordered()[0].pinned).toBe(true);
  });

  it('renders announcement bodies with the markup authors intended', async () => {
    const fixture = TestBed.createComponent(AnnouncementPanel);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Open enrolment');
    // Legitimate formatting survives.
    expect(element.querySelector('.feed__body strong')).not.toBeNull();
  });

  it('strips the hostile payload out of a seeded announcement', async () => {
    const fixture = TestBed.createComponent(AnnouncementPanel);
    fixture.componentRef.setInput('limit', 10);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const hostile = store.ordered().find((item) => item.bodyHtml.includes('onerror'));

    // The stored record really does contain a payload...
    expect(hostile).toBeDefined();
    // ...and none of it reaches the DOM.
    expect(element.innerHTML).not.toContain('onerror');
    expect(element.querySelector('script')).toBeNull();
  });

  it('reports what sanitisation removed', () => {
    const fixture = TestBed.createComponent(AnnouncementPanel);
    const cleaned = String(
      fixture.componentInstance.sanitizeBody('<p>ok</p><script>alert(1)</script>'),
    );

    expect(cleaned).toContain('ok');
    expect(cleaned).not.toContain('script');
  });

  it('limits how many announcements are shown', async () => {
    const fixture = TestBed.createComponent(AnnouncementPanel);
    fixture.componentRef.setInput('limit', 1);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.feed__item').length).toBe(1);
  });
});
