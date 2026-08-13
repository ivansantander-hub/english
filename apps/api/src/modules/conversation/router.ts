import { AIService, OpenRouterProvider } from "@english-a1/ai";
import { z } from "zod";

import { env } from "../../config/env.js";
import { protectedProcedure, router } from "../../trpc/trpc.js";
import { aiSettingsService } from "../admin/ai-settings-service.js";

import { ConversationService } from "./conversation-service.js";

const aiService = env.OPENROUTER_API_KEY
  ? new AIService(
      new OpenRouterProvider({
        apiKey: env.OPENROUTER_API_KEY,
        baseUrl: env.OPENROUTER_BASE_URL,
        appUrl: env.APP_URL,
      }),
    )
  : undefined;

export const conversationService = new ConversationService({
  ...(aiService ? { aiService } : {}),
  aiSettingsService,
  providerName: "openrouter",
});

export const conversationRouter = router({
  start: protectedProcedure.mutation(({ ctx }) => conversationService.start(ctx.userId)),

  list: protectedProcedure.query(({ ctx }) => conversationService.list(ctx.userId)),

  getHistory: protectedProcedure
    .input(z.object({ conversationId: z.string().min(1) }))
    .query(({ ctx, input }) => conversationService.getHistory(input.conversationId, ctx.userId)),
});
