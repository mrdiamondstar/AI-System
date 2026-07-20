"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createEntity,
  transitionEntity,
  updateEntity,
  type EntityInput,
  type EntityStatus,
} from "@dstarix/catalog";
import { isAppError } from "@dstarix/shared";
import { requireRole } from "@/lib/session";

export interface EntityFormState {
  status: "idle" | "error";
  message: string;
}

function readInput(formData: FormData): EntityInput {
  return {
    type: String(formData.get("type") ?? "TOOL") as EntityInput["type"],
    slug: String(formData.get("slug") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    tagline: String(formData.get("tagline") ?? "").trim(),
    summary: String(formData.get("summary") ?? "").trim(),
    websiteUrl: String(formData.get("websiteUrl") ?? "").trim(),
    affiliateUrl: String(formData.get("affiliateUrl") ?? "").trim(),
    pricingModel: String(formData.get("pricingModel") ?? "CONTACT") as EntityInput["pricingModel"],
    companyId: String(formData.get("companyId") ?? "").trim(),
    primaryCategoryId: String(formData.get("primaryCategoryId") ?? "").trim(),
  };
}

export async function saveEntityAction(
  _previous: EntityFormState,
  formData: FormData,
): Promise<EntityFormState> {
  const session = await requireRole(["EDITOR", "ADMIN", "SUPERADMIN"]);
  if (!session) return { status: "error", message: "Not authorized." };

  const id = String(formData.get("id") ?? "").trim();
  try {
    if (id) {
      await updateEntity(session.user.id, id, readInput(formData));
    } else {
      const created = await createEntity(session.user.id, readInput(formData));
      revalidatePath("/admin/entities");
      redirect(`/admin/entities/${created.id}`);
    }
  } catch (error) {
    if (isAppError(error)) return { status: "error", message: error.message };
    // Re-throw redirect() control-flow errors untouched.
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    return { status: "error", message: "Could not save. Check the fields and try again." };
  }
  revalidatePath("/admin/entities");
  return { status: "idle", message: "Saved." };
}

export async function transitionEntityAction(
  id: string,
  to: EntityStatus,
  slug: string,
): Promise<{ ok: boolean; message?: string }> {
  const session = await requireRole(["EDITOR", "ADMIN", "SUPERADMIN"]);
  if (!session) return { ok: false, message: "Not authorized." };

  try {
    await transitionEntity(session.user.id, id, to);
    revalidatePath("/admin/entities");
    revalidatePath(`/admin/entities/${id}`);
    if (to === "PUBLISHED") revalidatePath(`/tools/${slug}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, message: isAppError(error) ? error.message : "Transition failed." };
  }
}
