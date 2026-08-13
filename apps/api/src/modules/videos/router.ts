import { prisma } from "@english-a1/db";
import { z } from "zod";

import { env } from "../../config/env.js";
import { protectedProcedure, router } from "../../trpc/trpc.js";

import type { RecommendedVideoDTO, VideoLanguage } from "./video-recommendation-service.js";
import { VideoRecommendationService } from "./video-recommendation-service.js";
import { WatchHistoryService } from "./watch-history-service.js";

const videoRecommendationService = new VideoRecommendationService(env.YOUTUBE_API_KEY);
const watchHistoryService = new WatchHistoryService();

const TopicTypeSchema = z.enum(["concept", "error_type"]);

/** A1/A2 learners get lessons explained in Spanish; everyone else gets English-taught lessons. */
const BEGINNER_LEVELS = new Set(["A1", "A2"]);

async function resolveVideoLanguage(userId: string): Promise<VideoLanguage> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { currentLevel: true, videoLanguagePreference: true },
  });
  if (user.videoLanguagePreference !== "auto") return user.videoLanguagePreference;
  return BEGINNER_LEVELS.has(user.currentLevel) ? "es" : "en";
}

async function withWatchProgress(
  userId: string,
  videos: RecommendedVideoDTO[],
): Promise<RecommendedVideoDTO[]> {
  if (videos.length === 0) return videos;
  const events = await prisma.videoWatchEvent.findMany({
    where: { userId, recommendedVideoId: { in: videos.map((v) => v.id) } },
  });
  const byVideoId = new Map(events.map((e) => [e.recommendedVideoId, e]));
  return videos.map((video) => {
    const event = byVideoId.get(video.id);
    return event
      ? { ...video, watchedSeconds: event.watchedSeconds, completed: event.completed }
      : video;
  });
}

export const videosRouter = router({
  getRecommendations: protectedProcedure
    .input(z.object({ topicType: TopicTypeSchema, topicKey: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const language = await resolveVideoLanguage(ctx.userId);
      const videos = await videoRecommendationService.getVideosFor(
        input.topicType,
        input.topicKey,
        language,
      );
      return withWatchProgress(ctx.userId, videos);
    }),

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
