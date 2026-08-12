import { DAILY_PRACTICE_SIZE, detectWeaknesses } from "@english-a1/learning";

import { protectedProcedure, router } from "../../trpc/trpc.js";

import { ProgressService } from "./progress-service.js";

export const progressService = new ProgressService();

export const progressRouter = router({
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    const [concepts, exercisesCompleted, exercisesSkipped, activitySummary] = await Promise.all([
      progressService.getConceptProgress(ctx.userId),
      progressService.getExercisesCompletedCount(ctx.userId),
      progressService.getExercisesSkippedCount(ctx.userId),
      progressService.getActivitySummary(ctx.userId),
    ]);
    const totalAttempts = concepts.reduce((sum, c) => sum + c.attempts, 0);
    const totalCorrect = concepts.reduce((sum, c) => sum + c.correct, 0);
    return {
      concepts,
      exercisesCompleted,
      exercisesSkipped,
      overallAccuracy: totalAttempts > 0 ? totalCorrect / totalAttempts : 0,
      dailyGoal: DAILY_PRACTICE_SIZE,
      ...activitySummary,
    };
  }),

  getMistakes: protectedProcedure.query(async ({ ctx }) => {
    const concepts = await progressService.getConceptProgress(ctx.userId);
    return detectWeaknesses(concepts).map((concept) => ({
      ...concept,
      mistakes: concept.attempts - concept.correct,
    }));
  }),
});
