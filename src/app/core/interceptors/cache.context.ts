import { HttpContextToken } from '@angular/common/http';

/** Set on a request to force a network round trip: `{ context: bypassCache() }`. */
export const CACHE_BYPASS = new HttpContextToken<boolean>(() => false);

/** True while the response was produced by the cache rather than the network. */
export const CACHE_HIT = new HttpContextToken<boolean>(() => false);
