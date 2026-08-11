import type { AppRouter } from "@english-a1/api/src/trpc/router.js";
import { createTRPCReact } from "@trpc/react-query";

export const trpc = createTRPCReact<AppRouter>();
