"use server";

import { redirect } from "next/navigation";
import { createCheckout } from "@dstarix/payments";
import { getSession } from "@/lib/session";

export async function startCheckoutAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");

  const plan = String(formData.get("plan") ?? "pro");
  const checkout = createCheckout(session.user.id, plan);
  redirect(checkout.url);
}
