import { prisma } from "@english-a1/db";
import type { ErrorType } from "@english-a1/shared";

import { ENGLISH_TRUSTED_CHANNELS, SPANISH_TRUSTED_CHANNELS, searchYouTube } from "./youtube-client.js";

const CACHE_STALE_DAYS = 30;
const MAX_RECOMMENDATIONS = 3;

const ERROR_TYPE_SEARCH_QUERIES_EN: Record<ErrorType, string> = {
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

const ERROR_TYPE_SEARCH_QUERIES_ES: Record<ErrorType, string> = {
  grammar: "gramática básica en inglés explicado en español para principiantes",
  third_person_singular: "tercera persona singular en inglés explicado en español",
  verb_tense: "tiempos verbales en inglés explicado en español para principiantes",
  word_order: "orden de las palabras en inglés explicado en español",
  preposition: "preposiciones en inglés explicado en español",
  article: "artículos en inglés a an the explicado en español",
  pronoun: "pronombres en inglés explicado en español",
  possessive: "adjetivos y pronombres posesivos en inglés explicado en español",
  vocabulary: "vocabulario en inglés explicado en español para principiantes",
  expression: "expresiones comunes en inglés explicado en español",
  meaning: "significado y uso de palabras en inglés explicado en español",
  spelling: "reglas de ortografía en inglés explicado en español",
  naturalness: "cómo sonar natural en inglés explicado en español",
};

export type TopicType = "concept" | "error_type";
export type VideoLanguage = "es" | "en";

export interface RecommendedVideoDTO {
  id: string;
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  watchedSeconds: number;
  completed: boolean;
}

export class VideoRecommendationService {
  constructor(private readonly youtubeApiKey: string | undefined) {}

  async getVideosFor(
    topicType: TopicType,
    topicKey: string,
    language: VideoLanguage,
  ): Promise<RecommendedVideoDTO[]> {
    const staleBefore = new Date();
    staleBefore.setDate(staleBefore.getDate() - CACHE_STALE_DAYS);

    const cached = await prisma.recommendedVideo.findMany({
      where: { topicType, topicKey, language },
      orderBy: { fetchedAt: "desc" },
    });
    const isFresh = cached.length > 0 && (cached[0]?.fetchedAt ?? new Date(0)) > staleBefore;
    if (isFresh) return cached.slice(0, MAX_RECOMMENDATIONS).map(toDTO);

    if (!this.youtubeApiKey) return cached.slice(0, MAX_RECOMMENDATIONS).map(toDTO);

    const query = await this.buildSearchQuery(topicType, topicKey, language);
    if (!query) return cached.slice(0, MAX_RECOMMENDATIONS).map(toDTO);

    try {
      const trustedChannels = language === "es" ? SPANISH_TRUSTED_CHANNELS : ENGLISH_TRUSTED_CHANNELS;
      const results = await searchYouTube(this.youtubeApiKey, query, trustedChannels, language);
      const saved = await Promise.all(
        results.slice(0, MAX_RECOMMENDATIONS).map((result) =>
          prisma.recommendedVideo.upsert({
            where: {
              topicType_topicKey_language_videoId: {
                topicType,
                topicKey,
                language,
                videoId: result.videoId,
              },
            },
            create: {
              topicType,
              topicKey,
              language,
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

  private async buildSearchQuery(
    topicType: TopicType,
    topicKey: string,
    language: VideoLanguage,
  ): Promise<string | null> {
    if (topicType === "error_type") {
      const queries = language === "es" ? ERROR_TYPE_SEARCH_QUERIES_ES : ERROR_TYPE_SEARCH_QUERIES_EN;
      const phrase = queries[topicKey as ErrorType];
      return phrase ?? null;
    }
    const concept = await prisma.concept.findUnique({ where: { key: topicKey }, select: { name: true } });
    if (!concept) return null;
    return language === "es"
      ? `${concept.name} en inglés explicado en español para principiantes`
      : `${concept.name} English grammar lesson for beginners`;
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
    watchedSeconds: 0,
    completed: false,
  };
}
