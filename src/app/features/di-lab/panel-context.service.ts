import { Injectable, signal } from '@angular/core';

/**
 * MODULE 5 — provided by a PANEL component, never at root. A child looking it up
 * with `@Host()` finds it only while it sits inside that panel's template.
 */
@Injectable()
export class PanelContextService {
  private static instances = 0;
  readonly instanceId = ++PanelContextService.instances;

  readonly label = signal('unnamed panel');
  readonly events = signal<string[]>([]);

  record(event: string): void {
    this.events.update((list) => [`${event}`, ...list].slice(0, 5));
  }
}
