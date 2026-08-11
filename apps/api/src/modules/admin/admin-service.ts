import type { AccountRole } from "@english-a1/db";
import { prisma } from "@english-a1/db";
import { computeAccuracy } from "@english-a1/learning";

import { hashPin } from "../auth/pin-hash.js";

export interface UserSummary {
  id: string;
  email: string;
  role: AccountRole;
  createdAt: Date;
  exercisesCompleted: number;
  overallAccuracy: number;
}

export class LastAdminError extends Error {
  constructor() {
    super("Can't remove the last admin account.");
    this.name = "LastAdminError";
  }
}

export class AdminService {
  /** "See everything": every account plus their real activity, not just a roster. */
  async listUsers(): Promise<UserSummary[]> {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

    return Promise.all(
      users.map(async (user) => {
        const [exercisesCompleted, progressAgg] = await Promise.all([
          prisma.exerciseAttempt.count({ where: { userId: user.id } }),
          prisma.userConceptProgress.aggregate({
            where: { userId: user.id },
            _sum: { attempts: true, correct: true },
          }),
        ]);

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          exercisesCompleted,
          overallAccuracy: computeAccuracy(
            progressAgg._sum.attempts ?? 0,
            progressAgg._sum.correct ?? 0,
          ),
        };
      }),
    );
  }

  async setRole(userId: string, role: AccountRole): Promise<void> {
    if (role !== "admin") {
      const target = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
      if (target.role === "admin") {
        const adminCount = await prisma.user.count({ where: { role: "admin" } });
        if (adminCount <= 1) throw new LastAdminError();
      }
    }
    await prisma.user.update({ where: { id: userId }, data: { role } });
  }

  async resetPin(userId: string, newPin: string): Promise<void> {
    const pinHash = await hashPin(newPin);
    await prisma.user.update({
      where: { id: userId },
      data: { pinHash, failedLoginAttempts: 0, lockedUntil: null },
    });
  }
}
