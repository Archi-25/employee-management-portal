export interface Announcement {
  readonly id: number;
  title: string;
  bodyHtml: string;
  author: string;
  postedAt: string;
  pinned: boolean;
}

export type AnnouncementDraft = Omit<Announcement, 'id' | 'postedAt'>;
