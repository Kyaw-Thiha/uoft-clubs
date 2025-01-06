import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { events } from "@/server/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { checkUserAccess } from "@/server/lib/checkUserAccess";

export const eventRouter = createTRPCRouter({
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.events.findFirst({
        where: eq(events.id, input.id),
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().min(1),
        image: z.string().min(1).max(255),
        venue: z.string().min(1).max(255),
        startTime: z.date(),
        endTime: z.date(),
        clubId: z.string().min(1).max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const hasAccess = await checkUserAccess({
        email: ctx.session.user.email ?? "",
        clubId: input.clubId,
      });

      if (hasAccess) {
        return ctx.db
          .insert(events)
          .values({
            name: input.name,
            description: input.description,
            image: input.image,
            venue: input.venue,
            startTime: input.startTime,
            endTime: input.endTime,
            clubId: input.clubId,
          })
          .returning({ eventId: events.id });
      } else {
        // If user does not own and does not collaborate with the club
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User is not authorized to perform the action.",
        });
      }
    }),

  // create: protectedProcedure
  //   .input(
  //     z.object({
  //       name: z.string().min(1).max(255),
  //       description: z.string().min(1),
  //       image: z.string().min(1).max(255),
  //       venue: z.string().min(1).max(255),
  //       startTime: z.date(),
  //       endTime: z.date(),
  //       clubId: z.string().min(1).max(255),
  //     }),
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     // Checking if user has access
  //     const email = ctx.session.user.email ?? "";
  //     const user = await ctx.db.query.users.findFirst({
  //       where: eq(users.email, email),
  //       with: {
  //         ownedClubs: {
  //           columns: {
  //             clubId: true,
  //           },
  //         },
  //         collaboratedClubs: {
  //           columns: {
  //             clubId: true,
  //           },
  //         },
  //       },
  //     });

  //     // https://stackoverflow.com/questions/8217419/how-to-determine-if-a-javascript-array-contains-an-object-with-an-attribute-that
  //     if (
  //       user?.ownedClubs.some((e) => e.clubId == input.clubId) ||
  //       user?.collaboratedClubs.some((e) => e.clubId == input.clubId)
  //     ) {
  //       return ctx.db
  //         .insert(events)
  //         .values({
  //           name: input.name,
  //           description: input.description,
  //           image: input.image,
  //           venue: input.venue,
  //           startTime: input.startTime,
  //           endTime: input.endTime,
  //           clubId: input.clubId,
  //         })
  //         .returning({ eventId: events.id });
  //     } else {
  //       // If user does not own and does not collaborate with the club
  //       throw new TRPCError({
  //         code: "UNAUTHORIZED",
  //         message: "User is not authorized to perform the action.",
  //       });
  //     }
  //   }),

  edit: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1).max(255),
        name: z.string().min(1).max(255).optional(),
        description: z.string().min(1).optional(),
        image: z.string().min(1).max(255).optional(),
        venue: z.string().min(1).max(255).optional(),
        startTime: z.date().optional(),
        endTime: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const hasAccess = await checkUserAccess({
        email: ctx.session.user.email ?? "",
        clubId: input.id,
      });

      if (hasAccess) {
        return ctx.db
          .update(events)
          .set({
            name: input.name,
            description: input.description,
            image: input.image,
            venue: input.venue,
            startTime: input.startTime,
            endTime: input.endTime,
          })
          .where(eq(events.id, input.id))
          .returning();
      } else {
        // If user does not own and does not collaborate with the club
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User is not authorized to perform the action.",
        });
      }
    }),

  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1).max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const hasAccess = await checkUserAccess({
        email: ctx.session.user.email ?? "",
        clubId: input.id,
      });

      if (hasAccess) {
        return ctx.db
          .delete(events)
          .where(eq(events.id, input.id))
          .returning({ deletedId: events.id });
      } else {
        // If user does not own and does not collaborate with the club
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User is not authorized to perform the action.",
        });
      }
    }),

  getHighlights: publicProcedure.query(({ ctx, input }) => {
    const now = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(now.getDate() + 7);

    return ctx.db.query.events.findMany({
      where: and(
        gte(events.startTime, now),
        lte(events.startTime, oneWeekFromNow),
      ),
      orderBy: (events, { asc }) => [asc(events.startTime)],
    });
  }),

  getByDay: publicProcedure
    .input(
      z.object({
        targetDate: z.date(),
      }),
    )
    .query(({ ctx, input }) => {
      // Start of the day: 00:00:00
      const startOfDay = new Date(input.targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      // End of the day: 23:59:59.999
      const endOfDay = new Date(input.targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      return ctx.db.query.events.findFirst({
        where: and(
          gte(events.startTime, startOfDay),
          lte(events.startTime, endOfDay),
        ),
        orderBy: (events, { asc }) => [asc(events.startTime)],
      });
    }),
});
