import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { listBookmarks } from "@dstarix/engagement";
import { getActiveSubscription } from "@dstarix/payments";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";
import { SignOutButton } from "@/components/sign-out-button";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false },
};

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [bookmarks, subscription] = await Promise.all([
    listBookmarks(session.user.id),
    getActiveSubscription(session.user.id),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Your account</h1>
        <SignOutButton />
      </div>
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Profile</CardTitle>
            {subscription ? (
              <Badge variant="brand">DStarix Pro</Badge>
            ) : (
              <Link href="/pricing" className="text-sm font-medium text-brand">
                Upgrade to Pro →
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <p>
            <span className="text-foreground">{session.user.name}</span>
          </p>
          <p>{session.user.email}</p>
          {subscription?.currentPeriodEnd ? (
            <p className="text-xs">
              Pro renews {subscription.currentPeriodEnd.toLocaleDateString("en-US")}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-sm font-medium text-brand">
            <Link href="/account/developer">API keys →</Link>
            <Link href="/account/resume">Resume builder →</Link>
            <Link href="/account/portfolio">Portfolio →</Link>
            <Link href="/account/purchases">Purchases →</Link>
          </div>
        </CardContent>
      </Card>
      <section aria-labelledby="bookmarks-heading" className="mt-10">
        <h2 id="bookmarks-heading" className="text-lg font-semibold">
          Bookmarks
        </h2>
        {bookmarks.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {bookmarks.map((bookmark) => (
              <li key={bookmark.entityId}>
                <Link href={`/tools/${bookmark.entity.slug}`} className="group block">
                  <Card className="group-hover:shadow-[var(--ds-shadow-md)]">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle className="group-hover:text-brand">
                          {bookmark.entity.name}
                        </CardTitle>
                        {bookmark.entity.score ? (
                          <span className="text-sm font-semibold text-brand">
                            {bookmark.entity.score.decisionScore}
                          </span>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent>{bookmark.entity.tagline}</CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No bookmarks yet — hit ☆ on any tool page to save it here.
          </p>
        )}
      </section>
    </main>
  );
}
