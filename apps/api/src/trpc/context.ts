import type { AccountRole } from "@english-a1/db";
import { prisma } from "@english-a1/db";
import type * as trpcExpress from "@trpc/server/adapters/express";

import { AuthService } from "../modules/auth/auth-service.js";

const authService = new AuthService();

export interface Context {
  prisma: typeof prisma;
  userId: string | null;
  userRole: AccountRole | null;
  /** The raw bearer token, so `logout` can revoke exactly this session. */
  token: string | null;
}

export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

export async function createContext({
  req,
}: trpcExpress.CreateExpressContextOptions): Promise<Context> {
  const token = extractBearerToken(req.headers.authorization);
  const user = token ? await authService.resolveSession(token) : null;

  return {
    prisma,
    userId: user?.id ?? null,
    userRole: user?.role ?? null,
    token,
  };
}
