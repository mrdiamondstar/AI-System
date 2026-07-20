import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  return (
    <main className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        {q ? `Results for “${q}”` : "Search"}
      </h1>
      <p className="mt-4 text-muted-foreground">
        The AI Discovery Engine ships with Phase 1 — semantic search over a verified catalog.
      </p>
      <Link href="/" className="mt-8 inline-block text-sm font-medium text-brand">
        ← Back to home
      </Link>
    </main>
  );
}
