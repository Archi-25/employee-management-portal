import { Injectable, computed, signal } from '@angular/core';
import { HttpTiming } from '@core/models/api.model';

const MAX_TIMINGS = 25;

@Injectable({ providedIn: 'root' })
export class ProfilingService {
  private nextId = 1;
  private readonly entries = signal<HttpTiming[]>([]);

  readonly timings = this.entries.asReadonly();
  readonly requestCount = computed(() => this.entries().length);
  readonly averageMs = computed(() => {
    const list = this.entries().filter((entry) => entry.status !== 'CACHE');
    if (list.length === 0) {
      return 0;
    }
    const total = list.reduce((sum, entry) => sum + entry.durationMs, 0);
    return Math.round(total / list.length);
  });
  readonly cacheHits = computed(
    () => this.entries().filter((entry) => entry.status === 'CACHE').length,
  );

  record(timing: Omit<HttpTiming, 'id' | 'at'>): void {
    this.entries.update((list) =>
      [{ ...timing, id: this.nextId++, at: Date.now() }, ...list].slice(0, MAX_TIMINGS),
    );
  }

  clear(): void {
    this.entries.set([]);
  }
}
