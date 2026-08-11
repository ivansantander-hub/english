import { randomBytes } from "node:crypto";

import type { AccountRole } from "@english-a1/db";
import { prisma } from "@english-a1/db";

import {
  isAccountLocked,
  isPinFormatValid,
  isSessionExpired,
  LOCKOUT_DURATION_MS,
  shouldLockAccount,
  shouldRefreshSession,
  SESSION_DURATION_MS,
} from "./auth-rules.js";
import {
  AccountLockedError,
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  InvalidPinFormatError,
} from "./errors.js";
import { comparePin, hashPin } from "./pin-hash.js";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: AccountRole;
}

export interface AuthResult {
  token: string;
  user: AuthenticatedUser;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class AuthService {
  async register(email: string, pin: string): Promise<AuthResult> {
    if (!isPinFormatValid(pin)) throw new InvalidPinFormatError();
    const normalizedEmail = normalizeEmail(email);

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) throw new EmailAlreadyRegisteredError();

    const pinHash = await hashPin(pin);
    const user = await prisma.user.create({
      data: { email: normalizedEmail, pinHash, role: "user" },
    });

    const token = await this.createSession(user.id);
    return { token, user: { id: user.id, email: user.email, role: user.role } };
  }

  async login(email: string, pin: string): Promise<AuthResult> {
    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) throw new InvalidCredentialsError();

    if (isAccountLocked(user.lockedUntil)) {
      throw new AccountLockedError(user.lockedUntil as Date);
    }

    const pinMatches = await comparePin(pin, user.pinHash);
    if (!pinMatches) {
      const failedAttempts = user.failedLoginAttempts + 1;
      const lock = shouldLockAccount(failedAttempts);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: lock ? 0 : failedAttempts,
          ...(lock ? { lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS) } : {}),
        },
      });
      throw new InvalidCredentialsError();
    }

    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    const token = await this.createSession(user.id);
    return { token, user: { id: user.id, email: user.email, role: user.role } };
  }

  async logout(token: string): Promise<void> {
    await prisma.session.deleteMany({ where: { token } });
  }

  async changePin(userId: string, currentPin: string, newPin: string): Promise<void> {
    if (!isPinFormatValid(newPin)) throw new InvalidPinFormatError();

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const pinMatches = await comparePin(currentPin, user.pinHash);
    if (!pinMatches) throw new InvalidCredentialsError();

    const pinHash = await hashPin(newPin);
    await prisma.user.update({ where: { id: userId }, data: { pinHash } });
  }

  /**
   * Validates a bearer token and returns the user it belongs to, sliding
   * the session's expiry forward if it's getting close (so an active user
   * effectively never has to log in again). Returns null for a missing,
   * expired, or otherwise invalid token — never throws.
   */
  async resolveSession(token: string): Promise<AuthenticatedUser | null> {
    const session = await prisma.session.findUnique({ where: { token }, include: { user: true } });
    if (!session) return null;

    if (isSessionExpired(session.expiresAt)) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
      return null;
    }

    if (shouldRefreshSession(session.expiresAt)) {
      await prisma.session.update({
        where: { id: session.id },
        data: { expiresAt: new Date(Date.now() + SESSION_DURATION_MS) },
      });
    }

    return { id: session.user.id, email: session.user.email, role: session.user.role };
  }

  private async createSession(userId: string): Promise<string> {
    const token = randomBytes(32).toString("hex");
    await prisma.session.create({
      data: { token, userId, expiresAt: new Date(Date.now() + SESSION_DURATION_MS) },
    });
    return token;
  }
}
