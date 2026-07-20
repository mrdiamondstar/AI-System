import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";
import { getSession } from "@/lib/session";
import { startCheckoutAction } from "./actions";

export const metadata: Metadata = {
  title: "Pricing — DStarix Pro",
  description: "Upgrade to DStarix Pro for the unlimited AI Advisor and premium content.",
};

const tiers = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    features: [
      "Full verified catalog",
      "Search & comparisons",
      "Bookmarks & collections",
      "Limited AI Advisor",
    ],
    plan: null,
  },
  {
    name: "Pro",
    price: "₹499",
    period: "/month",
    features: ["Everything in Free", "Unlimited AI Advisor", "Premium content", "Priority support"],
    plan: "pro" as const,
    highlight: true,
  },
];

export default async function PricingPage() {
  const session = await getSession();

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Simple, honest pricing</h1>
        <p className="mt-2 text-muted-foreground">
          Start free. Upgrade when the AI Advisor becomes part of your workflow.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-2xl gap-6 sm:grid-cols-2">
        {tiers.map((tier) => (
          <Card key={tier.name} className={tier.highlight ? "border-[var(--ds-brand)]" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{tier.name}</CardTitle>
                {tier.highlight ? <Badge variant="brand">Most popular</Badge> : null}
              </div>
              <p className="text-3xl font-semibold">
                {tier.price}
                <span className="text-sm font-normal text-muted-foreground">{tier.period}</span>
              </p>
            </CardHeader>
            <CardContent className="flex h-full flex-col">
              <ul className="flex-1 space-y-2">
                {tier.features.map((feature) => (
                  <li key={feature}>✓ {feature}</li>
                ))}
              </ul>
              <div className="mt-6">
                {tier.plan ? (
                  session ? (
                    <form action={startCheckoutAction}>
                      <input type="hidden" name="plan" value={tier.plan} />
                      <Button type="submit" className="w-full">
                        Upgrade to Pro
                      </Button>
                    </form>
                  ) : (
                    <Link href="/login">
                      <Button className="w-full">Sign in to upgrade</Button>
                    </Link>
                  )
                ) : (
                  <Button variant="secondary" className="w-full" disabled>
                    Current plan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
