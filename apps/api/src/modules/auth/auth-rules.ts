export const PIN_LENGTH = 6;
const PIN_REGEX = /^\d{6}$/;

export const SESSION_DURATION_MS = 90 * 24 * 60 * 60 * 1000;
/** Sessions auto-extend (sliding expiry) once fewer than this much time remains. */
export const SESSION_REFRESH_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000;

export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

export function isPinFormatValid(pin: string): boolean {
  return PIN_REGEX.test(pin);
}

export function isAccountLocked(lockedUntil: Date | null, now: Date = new Date()): boolean {
  return lockedUntil !== null && lockedUntil.getTime() > now.getTime();
}

export function shouldLockAccount(failedAttemptsAfterThisOne: number): boolean {
  return failedAttemptsAfterThisOne >= MAX_FAILED_LOGIN_ATTEMPTS;
}

export function isSessionExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}

export function shouldRefreshSession(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() - now.getTime() < SESSION_REFRESH_THRESHOLD_MS;
}
