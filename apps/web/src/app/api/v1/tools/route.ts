import { getTopEntities } from "@dstarix/catalog";
import { authenticate, ok } from "../_lib";

/**
 * GET /api/v1/tools — list top verified tools with Decision Scores.
 * The catalog + Decision Score as a data product (doc 01 §Revenue: API).
 */
export async function GET(request: Request): Promise<Response> {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 20) || 20, 100);
  const entities = await getTopEntities(limit);

  return ok({
    data: entities.map((entity) => ({
      slug: entity.slug,
      name: entity.name,
      tagline: entity.tagline,
      type: entity.type,
      pricing_model: entity.pricingModel,
      company: entity.company?.name ?? null,
      decision_score: entity.score?.decisionScore ?? null,
      rating: entity.score ? Number(entity.score.ratingAvg) : null,
      url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://dstarix.com"}/tools/${entity.slug}`,
    })),
  });
}
