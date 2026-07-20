import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/account");

  return (
    <main className="mx-auto max-w-sm px-6 py-20">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mb-8 mt-2 text-sm text-muted-foreground">Sign in to your DStarix account.</p>
      <AuthForm mode="login" />
    </main>
  );
}
