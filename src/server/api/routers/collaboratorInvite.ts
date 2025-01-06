import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { collaboratorInvites } from "@/server/db/schema";
import { checkUserAccess } from "./checkUserAccess";
import { TRPCError } from "@trpc/server";

export const collaboratorInviteRouter = createTRPCRouter({
  send: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        email: z.string().min(1).max(255),
        clubId: z.string().min(1).max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const hasAccess = await checkUserAccess({
        email: ctx.session.user.email ?? "",
        clubId: input.clubId,
      });

      if (hasAccess) {
        // TO-DO: Need to actually send an email invite
        return ctx.db
          .insert(collaboratorInvites)
          .values({
            name: input.name,
            email: input.email,
            clubId: input.clubId,
          })
          .returning();
      } else {
        // If user does not own and does not collaborate with the club
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User is not authorized to perform the action.",
        });
      }
    }),
});
