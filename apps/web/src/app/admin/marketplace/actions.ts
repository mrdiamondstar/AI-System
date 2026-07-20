"use server";

import { revalidatePath } from "next/cache";
import { reviewListing } from "@dstarix/marketplace";
import { requireRole } from "@/lib/session";

export async function reviewListingAction(
  listingId: string,
  decision: "PUBLISHED" | "REJECTED",
): Promise<{ ok: boolean }> {
  const moderator = await requireRole(["EDITOR", "MODERATOR", "ADMIN", "SUPERADMIN"]);
  if (!moderator) return { ok: false };
  try {
    await reviewListing(moderator.user.id, listingId, decision);
    revalidatePath("/admin/marketplace");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
