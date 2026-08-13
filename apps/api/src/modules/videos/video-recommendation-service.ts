import { prisma } from "@english-a1/db";
import type { ErrorType } from "@english-a1/shared";

import { searchYouTube } from "./youtube-client.js";

const CACHE_STALE_DAYS = 30;
const MAX_RECOMMENDATIONS = 3;

const ERROR_TYPE_SEARCH_QUERIES: Record<ErrorType, string> = {
  grammar: "English grammar basics lesson",
  third_person_singular: "English third person singular verb -s lesson",
  verb_tense: "English verb tense grammar lesson",
  word_order: "English word order sentence structure lesson",
  preposition: "English prepositions lesson",
  article: "English articles a an the lesson",
  pronoun: "English pronouns lesson",
  possessive: "English possessive adjectives and pronouns lesson",
  vocabulary: "English vocabulary building lesson",
  expression: "common English expressions lesson",
  meaning: "English word meaning and usage lesson",
  spelling: "English spelling rules lesson",
  naturalness: "natural English phrasing lesson",
};

export type TopicType = "concept" | "error_type";

export interface RecommendedVideoDTO {
  id: string;
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
}

export class VideoRecommendationService {
  constructor(private readonly youtubeApiKey: string | undefined) {}

  async getVideosFor(topicType: TopicType, topicKey: string): Promise<RecommendedVideoDTO[]> {
    const staleBefore = new Date();
    staleBefore.setDate(staleBefore.getDate() - CACHE_STALE_DAYS);

    const cached = await prisma.recommendedVideo.findMany({
      where: { topicType, topicKey },
      orderBy: { fetchedAt: "desc" },
    });
    const isFresh = cached.length > 0 && (cached[0]?.fetchedAt ?? new Date(0)) > staleBefore;
    if (isFresh) return cached.slice(0, MAX_RECOMMENDATIONS).map(toDTO);

    if (!this.youtubeApiKey) return cached.slice(0, MAX_RECOMMENDATIONS).map(toDTO);

    const query = await this.buildSearchQuery(topicType, topicKey);
    if (!query) return cached.slice(0, MAX_RECOMMENDATIONS).map(toDTO);

    try {
      const results = await searchYouTube(this.youtubeApiKey, query);
      const saved = await Promise.all(
        results.slice(0, MAX_RECOMMENDATIONS).map((result) =>
          prisma.recommendedVideo.upsert({
            where: {
              topicType_topicKey_videoId: { topicType, topicKey, videoId: result.videoId },
            },
            create: {
              topicType,
              topicKey,
              videoId: result.videoId,
              title: result.title,
              channelName: result.channelName,
              thumbnailUrl: result.thumbnailUrl,
            },
            update: {
              title: result.title,
              channelName: result.channelName,
              thumbnailUrl: result.thumbnailUrl,
              fetchedAt: new Date(),
            },
          }),
        ),
      );
      if (saved.length > 0) return saved.map(toDTO);
    } catch {
      // A YouTube outage/quota issue is never fatal — fall through to
      // whatever's already cached (possibly nothing) rather than error.
    }

    return cached.slice(0, MAX_RECOMMENDATIONS).map(toDTO);
  }

  private async buildSearchQuery(topicType: TopicType, topicKey: string): Promise<string | null> {
    if (topicType === "error_type") {
      const phrase = ERROR_TYPE_SEARCH_QUERIES[topicKey as ErrorType];
      return phrase ?? null;
    }
    const concept = await prisma.concept.findUnique({ where: { key: topicKey }, select: { name: true } });
    return concept ? `${concept.name} English grammar lesson for beginners` : null;
  }
}

function toDTO(row: {
  id: string;
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
}): RecommendedVideoDTO {
  return {
    id: row.id,
    videoId: row.videoId,
    title: row.title,
    channelName: row.channelName,
    thumbnailUrl: row.thumbnailUrl,
  };
}
