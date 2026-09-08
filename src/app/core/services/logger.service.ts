import { Injectable, inject } from '@angular/core';
import { LOG_SINK, LogLevel, Logger } from '@core/tokens/logger.token';

const MAX_ENTRIES = 50;

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

export class ScopedLogger extends ConsoleLogger {
  constructor(override readonly scope: string) {
    super();
  }

  override log(level: LogLevel, message: string): void {
    this.write(this.scope, level, message);
  }
}

export function scopedLoggerFactory(scope: string): () => Logger {
  return () => new ScopedLogger(scope);
}
