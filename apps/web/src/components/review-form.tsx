"use client";

import { useActionState } from "react";
import { Button, Input } from "@dstarix/ui";
import { submitReviewAction, type ReviewFormState } from "@/app/actions/reviews";

const initialState: ReviewFormState = { status: "idle", message: "" };

export function ReviewForm({
  entityId,
  entitySlug,
  entityName,
}: {
  entityId: string;
  entitySlug: string;
  entityName: string;
}) {
  const [state, formAction, pending] = useActionState(submitReviewAction, initialState);

  if (state.status === "success") {
    return (
      <p
        role="status"
        className="mt-4 rounded-[var(--ds-radius-md)] border border-border p-4 text-sm text-muted-foreground"
      >
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-4 flex max-w-xl flex-col gap-4">
      <input type="hidden" name="entityId" value={entityId} />
      <input type="hidden" name="entitySlug" value={entitySlug} />

      <fieldset>
        <legend className="mb-1 text-sm font-medium">Your rating</legend>
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5].map((value) => (
            <label key={value} className="flex cursor-pointer items-center gap-1 text-sm">
              <input
                type="radio"
                name="rating"
                value={value}
                required
                className="accent-[var(--ds-brand)]"
              />
              {value}★
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="review-title" className="mb-1 block text-sm font-medium">
          Title <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <Input id="review-title" name="title" maxLength={120} />
      </div>

      <div>
        <label htmlFor="review-body" className="mb-1 block text-sm font-medium">
          Your experience with {entityName}
        </label>
        <textarea
          id="review-body"
          name="body"
          required
          minLength={30}
          maxLength={5000}
          rows={4}
          className="w-full rounded-[var(--ds-radius-md)] border border-border bg-surface p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-brand)]"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          At least 30 characters. Reviews are moderated before publishing.
        </p>
      </div>

      {state.status === "error" ? (
        <p role="alert" className="text-sm text-[var(--ds-danger)]">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}
