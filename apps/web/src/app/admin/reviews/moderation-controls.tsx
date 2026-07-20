"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@dstarix/ui";
import { moderateReviewAction } from "@/app/actions/reviews";

export function ModerationControls({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function decide(decision: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      await moderateReviewAction(reviewId, decision);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={pending} onClick={() => decide("APPROVED")}>
        Approve
      </Button>
      <Button size="sm" variant="secondary" disabled={pending} onClick={() => decide("REJECTED")}>
        Reject
      </Button>
    </div>
  );
}
