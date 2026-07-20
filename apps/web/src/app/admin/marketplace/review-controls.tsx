"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@dstarix/ui";
import { reviewListingAction } from "./actions";

export function ReviewControls({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function decide(decision: "PUBLISHED" | "REJECTED") {
    startTransition(async () => {
      await reviewListingAction(listingId, decision);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={pending} onClick={() => decide("PUBLISHED")}>
        Publish
      </Button>
      <Button size="sm" variant="secondary" disabled={pending} onClick={() => decide("REJECTED")}>
        Reject
      </Button>
    </div>
  );
}
