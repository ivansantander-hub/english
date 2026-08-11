import { prisma } from "@english-a1/db";

export interface Context {
  prisma: typeof prisma;
  userId: string;
}

export function createContextFactory(userId: string) {
  return function createContext(): Context {
    return { prisma, userId };
  };
}
