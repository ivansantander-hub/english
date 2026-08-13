import { fetchModelCatalog } from "@english-a1/ai";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "../../config/env.js";
import { adminProcedure, router } from "../../trpc/trpc.js";

import { AdminService, LastAdminError } from "./admin-service.js";
import { aiSettingsService } from "./ai-settings-service.js";
import { llmUsageService } from "./llm-usage-service.js";

const adminService = new AdminService();

const RoleSchema = z.enum(["admin", "user"]);
const PinSchema = z.string().regex(/^\d{6}$/, "PIN must be exactly 6 digits");

const ModelOverrideSchema = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value || null);

const AISettingsInputSchema = z.object({
  defaultModel: z.string().min(1),
  evaluationModel: ModelOverrideSchema,
  conversationModel: ModelOverrideSchema,
  analysisModel: ModelOverrideSchema,
});

export const adminRouter = router({
  listUsers: adminProcedure.query(() => adminService.listUsers()),

  setRole: adminProcedure
    .input(z.object({ userId: z.string().min(1), role: RoleSchema }))
    .mutation(async ({ input }) => {
      try {
        await adminService.setRole(input.userId, input.role);
        return { success: true };
      } catch (error) {
        if (error instanceof LastAdminError) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        }
        throw error;
      }
    }),

  resetPin: adminProcedure
    .input(z.object({ userId: z.string().min(1), newPin: PinSchema }))
    .mutation(async ({ input }) => {
      await adminService.resetPin(input.userId, input.newPin);
      return { success: true };
    }),

  listModels: adminProcedure.query(() => fetchModelCatalog(env.OPENROUTER_BASE_URL)),

  getAISettings: adminProcedure.query(() => aiSettingsService.get()),

  updateAISettings: adminProcedure
    .input(AISettingsInputSchema)
    .mutation(({ input }) => aiSettingsService.update(input)),

  getLLMUsage: adminProcedure.query(() => llmUsageService.getSummary()),
});
