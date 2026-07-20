import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortfolioForEdit } from "@dstarix/profiles";
import { getSession } from "@/lib/session";
import { PortfolioEditor } from "./portfolio-editor";

export const metadata: Metadata = {
  title: "Portfolio editor",
  robots: { index: false },
};

export default async function PortfolioPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const portfolio = await getPortfolioForEdit(session.user.id);
  const handle = (session.user as { handle?: string }).handle ?? null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
        {handle ? (
          <Link href={`/@${handle}`} className="text-sm font-medium text-brand">
            View public page →
          </Link>
        ) : null}
      </div>
      <p className="mb-8 mt-2 text-sm text-muted-foreground">
        Your public profile, showcasing projects and earned certificates.
      </p>
      <PortfolioEditor initialData={portfolio} handle={handle} />
    </main>
  );
}
