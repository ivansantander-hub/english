import { describe, expect, it } from "vitest";

import {
  isAccountLocked,
  isPinFormatValid,
  isSessionExpired,
  MAX_FAILED_LOGIN_ATTEMPTS,
  shouldLockAccount,
  shouldRefreshSession,
  SESSION_REFRESH_THRESHOLD_MS,
} from "./auth-rules.js";

describe("isPinFormatValid", () => {
  it("accepts exactly 6 digits", () => {
    expect(isPinFormatValid("123456")).toBe(true);
  });

  it("rejects fewer than 6 digits", () => {
    expect(isPinFormatValid("12345")).toBe(false);
  });

  it("rejects non-digit characters", () => {
    expect(isPinFormatValid("12345a")).toBe(false);
  });

  it("rejects a PIN with surrounding whitespace", () => {
    expect(isPinFormatValid(" 123456 ")).toBe(false);
  });
});

describe("isAccountLocked", () => {
  const now = new Date("2026-01-01T12:00:00Z");

  it("is not locked when lockedUntil is null", () => {
    expect(isAccountLocked(null, now)).toBe(false);
  });

  it("is locked when lockedUntil is in the future", () => {
    expect(isAccountLocked(new Date("2026-01-01T12:05:00Z"), now)).toBe(true);
  });

  it("is not locked once lockedUntil has passed", () => {
    expect(isAccountLocked(new Date("2026-01-01T11:00:00Z"), now)).toBe(false);
  });
});

describe("shouldLockAccount", () => {
  it("does not lock below the threshold", () => {
    expect(shouldLockAccount(MAX_FAILED_LOGIN_ATTEMPTS - 1)).toBe(false);
  });

  it("locks at the threshold", () => {
    expect(shouldLockAccount(MAX_FAILED_LOGIN_ATTEMPTS)).toBe(true);
  });
});

describe("isSessionExpired", () => {
  const now = new Date("2026-01-01T12:00:00Z");

  it("is expired when expiresAt is in the past", () => {
    expect(isSessionExpired(new Date("2026-01-01T11:59:59Z"), now)).toBe(true);
  });

  it("is not expired when expiresAt is in the future", () => {
    expect(isSessionExpired(new Date("2026-01-02T12:00:00Z"), now)).toBe(false);
  });
});

describe("shouldRefreshSession", () => {
  const now = new Date("2026-01-01T12:00:00Z");

  it("refreshes when less than the threshold remains", () => {
    const almostExpired = new Date(now.getTime() + SESSION_REFRESH_THRESHOLD_MS - 1000);
    expect(shouldRefreshSession(almostExpired, now)).toBe(true);
  });

  it("does not refresh when comfortably far from expiry", () => {
    const farOut = new Date(now.getTime() + SESSION_REFRESH_THRESHOLD_MS + 1000);
    expect(shouldRefreshSession(farOut, now)).toBe(false);
  });
});
