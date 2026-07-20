import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { listBookmarks } from "@dstarix/engagement";
import { Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";
import { SignOutButton } from "@/components/sign-out-button";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false },
};

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const bookmarks = await listBookmarks(session.user.id);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Your account</h1>
        <SignOutButton />
      </div>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p>
            <span className="text-foreground">{session.user.name}</span>
          </p>
          <p>{session.user.email}</p>
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
