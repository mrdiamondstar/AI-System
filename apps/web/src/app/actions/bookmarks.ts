"use server";

import { revalidatePath } from "next/cache";
import { toggleBookmark } from "@dstarix/engagement";
import { getSession } from "@/lib/session";

export interface BookmarkActionResult {
  status: "ok" | "unauthenticated" | "error";
  bookmarked?: boolean;
}

export async function toggleBookmarkAction(
  entityId: string,
  entitySlug: string,
): Promise<BookmarkActionResult> {
  const session = await getSession();
  if (!session) return { status: "unauthenticated" };

  try {
    const result = await toggleBookmark(session.user.id, entityId);
    revalidatePath(`/tools/${entitySlug}`);
    revalidatePath("/account");
    return { status: "ok", bookmarked: result.bookmarked };
  } catch {
    return { status: "error" };
  }
}
