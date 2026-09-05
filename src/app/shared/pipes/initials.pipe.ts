import { Pipe, PipeTransform } from '@angular/core';

/** MODULE 3 — pure pipe: recomputed only when the input reference changes. */
@Pipe({ name: 'initials' })
export class InitialsPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '??';
    }
    return value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }
}
