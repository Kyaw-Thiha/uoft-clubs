import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

interface CheckUserAccessParams {
  email: string;
  clubId: string;
}
export async function checkUserAccess(params: CheckUserAccessParams) {
  // Checking if user has access by checking if user is owner or collaborator of the club
  const email = params.email;
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
    with: {
      ownedClubs: {
        columns: {
          clubId: true,
        },
      },
      collaboratedClubs: {
        columns: {
          clubId: true,
        },
      },
    },
  });

  // https://stackoverflow.com/questions/8217419/how-to-determine-if-a-javascript-array-contains-an-object-with-an-attribute-that
  return (
    user?.ownedClubs.some((e) => e.clubId == params.clubId) ??
    user?.collaboratedClubs.some((e) => e.clubId == params.clubId)
  );
}
