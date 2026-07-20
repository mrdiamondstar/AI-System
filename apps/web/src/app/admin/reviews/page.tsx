import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { listPendingReviews } from "@dstarix/engagement";
import { Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";
import { requireRole } from "@/lib/session";
import { ModerationControls } from "./moderation-controls";

export const metadata: Metadata = {
  title: "Review moderation",
  robots: { index: false },
};

/**
 * Moderation queue v1 (doc 07 §9). Lives in the web app until apps/admin is
 * broken out; role-gated server-side, every decision audit-logged.
 */
export default async function AdminReviewsPage() {
  const session = await requireRole(["EDITOR", "MODERATOR", "ADMIN", "SUPERADMIN"]);
  if (!session) redirect("/login");

  const pending = await listPendingReviews();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Review moderation</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {pending.length} review{pending.length === 1 ? "" : "s"} awaiting a decision.
      </p>

      <ul className="mt-8 space-y-4">
        {pending.map((review) => (
          <li key={review.id}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-sm">
                    {review.entity.name} — {review.rating}★
                    {review.title ? ` · ${review.title}` : ""}
                  </CardTitle>
                  <ModerationControls reviewId={review.id} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {review.user.name ?? review.user.email} ·{" "}
                  {review.createdAt.toLocaleString("en-US")}
                </p>
              </CardHeader>
              <CardContent>{review.body}</CardContent>
            </Card>
          </li>
        ))}
      </ul>
      {pending.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">Queue is clear. 🎉</p>
      ) : null}
    </main>
  );
}
