import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { listPurchases } from "@dstarix/marketplace";
import { Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Your purchases",
  robots: { index: false },
};

export default async function PurchasesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const purchases = await listPurchases(session.user.id);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Your purchases</h1>
      {purchases.length > 0 ? (
        <ul className="mt-8 space-y-4">
          {purchases.map((order) => (
            <li key={order.id}>
              <Card>
                <CardHeader>
                  <CardTitle>{order.listing.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Purchased {order.paidAt?.toLocaleDateString("en-US", { dateStyle: "medium" })}
                  </p>
                </CardHeader>
                {order.listing.deliverableText ? (
                  <CardContent>
                    <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Deliverable
                    </h2>
                    <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-[var(--ds-radius-md)] border border-border bg-surface p-3 text-sm">
                      {order.listing.deliverableText}
                    </pre>
                  </CardContent>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">No purchases yet.</p>
      )}
    </main>
  );
}
