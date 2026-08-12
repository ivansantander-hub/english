import { AIService, OpenRouterProvider } from "@english-a1/ai";

import { env, llmModelFor } from "../../config/env.js";
import { protectedProcedure, router } from "../../trpc/trpc.js";
import { progressService } from "../progress/router.js";

import { ProfileAnalysisService } from "./profile-analysis-service.js";

const aiService = env.OPENROUTER_API_KEY
  ? new AIService(
      new OpenRouterProvider({
        apiKey: env.OPENROUTER_API_KEY,
        baseUrl: env.OPENROUTER_BASE_URL,
        appUrl: env.APP_URL,
      }),
    )
  : undefined;

const profileAnalysisService = new ProfileAnalysisService(progressService, {
  ...(aiService ? { aiService } : {}),
  model: llmModelFor("analysis"),
  providerName: "openrouter",
});

export const profileRouter = router({
  generate: protectedProcedure.mutation(({ ctx }) =>
    profileAnalysisService.generateAnalysis(ctx.userId),
  ),

  list: protectedProcedure.query(({ ctx }) => profileAnalysisService.listAnalyses(ctx.userId)),
});
