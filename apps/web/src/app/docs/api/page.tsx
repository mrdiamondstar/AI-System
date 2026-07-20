import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";

export const metadata: Metadata = {
  title: "API Reference",
  description:
    "The DStarix API gives programmatic access to the verified AI catalog, Decision Scores, and search.",
};

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/tools",
    description: "List top verified tools with Decision Scores. Optional ?limit= (max 100).",
  },
  {
    method: "GET",
    path: "/api/v1/tools/{slug}",
    description: "Full detail for a single tool: scores, factors, pricing, categories.",
  },
  {
    method: "GET",
    path: "/api/v1/search?q=",
    description: "Search the catalog by keyword and intent.",
  },
];

export default function ApiDocsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">DStarix API</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Programmatic access to the world&apos;s most trusted AI catalog. Create a key on your{" "}
        <Link href="/account/developer" className="font-medium text-brand">
          developer dashboard
        </Link>{" "}
        and authenticate every request with an <code>Authorization: Bearer</code> header. The full
        machine-readable spec is at{" "}
        <Link href="/api/v1/openapi.json" className="font-medium text-brand">
          /api/v1/openapi.json
        </Link>
        .
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Authentication</h2>
        <pre className="mt-3 overflow-x-auto rounded-[var(--ds-radius-md)] border border-border bg-surface p-4 text-sm">
          <code>{`curl ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://dstarix.com"}/api/v1/tools \\
  -H "Authorization: Bearer dsk_live_..."`}</code>
        </pre>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Endpoints</h2>
        <div className="mt-4 space-y-4">
          {endpoints.map((endpoint) => (
            <Card key={endpoint.path}>
              <CardHeader>
                <CardTitle className="font-mono text-sm">
                  <span className="mr-2 text-brand">{endpoint.method}</span>
                  {endpoint.path}
                </CardTitle>
              </CardHeader>
              <CardContent>{endpoint.description}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Rate limits</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Free plan: 1,000 requests/day. Pro and Enterprise plans raise this substantially. Requests
          beyond your quota return <code>429</code> with a <code>problem+json</code> body.
        </p>
      </section>
    </main>
  );
}
