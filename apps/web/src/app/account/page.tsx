import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
      <p className="mt-6 text-sm text-muted-foreground">
        Bookmarks and collections arrive with the Phase 2 engagement release.
      </p>
    </main>
  );
}
