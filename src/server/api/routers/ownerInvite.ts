import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { ownerInvites } from "@/server/db/schema";

export const ownerInviteRouter = createTRPCRouter({
  send: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        email: z.string().min(1).max(255),
        clubName: z.string().min(1).max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // TO-DO: Need to check access by checking if user has admin priviledges
      // TO-DO: Need to send an email invite
      return ctx.db
        .insert(ownerInvites)
        .values({
          name: input.name,
          email: input.email,
          clubName: input.clubName,
        })
        .returning();
    }),
});
