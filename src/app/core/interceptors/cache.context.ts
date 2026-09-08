import { HttpContextToken } from '@angular/common/http';

export const CACHE_BYPASS = new HttpContextToken<boolean>(() => false);

export const CACHE_HIT = new HttpContextToken<boolean>(() => false);
