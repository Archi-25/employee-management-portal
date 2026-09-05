/** A company-wide notice, authored in the admin area and shown on the dashboard. */
export interface Announcement {
  readonly id: number;
  title: string;
  /** Rich text. Authors may use basic markup; it is sanitised before render. */
  bodyHtml: string;
  author: string;
  /** ISO-8601 timestamp. */
  postedAt: string;
  pinned: boolean;
}

export type AnnouncementDraft = Omit<Announcement, 'id' | 'postedAt'>;
