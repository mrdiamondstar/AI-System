"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@dstarix/ui";
import { toggleBookmarkAction } from "@/app/actions/bookmarks";

export function BookmarkButton({ entityId, entitySlug }: { entityId: string; entitySlug: string }) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(false);
  const [pending, startTransition] = useTransition();

  // Tool pages are ISR (static per-visitor); per-user state hydrates client-side.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/internal/bookmarks/${entityId}`)
      .then((response) => (response.ok ? response.json() : { bookmarked: false }))
      .then((data: { bookmarked: boolean }) => {
        if (!cancelled) setBookmarked(data.bookmarked);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [entityId]);

  function handleClick() {
    startTransition(async () => {
      const previous = bookmarked;
      setBookmarked(!previous); // optimistic
      const result = await toggleBookmarkAction(entityId, entitySlug);
      if (result.status === "unauthenticated") {
        setBookmarked(previous);
        router.push(`/login`);
        return;
      }
      if (result.status !== "ok") {
        setBookmarked(previous);
        return;
      }
      setBookmarked(result.bookmarked ?? !previous);
    });
  }

  return (
    <Button
      variant="secondary"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark this tool"}
    >
      {bookmarked ? "★ Bookmarked" : "☆ Bookmark"}
    </Button>
  );
}
