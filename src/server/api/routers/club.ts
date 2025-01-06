import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import {
  clubs,
  clubsToCollaborators,
  events,
  ownerInvites,
  users,
} from "@/server/db/schema";
import { and, eq, gt, lt } from "drizzle-orm";
import { checkUserAccess } from "@/server/lib/checkUserAccess";
import { TRPCError } from "@trpc/server";
import { imageSchema } from "@/server/lib/schema";
import { utapi } from "@/server/uploadthing";

export const clubRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx, input }) => {
    return ctx.db.query.clubs.findMany({
      with: {
        events: true,
      },
    });
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.clubs.findFirst({
        where: eq(clubs.id, input.id),
        with: {
          events: true,
        },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        // profileImage: z.string().min(1).max(255),
        profileImage: imageSchema,
        campus: z.enum(["scarborough", "st george", "mississauga"]),
        description: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Checking if user has an club owner invite
      const email = ctx.session.user.email ?? "";
      const ownerInvite = await ctx.db.query.ownerInvites.findMany({
        where: eq(ownerInvites.email, email),
      });
      if (ownerInvite.length == 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User is not authorized to perform the action.",
        });
      }

      // Uploading the image
      const response = await utapi.uploadFiles(input.profileImage);

      await ctx.db.insert(clubs).values({
        name: input.name,
        profileImage: response.data?.key,
        campus: input.campus,
        description: input.description,
        // createdById: ctx.session.user.id,
      });
    }),

  edit: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1).max(255),
        name: z.string().min(1).max(255).optional(),
        campus: z.enum(["scarborough", "st george", "mississauga"]).optional(),
        description: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const hasAccess = await checkUserAccess({
        email: ctx.session.user.email ?? "",
        clubId: input.id,
      });

      if (hasAccess) {
        await ctx.db
          .update(clubs)
          .set({
            name: input.name,
            campus: input.campus,
            description: input.description,
          })
          .where(eq(clubs.id, input.id));
      } else {
        // If user does not own and does not collaborate with the club
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User is not authorized to perform the action.",
        });
      }
    }),

  getActiveEvents: publicProcedure
    .input(
      z.object({
        clubId: z.string().min(1).max(255),
      }),
    )
    .query(({ ctx, input }) => {
      const now = new Date();

      return ctx.db.query.events.findMany({
        where: and(eq(events.clubId, input.clubId), gt(events.startTime, now)),
        orderBy: (events, { asc }) => [asc(events.startTime)],
      });
    }),

  getInActiveEvents: publicProcedure
    .input(
      z.object({
        clubId: z.string().min(1).max(255),
      }),
    )
    .query(({ ctx, input }) => {
      const now = new Date();

      return ctx.db.query.events.findMany({
        where: and(eq(events.clubId, input.clubId), lt(events.startTime, now)),
        orderBy: (events, { desc }) => [desc(events.startTime)],
      });
    }),

  getCollaborators: publicProcedure
    .input(
      z.object({
        clubId: z.string().min(1).max(255),
      }),
    )
    .query(({ ctx, input }) => {
      return ctx.db
        .select()
        .from(users)
        .innerJoin(
          clubsToCollaborators,
          eq(users.id, clubsToCollaborators.userId),
        )
        .innerJoin(clubs, eq(clubsToCollaborators.clubId, clubs.id))
        .where(eq(clubs.id, input.clubId));
    }),

  // getLatest: protectedProcedure.query(async ({ ctx }) => {
  //   const post = await ctx.db.query.posts.findFirst({
  //     orderBy: (posts, { desc }) => [desc(posts.createdAt)],
  //   });

  //   return post ?? null;
  // }),
});
