"use client";

import { useActionState } from "react";
import { Button, Input } from "@dstarix/ui";
import { subscribeAction, type NewsletterFormState } from "@/app/actions/newsletter";

const initialState: NewsletterFormState = { status: "idle", message: "" };

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribeAction, initialState);

  return (
    <form action={formAction} className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <Input
        id="newsletter-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        aria-describedby="newsletter-status"
        disabled={pending || state.status === "success"}
      />
      <Button type="submit" disabled={pending || state.status === "success"}>
        {pending ? "Subscribing…" : state.status === "success" ? "Subscribed ✓" : "Subscribe"}
      </Button>
      <p
        id="newsletter-status"
        role="status"
        aria-live="polite"
        className={`w-full text-left text-xs sm:col-span-2 ${
          state.status === "error" ? "text-[var(--ds-danger)]" : "text-muted-foreground"
        }`}
      >
        {state.message}
      </p>
    </form>
  );
}
