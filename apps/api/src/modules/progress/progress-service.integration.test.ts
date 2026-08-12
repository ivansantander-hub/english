import { prisma } from "@english-a1/db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { ProgressService } from "./progress-service.js";

/**
 * Exercises the day-bucketing and streak calculation in
 * getActivitySummary against a real Postgres instance (no mocks).
 */
describe("ProgressService.getActivitySummary (integration)", () => {
  const progressService = new ProgressService();
  const testEmail = "progress-integration-test-user@english-a1.local";
  const exerciseId = "ps-001";
  let userId: string;

  async function cleanup(): Promise<void> {
    await prisma.exerciseAttempt.deleteMany({ where: { user: { email: testEmail } } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
  }

  async function attemptDaysAgo(daysAgo: number): Promise<void> {
    const createdAt = new Date();
    createdAt.setUTCDate(createdAt.getUTCDate() - daysAgo);
    await prisma.exerciseAttempt.create({
      data: { userId, exerciseId, rawAnswer: "x", overallScore: 1, createdAt },
    });
  }

  beforeEach(async () => {
    await cleanup();
    const user = await prisma.user.create({ data: { email: testEmail, role: "user" } });
    userId = user.id;
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it("returns `days` entries, oldest first, all zero when there's no activity", async () => {
    const summary = await progressService.getActivitySummary(userId, 5);
    expect(summary.activity).toHaveLength(5);
    expect(summary.activity.every((day) => day.count === 0)).toBe(true);
    expect(summary.currentStreak).toBe(0);
    expect(summary.practicedToday).toBe(false);
    expect(summary.todayCount).toBe(0);
  });

  it("buckets same-day attempts together and computes a streak ending today", async () => {
    await attemptDaysAgo(0);
    await attemptDaysAgo(0);
    await attemptDaysAgo(1);
    await attemptDaysAgo(2);

    const summary = await progressService.getActivitySummary(userId, 5);
    const todayEntry = summary.activity[summary.activity.length - 1];

    expect(todayEntry?.count).toBe(2);
    expect(summary.todayCount).toBe(2);
    expect(summary.practicedToday).toBe(true);
    expect(summary.currentStreak).toBe(3);
  });

  it("keeps yesterday's streak alive before today's first attempt", async () => {
    await attemptDaysAgo(1);
    await attemptDaysAgo(2);

    const summary = await progressService.getActivitySummary(userId, 5);
    expect(summary.practicedToday).toBe(false);
    expect(summary.currentStreak).toBe(2);
  });

  it("resets the streak once a full day is missed", async () => {
    await attemptDaysAgo(3);
    await attemptDaysAgo(4);

    const summary = await progressService.getActivitySummary(userId, 5);
    expect(summary.practicedToday).toBe(false);
    expect(summary.currentStreak).toBe(0);
  });
});
