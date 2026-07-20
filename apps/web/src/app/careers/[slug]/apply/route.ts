import { recordEvent } from "@dstarix/analytics";
import { getJobBySlug } from "@dstarix/jobs";

/**
 * Tracked apply redirect: records the application intent, then forwards to the
 * external apply URL. Direct in-platform applications land in Phase 4.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  const fallback = new URL("/careers", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
  if (!job) return Response.redirect(fallback, 302);

  recordEvent({
    name: "outbound_click",
    path: `/careers/${slug}/apply`,
    meta: { kind: "job_apply" },
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: job.applyUrl,
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "no-store",
    },
  });
}
