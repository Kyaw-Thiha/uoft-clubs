import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { clubRouter } from "./routers/club";
import { eventRouter } from "./routers/event";
import { userRouter } from "./routers/user";
import { ownerInviteRouter } from "./routers/ownerInvite";
import { collaboratorInviteRouter } from "./routers/collaboratorInvite";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  club: clubRouter,
  event: eventRouter,
  user: userRouter,
  ownerInvite: ownerInviteRouter,
  collaboratorInvite: collaboratorInviteRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
