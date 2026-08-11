import type { AppRouter } from "@english-a1/api/src/trpc/router.js";
import type { inferRouterOutputs } from "@trpc/server";

export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type Exercise = RouterOutputs["exercise"]["getById"];
export type SubmitAnswerResult = RouterOutputs["evaluation"]["submitAnswer"];
export type ConceptProgressItem = RouterOutputs["progress"]["getDashboard"]["concepts"][number];
