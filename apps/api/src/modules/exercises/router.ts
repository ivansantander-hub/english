import { z } from "zod";

import { protectedProcedure, router } from "../../trpc/trpc.js";
import { progressService } from "../progress/router.js";

import { PrismaExerciseRepository } from "./exercise-repository.js";
import { ExerciseService } from "./exercise-service.js";

const exerciseService = new ExerciseService(new PrismaExerciseRepository(), progressService);

export const exerciseRouter = router({
  getNext: protectedProcedure
    .input(
      z
        .object({
          mode: z.enum(["balanced", "weakness"]).default("balanced"),
          conceptKey: z.string().min(1).optional(),
        })
        .optional(),
    )
    .query(({ ctx, input }) => exerciseService.getNext(ctx.userId, input?.mode, input?.conceptKey)),

  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => exerciseService.getById(input.id)),

  getDailyPractice: protectedProcedure.query(({ ctx }) =>
    exerciseService.getDailyPractice(ctx.userId),
  ),

  skip: protectedProcedure
    .input(z.object({ exerciseId: z.string().min(1) }))
    .mutation(({ ctx, input }) => exerciseService.recordSkip(ctx.userId, input.exerciseId)),
});

export { exerciseService };
