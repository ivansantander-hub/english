import { prisma } from "@english-a1/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { AuthService } from "./auth-service.js";
import {
  AccountLockedError,
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  InvalidPinFormatError,
} from "./errors.js";

/**
 * Exercises registration, login (including lockout), session resolution,
 * and PIN changes against a real Postgres instance (no mocks).
 */
describe("AuthService (integration)", () => {
  const authService = new AuthService();
  const testEmail = "auth-integration-test-user@english-a1.local";

  async function cleanup(): Promise<void> {
    await prisma.session.deleteMany({ where: { user: { email: testEmail } } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
  }

  beforeEach(cleanup);
  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it("registers a new account with role=user and an active session", async () => {
    const result = await authService.register(testEmail, "123456");
    expect(result.user.role).toBe("user");
    expect(result.token).toHaveLength(64);

    const resolved = await authService.resolveSession(result.token);
    expect(resolved?.id).toBe(result.user.id);
  });

  it("rejects registration with a malformed PIN", async () => {
    await expect(authService.register(testEmail, "12ab")).rejects.toThrow(InvalidPinFormatError);
  });

  it("rejects duplicate registration for the same email", async () => {
    await authService.register(testEmail, "123456");
    await expect(authService.register(testEmail, "654321")).rejects.toThrow(
      EmailAlreadyRegisteredError,
    );
  });

  it("normalizes email case/whitespace so login matches registration", async () => {
    await authService.register(testEmail, "123456");
    const result = await authService.login(`  ${testEmail.toUpperCase()}  `, "123456");
    expect(result.user.email).toBe(testEmail);
  });

  it("rejects login with the wrong PIN", async () => {
    await authService.register(testEmail, "123456");
    await expect(authService.login(testEmail, "000000")).rejects.toThrow(InvalidCredentialsError);
  });

  it("locks the account after 5 failed attempts and rejects further logins even with the correct PIN", async () => {
    await authService.register(testEmail, "123456");

    for (let i = 0; i < 5; i++) {
      await expect(authService.login(testEmail, "000000")).rejects.toThrow(
        InvalidCredentialsError,
      );
    }

    await expect(authService.login(testEmail, "123456")).rejects.toThrow(AccountLockedError);
  });

  it("resets failed attempts on a successful login", async () => {
    await authService.register(testEmail, "123456");
    await expect(authService.login(testEmail, "000000")).rejects.toThrow(InvalidCredentialsError);

    await authService.login(testEmail, "123456");

    const user = await prisma.user.findUniqueOrThrow({ where: { email: testEmail } });
    expect(user.failedLoginAttempts).toBe(0);
  });

  it("invalidates the session on logout", async () => {
    const { token } = await authService.register(testEmail, "123456");
    await authService.logout(token);
    expect(await authService.resolveSession(token)).toBeNull();
  });

  it("returns null for an unknown or garbage token without throwing", async () => {
    expect(await authService.resolveSession("not-a-real-token")).toBeNull();
  });

  it("changes the PIN and invalidates the old one", async () => {
    const { user } = await authService.register(testEmail, "123456");
    await authService.changePin(user.id, "123456", "654321");

    await expect(authService.login(testEmail, "123456")).rejects.toThrow(InvalidCredentialsError);
    const result = await authService.login(testEmail, "654321");
    expect(result.user.id).toBe(user.id);
  });

  it("rejects a PIN change when the current PIN is wrong", async () => {
    const { user } = await authService.register(testEmail, "123456");
    await expect(authService.changePin(user.id, "000000", "654321")).rejects.toThrow(
      InvalidCredentialsError,
    );
  });
});
