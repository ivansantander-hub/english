import { detectWeaknesses } from "@english-a1/learning";

import { publicProcedure, router } from "../../trpc/trpc.js";

import { ProgressService } from "./progress-service.js";

export const progressService = new ProgressService();

export const progressRouter = router({
  getDashboard: publicProcedure.query(async ({ ctx }) => {
    const [concepts, exercisesCompleted] = await Promise.all([
      progressService.getConceptProgress(ctx.userId),
      progressService.getExercisesCompletedCount(ctx.userId),
    ]);
    const totalAttempts = concepts.reduce((sum, c) => sum + c.attempts, 0);
    const totalCorrect = concepts.reduce((sum, c) => sum + c.correct, 0);
    return {
      concepts,
      exercisesCompleted,
      overallAccuracy: totalAttempts > 0 ? totalCorrect / totalAttempts : 0,
    };
  }),

  getMistakes: publicProcedure.query(async ({ ctx }) => {
    const concepts = await progressService.getConceptProgress(ctx.userId);
    return detectWeaknesses(concepts).map((concept) => ({
      ...concept,
      mistakes: concept.attempts - concept.correct,
    }));
  }),
});
