import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, router } from "../../trpc/trpc.js";

import { AdminService, LastAdminError } from "./admin-service.js";

const adminService = new AdminService();

const RoleSchema = z.enum(["admin", "user"]);
const PinSchema = z.string().regex(/^\d{6}$/, "PIN must be exactly 6 digits");

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
});
