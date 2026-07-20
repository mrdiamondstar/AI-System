import { searchEntities } from "@dstarix/catalog";
import { authenticate, ok, problem } from "../_lib";

/** GET /api/v1/search?q= — semantic+keyword search over the verified catalog. */
export async function GET(request: Request): Promise<Response> {
  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  if (!query.trim()) return problem(422, "validation_failed", "Query parameter 'q' is required.");

  const results = await searchEntities(query, 20);
  return ok({
    query,
    data: results.map((result) => ({
      slug: result.slug,
      name: result.name,
      tagline: result.tagline,
      decision_score: result.decisionScore,
    })),
  });
}
