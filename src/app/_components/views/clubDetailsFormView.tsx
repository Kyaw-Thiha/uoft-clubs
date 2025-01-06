import type { ClubDetailsViewInterface } from "./interfaces";
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
import { imageSchema } from "@/server/lib/schema";
import { FileUpload } from "../ui/file-upload";
import { Button } from "../ui/button";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const formSchema = z.object({
  name: z
    .string()
    .min(1, {
      message: "Name must be at least 1 character.",
    })
    .max(255, {
      message: "Name must not be more than 255 characters",
    }),
  profileImage: imageSchema,
  campus: z.enum(["scarborough", "st george", "mississauga"]),
  description: z.string().min(1, {
    message: "Description must be at least 1 character",
  }),
});

export const ClubDetailFormView = (props: ClubDetailsViewInterface) => {
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

    // Revalidating paths for ISR
    // https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration#on-demand-revalidation-with-revalidatetag
    revalidatePaths();

    // Redirecting to details page
    redirect(`/clubs/${props.club?.id}`);
  }

  const revalidatePaths = () => {
    "use server";

    revalidatePath("/clubs/[id]");
    revalidatePath("/clubs/[id]/edit");
  };

  function handleProfileImageUpload(files: File[]) {
    const images = files ?? [];
    const image = images[0];
    const result = imageSchema.safeParse(image);

    if (image && result.success) {
      form.setValue("profileImage", image);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Profile Image */}
        <div className="mx-auto min-h-96 w-full max-w-4xl rounded-lg border border-dashed border-neutral-200 bg-white dark:border-neutral-800 dark:bg-black">
          <FileUpload onChange={handleProfileImageUpload} />
        </div>

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
};
