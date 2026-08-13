import { z } from "zod";

import { env } from "../../config/env.js";
import { protectedProcedure, router } from "../../trpc/trpc.js";

import { VideoRecommendationService } from "./video-recommendation-service.js";
import { WatchHistoryService } from "./watch-history-service.js";

const videoRecommendationService = new VideoRecommendationService(env.YOUTUBE_API_KEY);
const watchHistoryService = new WatchHistoryService();

const TopicTypeSchema = z.enum(["concept", "error_type"]);

export const videosRouter = router({
  getRecommendations: protectedProcedure
    .input(z.object({ topicType: TopicTypeSchema, topicKey: z.string().min(1) }))
    .query(({ input }) =>
      videoRecommendationService.getVideosFor(input.topicType, input.topicKey),
    ),

  recordWatch: protectedProcedure
    .input(
      z.object({
        recommendedVideoId: z.string().min(1),
        watchedSeconds: z.number().int().min(0),
        completed: z.boolean(),
      }),
    )
    .mutation(({ ctx, input }) =>
      watchHistoryService.recordWatch(
        ctx.userId,
        input.recommendedVideoId,
        input.watchedSeconds,
        input.completed,
      ),
    ),

  listHistory: protectedProcedure.query(({ ctx }) => watchHistoryService.listHistory(ctx.userId)),
});
