import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { listApiKeys } from "@dstarix/apikeys";
import { getSession } from "@/lib/session";
import { KeyManager } from "./key-manager";

export const metadata: Metadata = {
  title: "Developer — API keys",
  robots: { index: false },
};

export default async function DeveloperPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const keys = await listApiKeys(session.user.id);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Developer</h1>
      <p className="mb-8 mt-2 text-sm text-muted-foreground">
        Use the DStarix API to access the verified catalog and Decision Scores. See the{" "}
        <Link href="/docs/api" className="font-medium text-brand">
          API reference
        </Link>
        . Authenticate with <code>Authorization: Bearer &lt;key&gt;</code>.
      </p>
      <KeyManager keys={keys} />
    </main>
  );
}
