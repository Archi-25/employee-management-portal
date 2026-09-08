export interface Page<T> {
  items: T[];
  total: number;
}

export interface ApiError {
  status: number;
  message: string;
  url: string;
  timestamp: number;
}

export interface HttpTiming {
  id: number;
  method: string;
  url: string;
  durationMs: number;
  status: number | 'CACHE' | 'ERROR';
  at: number;
}
