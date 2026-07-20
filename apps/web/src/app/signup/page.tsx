import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false },
};

export default async function SignupPage() {
  const session = await getSession();
  if (session) redirect("/account");

  return (
    <main className="mx-auto max-w-sm px-6 py-20">
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mb-8 mt-2 text-sm text-muted-foreground">
        Bookmark tools, build collections, and get personalized recommendations.
      </p>
      <AuthForm mode="signup" />
    </main>
  );
}
