import { Pipe, PipeTransform } from '@angular/core';

/**
 * MODULE 3 — an IMPURE pipe deliberately used as a change-detection probe: it
 * runs on every pass through the view that hosts it, so its counter reveals how
 * often that view is checked. Never ship an impure pipe for real work.
 */
@Pipe({ name: 'renderCount', pure: false })
export class RenderCountPipe implements PipeTransform {
  private count = 0;

  transform(_trigger?: unknown): number {
    this.count += 1;
    return this.count;
  }
}
