import Link from "next/link";
import type { EntityCard as EntityCardData } from "@dstarix/catalog";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@dstarix/ui";

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
      <Card className="h-full group-hover:shadow-[var(--ds-shadow-md)]">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="group-hover:text-brand">{entity.name}</CardTitle>
            {entity.score ? <DecisionScore value={entity.score.decisionScore} /> : null}
          </div>
          {entity.company ? (
            <p className="text-xs text-muted-foreground">by {entity.company.name}</p>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="line-clamp-2">{entity.tagline ?? ""}</p>
          <div className="flex flex-wrap items-center gap-2">
            {category ? <Badge variant="brand">{category.name}</Badge> : null}
            <Badge>{pricingLabels[entity.pricingModel] ?? entity.pricingModel}</Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

/** Decision Score chip — transparent trust signal on every card (doc 07 §1). */
export function DecisionScore({ value }: { value: number }) {
  return (
    <span
      title={`DStarix Decision Score: ${value}/100`}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--ds-brand-soft)] text-sm font-semibold text-brand"
    >
      {value}
    </span>
  );
}
