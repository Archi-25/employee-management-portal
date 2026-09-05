import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Page } from '@core/models/api.model';
import { Announcement, AnnouncementDraft } from '@core/models/announcement.model';
import { APP_CONFIG } from '@core/tokens/app-config.token';

@Injectable({ providedIn: 'root' })
export class AnnouncementService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  private get baseUrl(): string {
    return `${this.config.apiBaseUrl}/announcements`;
  }

  list(): Observable<Announcement[]> {
    return this.http.get<Page<Announcement>>(this.baseUrl).pipe(map((page) => page.items));
  }

  create(draft: AnnouncementDraft): Observable<Announcement> {
    return this.http.post<Announcement>(this.baseUrl, draft);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
