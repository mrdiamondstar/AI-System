"use server";

import { revalidatePath } from "next/cache";
import { moderateReview, submitReview } from "@dstarix/engagement";
import { isAppError } from "@dstarix/shared";
import { getSession, requireRole } from "@/lib/session";

export interface ReviewFormState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function submitReviewAction(
  _previous: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  const session = await getSession();
  if (!session) {
    return { status: "error", message: "Please sign in to write a review." };
  }

  const entityId = String(formData.get("entityId") ?? "");
  const entitySlug = String(formData.get("entitySlug") ?? "");
  const rating = Number(formData.get("rating"));
  const title = String(formData.get("title") ?? "").trim() || undefined;
  const body = String(formData.get("body") ?? "");

  try {
    await submitReview(session.user.id, entityId, { rating, title, body });
    revalidatePath(`/tools/${entitySlug}`);
    return {
      status: "success",
      message: "Thanks — your review is in editorial moderation and will appear once approved.",
    };
  } catch (error) {
    if (isAppError(error)) return { status: "error", message: error.message };
    return { status: "error", message: "Could not submit your review — please try again." };
  }
}

export async function moderateReviewAction(
  reviewId: string,
  decision: "APPROVED" | "REJECTED",
): Promise<{ ok: boolean }> {
  const moderator = await requireRole(["EDITOR", "MODERATOR", "ADMIN", "SUPERADMIN"]);
  if (!moderator) return { ok: false };

  try {
    await moderateReview(moderator.user.id, reviewId, decision);
    revalidatePath("/admin/reviews");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
