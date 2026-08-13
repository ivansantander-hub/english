import type { AppRouter } from "@english-a1/api/src/trpc/router.js";
import type { inferRouterOutputs } from "@trpc/server";

export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type Exercise = RouterOutputs["exercise"]["getById"];
export type SubmitAnswerResult = RouterOutputs["evaluation"]["submitAnswer"];
export type ConceptProgressItem = RouterOutputs["progress"]["getDashboard"]["concepts"][number];
export type ProfileAnalysis = RouterOutputs["profile"]["list"][number];
export type ModelInfo = RouterOutputs["admin"]["listModels"][number];
export type AISettings = RouterOutputs["admin"]["getAISettings"];
export type LLMUsageSummary = RouterOutputs["admin"]["getLLMUsage"];
export type RecommendedVideo = RouterOutputs["videos"]["getRecommendations"][number];
export type WatchHistoryEntry = RouterOutputs["videos"]["listHistory"][number];
export type Preferences = RouterOutputs["profile"]["getPreferences"];
