import type { ClubDetailsViewInterface } from "./interfaces";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import Link from "next/link";

import { ClubDetailFormView } from "./clubDetailsFormView";

export function ClubDetailsView(props: ClubDetailsViewInterface) {
  if (props.mode == "view") {
    return (
      <section>
        <div className="flex flex-row">
          <div>
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>
          <div>
            <h1>{props.club?.name}</h1>
          </div>
          <div>
            {props.role != "public" && (
              <Link href={`/clubs/${props.club?.id}/edit`}>
                <Button asChild>Edit</Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  } else if (props.mode == "edit") {
    if (props.role == "public") {
      return <></>;
    }
    return <ClubDetailFormView {...props} />;
  }
}
