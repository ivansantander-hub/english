import { AIService, OpenRouterProvider } from "@english-a1/ai";
import { z } from "zod";

import { env } from "../../config/env.js";
import { protectedProcedure, router } from "../../trpc/trpc.js";
import { aiSettingsService } from "../admin/ai-settings-service.js";
import { progressService } from "../progress/router.js";

import { PreferencesService } from "./preferences-service.js";
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
  aiSettingsService,
  providerName: "openrouter",
});
const preferencesService = new PreferencesService();

const PreferencesInputSchema = z.object({
  showVideoRecsInPractice: z.boolean(),
  showVideoRecsInProfile: z.boolean(),
});

export const profileRouter = router({
  generate: protectedProcedure.mutation(({ ctx }) =>
    profileAnalysisService.generateAnalysis(ctx.userId),
  ),

  list: protectedProcedure.query(({ ctx }) => profileAnalysisService.listAnalyses(ctx.userId)),

  getPreferences: protectedProcedure.query(({ ctx }) => preferencesService.get(ctx.userId)),

  updatePreferences: protectedProcedure
    .input(PreferencesInputSchema)
    .mutation(({ ctx, input }) => preferencesService.update(ctx.userId, input)),
});
