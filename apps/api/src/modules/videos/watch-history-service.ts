import { prisma } from "@english-a1/db";

export interface WatchHistoryEntryDTO {
  id: string;
  videoTitle: string;
  channelName: string;
  watchedSeconds: number;
  completed: boolean;
  updatedAt: Date;
}

const HISTORY_LIMIT = 50;

export class WatchHistoryService {
  /** Upserts, keeping the highest watched-seconds seen so far for this (user, video) pair. */
  async recordWatch(
    userId: string,
    recommendedVideoId: string,
    watchedSeconds: number,
    completed: boolean,
  ): Promise<void> {
    const existing = await prisma.videoWatchEvent.findUnique({
      where: { userId_recommendedVideoId: { userId, recommendedVideoId } },
    });

    await prisma.videoWatchEvent.upsert({
      where: { userId_recommendedVideoId: { userId, recommendedVideoId } },
      create: { userId, recommendedVideoId, watchedSeconds, completed },
      update: {
        watchedSeconds: Math.max(watchedSeconds, existing?.watchedSeconds ?? 0),
        completed: completed || (existing?.completed ?? false),
      },
    });
  }

  async listHistory(userId: string): Promise<WatchHistoryEntryDTO[]> {
    const rows = await prisma.videoWatchEvent.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: HISTORY_LIMIT,
      include: { video: { select: { title: true, channelName: true } } },
    });
    return rows.map((row) => ({
      id: row.id,
      videoTitle: row.video.title,
      channelName: row.video.channelName,
      watchedSeconds: row.watchedSeconds,
      completed: row.completed,
      updatedAt: row.updatedAt,
    }));
  }
}
