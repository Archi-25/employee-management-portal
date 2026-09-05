import { Injectable, inject } from '@angular/core';
import { LOG_SINK, LogLevel, Logger } from '@core/tokens/logger.token';

const MAX_ENTRIES = 50;

/** Root implementation of {@link Logger}: writes to the console and the shared sink. */
@Injectable({ providedIn: 'root' })
export class ConsoleLogger extends Logger {
  private readonly sink = inject(LOG_SINK);
  readonly scope: string = 'root';

  log(level: LogLevel, message: string): void {
    this.write(this.scope, level, message);
  }

  protected write(scope: string, level: LogLevel, message: string): void {
    this.sink.unshift({ level, scope, message, at: Date.now() });
    if (this.sink.length > MAX_ENTRIES) {
      this.sink.length = MAX_ENTRIES;
    }
  }
}

/**
 * MODULE 5 — provided by a *component* with `useFactory`, so that component and
 * its children resolve `Logger` to this prefixed instance while the rest of the
 * application keeps the root `ConsoleLogger`.
 */
export class ScopedLogger extends ConsoleLogger {
  constructor(override readonly scope: string) {
    super();
  }

  override log(level: LogLevel, message: string): void {
    this.write(this.scope, level, message);
  }
}

/** Factory helper used by `useFactory` providers. */
export function scopedLoggerFactory(scope: string): () => Logger {
  return () => new ScopedLogger(scope);
}
