import { initTRPC, TRPCError } from "@trpc/server";

import type { Context } from "./context.js";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

const requireAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.userId || !ctx.userRole || !ctx.token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Log in to continue." });
  }
  return next({
    ctx: { ...ctx, userId: ctx.userId, userRole: ctx.userRole, token: ctx.token },
  });
});

/** Requires a valid session. Narrows ctx.userId/userRole to non-null. */
export const protectedProcedure = publicProcedure.use(requireAuth);

const requireAdminRole = t.middleware(({ ctx, next }) => {
  if (ctx.userRole !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admins only." });
  }
  return next({ ctx });
});

/** Requires a valid session AND the admin role. */
export const adminProcedure = protectedProcedure.use(requireAdminRole);
