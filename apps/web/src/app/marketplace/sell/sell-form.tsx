"use client";

import { useActionState } from "react";
import { Button, Input } from "@dstarix/ui";
import { createListingAction, type SellState } from "../actions";

const initial: SellState = { status: "idle", message: "" };

export function SellForm() {
  const [state, formAction, pending] = useActionState(createListingAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium">
          Title
        </label>
        <Input id="title" name="title" required minLength={4} maxLength={120} />
      </div>
      <div>
        <label htmlFor="type" className="mb-1 block text-sm font-medium">
          Type
        </label>
        <select
          id="type"
          name="type"
          className="h-10 w-full rounded-[var(--ds-radius-md)] border border-border bg-surface px-3 text-sm"
        >
          <option value="PROMPT">Prompt</option>
          <option value="TEMPLATE">Template</option>
          <option value="AGENT">Agent</option>
        </select>
      </div>
      <div>
        <label htmlFor="price" className="mb-1 block text-sm font-medium">
          Price (USD) — 0 for free
        </label>
        <Input
          id="price"
          name="price"
          type="number"
          min={0}
          max={10000}
          step="0.01"
          defaultValue={0}
        />
      </div>
      <div>
        <label htmlFor="summary" className="mb-1 block text-sm font-medium">
          Description
        </label>
        <textarea
          id="summary"
          name="summary"
          required
          minLength={20}
          maxLength={2000}
          rows={4}
          className="w-full rounded-[var(--ds-radius-md)] border border-border bg-surface p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-brand)]"
        />
      </div>
      <div>
        <label htmlFor="deliverable" className="mb-1 block text-sm font-medium">
          Deliverable{" "}
          <span className="font-normal text-muted-foreground">(released after purchase)</span>
        </label>
        <textarea
          id="deliverable"
          name="deliverable"
          maxLength={20000}
          rows={4}
          className="w-full rounded-[var(--ds-radius-md)] border border-border bg-surface p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-brand)]"
        />
      </div>
      {state.status === "error" ? (
        <p role="alert" className="text-sm text-[var(--ds-danger)]">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Submitting…" : "Submit for review"}
      </Button>
    </form>
  );
}
