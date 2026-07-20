import Link from "next/link";
import { listAdminEntities, type EntityStatus } from "@dstarix/catalog";
import { Badge, Button, Card } from "@dstarix/ui";

const statusVariant: Record<string, "neutral" | "brand" | "success"> = {
  DRAFT: "neutral",
  IN_REVIEW: "brand",
  PUBLISHED: "success",
  ARCHIVED: "neutral",
};

const filters: Array<{ label: string; value?: EntityStatus }> = [
  { label: "All" },
  { label: "Draft", value: "DRAFT" },
  { label: "In review", value: "IN_REVIEW" },
  { label: "Published", value: "PUBLISHED" },
];

export default async function AdminEntitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filterStatus = status as EntityStatus | undefined;
  const entities = await listAdminEntities(filterStatus);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Entities</h1>
        <Link href="/admin/entities/new">
          <Button>New entity</Button>
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            key={filter.label}
            href={filter.value ? `/admin/entities?status=${filter.value}` : "/admin/entities"}
            className={`rounded-full px-3 py-1 text-sm ${
              filterStatus === filter.value || (!filterStatus && !filter.value)
                ? "bg-[var(--ds-brand-soft)] text-brand"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {entities.map((entity) => (
                <tr key={entity.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/entities/${entity.id}`}
                      className="font-medium hover:text-brand"
                    >
                      {entity.name}
                    </Link>
                    {entity.aiGenerated ? (
                      <span className="ml-2 text-xs text-muted-foreground">AI draft</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{entity.type}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[entity.status]}>{entity.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {entity.score?.decisionScore ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {entity.updatedAt.toLocaleDateString("en-US")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {entities.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No entities in this view.</p>
        ) : null}
      </Card>
    </main>
  );
}
