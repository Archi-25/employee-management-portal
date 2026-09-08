import { Pipe, PipeTransform } from '@angular/core';

const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

@Pipe({ name: 'tenure' })
export class TenurePipe implements PipeTransform {
  transform(joinedOn: string | null | undefined, now: number = Date.now()): string {
    if (!joinedOn) {
      return '—';
    }
    const years = (now - new Date(joinedOn).getTime()) / MS_PER_YEAR;
    if (years < 1) {
      const months = Math.max(1, Math.round(years * 12));
      return `${months} mo`;
    }
    return `${years.toFixed(1)} yr`;
  }
}
