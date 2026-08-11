import { conversationRouter } from "../modules/conversation/router.js";
import { evaluationRouter } from "../modules/evaluation/router.js";
import { exerciseRouter } from "../modules/exercises/router.js";
import { progressRouter } from "../modules/progress/router.js";

import { router } from "./trpc.js";

export const appRouter = router({
  exercise: exerciseRouter,
  evaluation: evaluationRouter,
  progress: progressRouter,
  conversation: conversationRouter,
});

export type AppRouter = typeof appRouter;
