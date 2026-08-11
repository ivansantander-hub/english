import { prisma } from "@english-a1/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../../trpc/trpc.js";

import { AuthService } from "./auth-service.js";
import {
  AccountLockedError,
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  InvalidPinFormatError,
} from "./errors.js";

const authService = new AuthService();

const PinSchema = z.string().regex(/^\d{6}$/, "PIN must be exactly 6 digits");
const CredentialsSchema = z.object({ email: z.string().email(), pin: PinSchema });

function toTRPCError(error: unknown): TRPCError {
  if (error instanceof EmailAlreadyRegisteredError) {
    return new TRPCError({ code: "CONFLICT", message: error.message });
  }
  if (error instanceof InvalidPinFormatError) {
    return new TRPCError({ code: "BAD_REQUEST", message: error.message });
  }
  if (error instanceof InvalidCredentialsError) {
    return new TRPCError({ code: "UNAUTHORIZED", message: error.message });
  }
  if (error instanceof AccountLockedError) {
    return new TRPCError({ code: "TOO_MANY_REQUESTS", message: error.message });
  }
  console.error("Unexpected auth error:", error);
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Something went wrong. Try again." });
}

export const authRouter = router({
  register: publicProcedure.input(CredentialsSchema).mutation(async ({ input }) => {
    try {
      return await authService.register(input.email, input.pin);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),

  login: publicProcedure.input(CredentialsSchema).mutation(async ({ input }) => {
    try {
      return await authService.login(input.email, input.pin);
    } catch (error) {
      throw toTRPCError(error);
    }
  }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    await authService.logout(ctx.token);
    return { success: true };
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: ctx.userId } });
    return { id: user.id, email: user.email, role: user.role };
  }),

  changePin: protectedProcedure
    .input(z.object({ currentPin: PinSchema, newPin: PinSchema }))
    .mutation(async ({ ctx, input }) => {
      try {
        await authService.changePin(ctx.userId, input.currentPin, input.newPin);
        return { success: true };
      } catch (error) {
        throw toTRPCError(error);
      }
    }),
});
