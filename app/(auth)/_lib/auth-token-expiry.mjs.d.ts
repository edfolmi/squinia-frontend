export function getJwtExpirySeconds(token: string): number | null;
export function isJwtExpired(token: string, nowMs?: number): boolean;
export function sessionCookieMaxAgeSeconds(token: string, nowMs?: number): number;
