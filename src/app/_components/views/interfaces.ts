import type { AppRouter } from "@/server/api/root";
import type { inferRouterOutputs } from "@trpc/server";

// https://trpc.io/docs/client/vanilla/infer-types
type Club = inferRouterOutputs<AppRouter>["club"]["get"];
type Events = inferRouterOutputs<AppRouter>["club"]["getActiveEvents"];

interface BaseViewInterface {
  role: "public" | "collaborator" | "owner";
  mode: "view" | "edit";
}

export interface ClubDetailsViewInterface extends BaseViewInterface {
  club?: Club;
  activeEvents?: Events;
  inActiveEvents?: Events;
}
