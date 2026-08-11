import { PrismaClient } from "@prisma/client";

export * from "@prisma/client";
export * from "./constants.js";

declare global {
  var __englishA1Prisma: PrismaClient | undefined;
}

/**
 * Single shared Prisma client. Cached on globalThis so repeated module
 * reloads in dev (tsx watch) don't exhaust the Postgres connection pool.
 */
export const prisma: PrismaClient = globalThis.__englishA1Prisma ?? new PrismaClient();

if (process.env["NODE_ENV"] !== "production") {
  globalThis.__englishA1Prisma = prisma;
}
