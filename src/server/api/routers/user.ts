import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  clubsToCollaborators,
  collaboratorInvites,
  users,
} from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  edit: protectedProcedure
    .input(
      z.object({
        image: z.string().min(1).max(255).optional(),
        name: z.string().min(1).max(255).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(users)
        .set({
          image: input.image,
        })
        .where(eq(users.id, ctx.session.user.id));
    }),

  joinClub: protectedProcedure
    .input(
      z.object({
        clubId: z.string().min(1).max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Checking if user has an club collaborator invite
      const email = ctx.session.user.email ?? "";
      const invite = await ctx.db.query.collaboratorInvites.findMany({
        where: and(
          eq(collaboratorInvites.email, email),
          eq(collaboratorInvites.clubId, input.clubId),
        ),
      });
      if (invite.length == 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User is not authorized to perform the action.",
        });
      }

      // Create the new collaborator relationship
      // Then, delete the invite
      return ctx.db.transaction(async (tx) => {
        await tx.insert(clubsToCollaborators).values({
          userId: ctx.session.user.id,
          clubId: input.clubId,
        });

        await tx
          .delete(collaboratorInvites)
          .where(eq(collaboratorInvites.id, invite[0]?.id ?? ""));
      });
    }),
});
