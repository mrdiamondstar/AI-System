import Link from "next/link";
import { listAdminEntities } from "@dstarix/catalog";
import { listPendingReviews } from "@dstarix/engagement";
import { Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";

export default async function AdminDashboard() {
  const [all, pendingReviews] = await Promise.all([listAdminEntities(), listPendingReviews()]);
  const published = all.filter((entity) => entity.status === "PUBLISHED").length;
  const inReview = all.filter((entity) => entity.status === "IN_REVIEW").length;
  const drafts = all.filter((entity) => entity.status === "DRAFT").length;

  const stats = [
    { label: "Published entities", value: published, href: "/admin/entities" },
    { label: "In editorial review", value: inReview, href: "/admin/entities?status=IN_REVIEW" },
    { label: "Drafts", value: drafts, href: "/admin/entities?status=DRAFT" },
    { label: "Reviews to moderate", value: pendingReviews.length, href: "/admin/reviews" },
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="group block">
            <Card className="group-hover:shadow-[var(--ds-shadow-md)]">
              <CardHeader>
                <CardTitle className="text-3xl">{stat.value}</CardTitle>
              </CardHeader>
              <CardContent>{stat.label}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
