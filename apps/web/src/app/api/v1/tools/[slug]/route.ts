import { getEntityBySlug } from "@dstarix/catalog";
import { authenticate, ok, problem } from "../../_lib";

/** GET /api/v1/tools/{slug} — full detail for a single verified tool. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const { slug } = await params;
  const entity = await getEntityBySlug(slug);
  if (!entity) return problem(404, "not_found", `Tool '${slug}' not found.`);

  return ok({
    data: {
      slug: entity.slug,
      name: entity.name,
      tagline: entity.tagline,
      summary: entity.summary,
      type: entity.type,
      pricing_model: entity.pricingModel,
      company: entity.company?.name ?? null,
      decision_score: entity.score?.decisionScore ?? null,
      score_factors: entity.score?.factors ?? null,
      rating: entity.score ? Number(entity.score.ratingAvg) : null,
      rating_count: entity.score?.ratingCount ?? 0,
      categories: entity.categories.map((c) => c.category.name),
      pricing: entity.pricingPlans.map((plan) => ({
        name: plan.name,
        price_minor: plan.priceMinor,
        currency: plan.currency,
        billing_period: plan.billingPeriod,
      })),
      last_verified_at: entity.lastVerifiedAt,
    },
  });
}
