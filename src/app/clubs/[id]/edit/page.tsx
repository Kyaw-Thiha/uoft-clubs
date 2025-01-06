import { HydrateClient } from "@/trpc/server";
import { ClubDetailsView } from "@/app/_components/views/clubDetailsView";
import { checkAccess } from "@/app/lib/userAccess";
import { api } from "@/trpc/react";

// Next.js will invalidate the cache when a
// request comes in, at most once every 1 day.
export const revalidate = 60 * 60 * 24;

// We'll prerender only the params from `generateStaticParams` at build time.
// If a request comes in for a path that hasn't been generated,
// Next.js will server-render the page on-demand.
export const dynamicParams = true; // or false, to 404 on unknown paths

export async function generateStaticParams() {
  const [clubs] = api.club.getAll.useSuspenseQuery();

  return clubs.map((club) => ({
    id: String(club.id),
  }));
}

interface Props {
  params: Promise<{ id: string }>;
}
export default async function ClubDetail(props: Props) {
  const id = (await props.params).id;
  const { isOwner, isCollaborator } = checkAccess(id);
  const [club] = api.club.get.useSuspenseQuery({ id: id });

  return (
    <HydrateClient>
      <main>
        {(isOwner ?? isCollaborator) && (
          <ClubDetailsView
            role={isOwner ? "owner" : "collaborator"}
            mode="edit"
            club={club}
          />
        )}
      </main>
    </HydrateClient>
  );
}
