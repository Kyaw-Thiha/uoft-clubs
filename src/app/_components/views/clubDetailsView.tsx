import type { AppRouter } from "@/server/api/root";
import type { inferRouterOutputs } from "@trpc/server";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/_components/ui/form";
import { Input } from "@/app/_components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { api } from "@/trpc/react";
import { Textarea } from "../ui/textarea";

// https://trpc.io/docs/client/vanilla/infer-types
type Club = inferRouterOutputs<AppRouter>["club"]["get"];

interface ClubDetailsViewInterface {
  role: "public" | "collaborator" | "owner";
  mode: "view" | "edit";
  club?: Club;
}

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
    return ClubDetailForm;
  }
}

const formSchema = z.object({
  name: z
    .string()
    .min(1, {
      message: "Name must be at least 1 character.",
    })
    .max(255, {
      message: "Name must not be more than 255 characters",
    }),
  profileImage: z.string().min(1).max(255),
  campus: z.enum(["scarborough", "st george", "mississauga"]),
  description: z.string().min(1, {
    message: "Description must be at least 1 character",
  }),
});

function ClubDetailForm(props: ClubDetailsViewInterface) {
  const utils = api.useUtils();
  const createClub = api.club.create.useMutation({
    onSuccess: async () => {
      await utils.club.invalidate();
    },
  });
  const editClub = api.club.edit.useMutation({
    onSuccess: async () => {
      await utils.club.invalidate();
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: props.club?.name ?? "",
    },
  });
  function onSubmit(values: z.infer<typeof formSchema>) {
    if (props.club) {
      const payload = { id: props.club?.id, ...values };
      editClub.mutate(payload);
    } else {
      createClub.mutate(values);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="AMACCS"
                  disabled={editClub.isPending || createClub.isPending}
                  {...field}
                />
              </FormControl>
              <FormDescription>This is your club display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Campus */}
        <FormField
          control={form.control}
          name="campus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campus</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={editClub.isPending || createClub.isPending}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Campus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scarborough">Scarborough</SelectItem>
                    <SelectItem value="st george">St George</SelectItem>
                    <SelectItem value="mississauga">Mississauga</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                Choose the main campus of your club. Your events can be on
                different campus.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little bit about your club"
                  disabled={editClub.isPending || createClub.isPending}
                  {...field}
                />
              </FormControl>
              <FormDescription>This is your club display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={editClub.isPending || createClub.isPending}
        >
          Submit
        </Button>
      </form>
    </Form>
  );
}
