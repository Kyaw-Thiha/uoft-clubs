"use server";

import { revalidatePath } from "next/cache";

export async function revalidatePaths() {
  revalidatePath("/clubs/[id]");
  revalidatePath("/clubs/[id]/edit");
}
