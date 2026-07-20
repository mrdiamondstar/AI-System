"use server";

import { subscribeToNewsletter } from "@dstarix/growth";
import { isAppError, scopedLogger } from "@dstarix/shared";

const log = scopedLogger("newsletter-action");

export interface NewsletterFormState {
  status: "idle" | "success" | "already" | "error";
  message: string;
}

export async function subscribeAction(
  _previous: NewsletterFormState,
  formData: FormData,
): Promise<NewsletterFormState> {
  const email = formData.get("email");
  if (typeof email !== "string") {
    return { status: "error", message: "Please enter your email address." };
  }

  try {
    const result = await subscribeToNewsletter(email, "homepage");
    if (result.status === "already_subscribed") {
      return { status: "already", message: "You're already on the list — see you Thursday." };
    }
    return { status: "success", message: "Subscribed. Welcome to DStarix." };
  } catch (error) {
    if (isAppError(error) && error.code === "validation_failed") {
      return { status: "error", message: error.message };
    }
    log.error({ err: error }, "newsletter subscription failed");
    return { status: "error", message: "Something went wrong on our side — please try again." };
  }
}
