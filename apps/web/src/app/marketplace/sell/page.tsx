import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SellForm } from "./sell-form";

export const metadata: Metadata = {
  title: "Sell on DStarix",
  robots: { index: false },
};

export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { submitted } = await searchParams;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Sell on DStarix</h1>
      <p className="mb-8 mt-2 text-sm text-muted-foreground">
        List an AI agent, prompt, or template. Submissions are reviewed by our editors before going
        live — the same trust bar as our catalog.
      </p>
      {submitted ? (
        <p
          role="status"
          className="rounded-[var(--ds-radius-md)] border border-border p-4 text-sm text-muted-foreground"
        >
          Thanks — your listing is in review. You&apos;ll see it published once approved.
        </p>
      ) : (
        <SellForm />
      )}
    </main>
  );
}
