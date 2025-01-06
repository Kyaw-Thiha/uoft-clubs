import { api } from "@/trpc/react";

export function checkAccess(clubId: string) {
  const [user] = api.user.getCurrentUser.useSuspenseQuery();

  const isOwner = user?.ownedClubs.some((e) => e.clubId == clubId);
  const isCollaborator = user?.collaboratedClubs.some(
    (e) => e.clubId == clubId,
  );

  return { isOwner, isCollaborator };
}
