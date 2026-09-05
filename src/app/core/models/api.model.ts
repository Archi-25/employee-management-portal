/** Shape returned by every mock backend collection endpoint. */
export interface Page<T> {
  items: T[];
  total: number;
}

/** Normalised error emitted by the error interceptor. */
export interface ApiError {
  status: number;
  message: string;
  url: string;
  timestamp: number;
}

/** One entry of the HTTP profiling table. */
export interface HttpTiming {
  id: number;
  method: string;
  url: string;
  durationMs: number;
  status: number | 'CACHE' | 'ERROR';
  at: number;
}
