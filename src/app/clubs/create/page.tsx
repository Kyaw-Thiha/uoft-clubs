// import { useSession } from "next-auth/react";
import { HydrateClient } from "@/trpc/server";
import { ClubDetailsView } from "@/app/_components/views/clubDetailsView";

export default function ClubCreate() {
  return (
    <HydrateClient>
      <main>
        <ClubDetailsView role="owner" mode="edit" />
      </main>
    </HydrateClient>
  );
}
