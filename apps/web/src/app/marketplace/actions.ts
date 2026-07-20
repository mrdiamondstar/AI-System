"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { beginPurchase, createListing, type ListingInput } from "@dstarix/marketplace";
import { isAppError } from "@dstarix/shared";
import { getSession } from "@/lib/session";

export async function buyAction(slug: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) redirect("/login");
  try {
    const checkout = await beginPurchase(session.user.id, slug);
    redirect(checkout.url);
  } catch (error) {
    if (isAppError(error)) return { error: error.message };
    throw error;
  }
}

export interface SellState {
  status: "idle" | "error";
  message: string;
}

export async function createListingAction(
  _previous: SellState,
  formData: FormData,
): Promise<SellState> {
  const session = await getSession();
  if (!session) return { status: "error", message: "Please sign in to sell." };

  const input: ListingInput = {
    title: String(formData.get("title") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    type: String(formData.get("type") ?? "PROMPT") as ListingInput["type"],
    priceMinor: Math.round(Number(formData.get("price") ?? 0) * 100),
    deliverableText: String(formData.get("deliverable") ?? "") || undefined,
  };

  try {
    await createListing(session.user.id, input);
    revalidatePath("/account");
  } catch (error) {
    if (isAppError(error)) return { status: "error", message: error.message };
    return { status: "error", message: "Could not create listing." };
  }
  redirect("/marketplace/sell?submitted=1");
}
