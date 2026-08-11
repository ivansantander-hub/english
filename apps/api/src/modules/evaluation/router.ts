import { AIService, OpenRouterProvider } from "@english-a1/ai";
import { SubmitAnswerInputSchema } from "@english-a1/shared";

import { env, llmModelFor } from "../../config/env.js";
import { publicProcedure, router } from "../../trpc/trpc.js";
import { exerciseService } from "../exercises/router.js";

import { EvaluationService } from "./evaluation-service.js";

const aiService = env.OPENROUTER_API_KEY
  ? new AIService(
      new OpenRouterProvider({
        apiKey: env.OPENROUTER_API_KEY,
        baseUrl: env.OPENROUTER_BASE_URL,
        appUrl: env.APP_URL,
      }),
    )
  : undefined;

if (!aiService) {
  console.warn(
    "OPENROUTER_API_KEY not set — evaluation will use rule-based (exact-match) grading only.",
  );
}

const evaluationService = new EvaluationService(exerciseService, {
  ...(aiService ? { aiService } : {}),
  model: llmModelFor("evaluation"),
  providerName: "openrouter",
});

export const evaluationRouter = router({
  submitAnswer: publicProcedure
    .input(SubmitAnswerInputSchema)
    .mutation(({ ctx, input }) =>
      evaluationService.submitAnswer(ctx.userId, input.exerciseId, input.rawAnswer),
    ),
});
