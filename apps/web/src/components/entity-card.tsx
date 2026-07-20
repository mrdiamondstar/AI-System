import Link from "next/link";
import type { EntityCard as EntityCardData } from "@dstarix/catalog";
import { Badge, Card, CardContent, CardHeader, CardTitle, ScoreRing } from "@dstarix/ui";

const pricingLabels: Record<string, string> = {
  FREE: "Free",
  FREEMIUM: "Freemium",
  PAID: "Paid",
  OPEN_SOURCE: "Open source",
  CONTACT: "Custom pricing",
};

export function EntityCard({ entity }: { entity: EntityCardData }) {
  const category = entity.categories[0]?.category;
  return (
    <Link href={`/tools/${entity.slug}`} className="group block h-full">
      <Card interactive className="h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="truncate group-hover:text-brand">{entity.name}</CardTitle>
              {entity.company ? (
                <p className="mt-0.5 truncate text-xs text-[var(--ds-muted-foreground)]">
                  by {entity.company.name}
                </p>
              ) : null}
            </div>
            {entity.score ? <ScoreRing value={entity.score.decisionScore} /> : null}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="line-clamp-2 min-h-[2.5rem]">{entity.tagline ?? ""}</p>
          <div className="flex flex-wrap items-center gap-2">
            {category ? <Badge variant="brand">{category.name}</Badge> : null}
            <Badge>{pricingLabels[entity.pricingModel] ?? entity.pricingModel}</Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/** Decision Score gauge — re-exported for pages that show it standalone. */
export function DecisionScore({ value }: { value: number }) {
  return <ScoreRing value={value} />;
}
