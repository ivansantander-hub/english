import { adminRouter } from "../modules/admin/router.js";
import { authRouter } from "../modules/auth/router.js";
import { conversationRouter } from "../modules/conversation/router.js";
import { evaluationRouter } from "../modules/evaluation/router.js";
import { exerciseRouter } from "../modules/exercises/router.js";
import { profileRouter } from "../modules/profile/router.js";
import { progressRouter } from "../modules/progress/router.js";

import { router } from "./trpc.js";

export const appRouter = router({
  auth: authRouter,
  admin: adminRouter,
  exercise: exerciseRouter,
  evaluation: evaluationRouter,
  progress: progressRouter,
  conversation: conversationRouter,
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;
