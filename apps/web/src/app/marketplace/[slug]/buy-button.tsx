"use client";

import { useState, useTransition } from "react";
import { Button } from "@dstarix/ui";
import { buyAction } from "../actions";

export function BuyButton({ slug, isFree }: { slug: string; isFree: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mt-3">
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await buyAction(slug);
            if (result?.error) setError(result.error);
          })
        }
      >
        {pending ? "Processing…" : isFree ? "Get it free" : "Buy now"}
      </Button>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-[var(--ds-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
