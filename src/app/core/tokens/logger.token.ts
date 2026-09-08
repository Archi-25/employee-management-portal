import { InjectionToken } from '@angular/core';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  scope: string;
  message: string;
  at: number;
}

export abstract class Logger {
  abstract readonly scope: string;
  abstract log(level: LogLevel, message: string): void;

  debug(message: string): void {
    this.log('debug', message);
  }
  info(message: string): void {
    this.log('info', message);
  }
  warn(message: string): void {
    this.log('warn', message);
  }
  error(message: string): void {
    this.log('error', message);
  }
}

export const LOG_SINK = new InjectionToken<LogEntry[]>('LOG_SINK', {
  providedIn: 'root',
  factory: () => [],
});
