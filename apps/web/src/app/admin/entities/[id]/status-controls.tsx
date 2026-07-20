"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EntityStatus } from "@dstarix/catalog";
import { Button } from "@dstarix/ui";
import { transitionEntityAction } from "../actions";

// Mirrors the server-side state machine (catalog/admin.ts) so the UI only
// offers valid transitions; the server re-validates regardless.
const NEXT: Record<string, Array<{ to: EntityStatus; label: string }>> = {
  DRAFT: [{ to: "IN_REVIEW", label: "Submit for review" }],
  IN_REVIEW: [
    { to: "PUBLISHED", label: "Publish" },
    { to: "DRAFT", label: "Back to draft" },
  ],
  PUBLISHED: [{ to: "ARCHIVED", label: "Archive" }],
  ARCHIVED: [{ to: "DRAFT", label: "Restore to draft" }],
};

export function StatusControls({
  id,
  status,
  slug,
}: {
  id: string;
  status: EntityStatus;
  slug: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const actions = NEXT[status] ?? [];

  function run(to: EntityStatus) {
    setError(null);
    startTransition(async () => {
      const result = await transitionEntityAction(id, to, slug);
      if (!result.ok) {
        setError(result.message ?? "Failed.");
        return;
      }
      router.refresh();
    });
  }

  if (actions.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {actions.map((action) => (
        <Button
          key={action.to}
          size="sm"
          variant={action.to === "PUBLISHED" ? "primary" : "secondary"}
          disabled={pending}
          onClick={() => run(action.to)}
        >
          {action.label}
        </Button>
      ))}
      {error ? <span className="text-sm text-[var(--ds-danger)]">{error}</span> : null}
    </div>
  );
}
