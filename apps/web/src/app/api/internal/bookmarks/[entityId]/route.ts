import { isBookmarked } from "@dstarix/engagement";
import { getSession } from "@/lib/session";

/**
 * Bookmark state for the client island on statically-rendered tool pages
 * (ISR pages can't render per-user state; the button hydrates it from here).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entityId: string }> },
): Promise<Response> {
  const session = await getSession();
  if (!session) return Response.json({ bookmarked: false });

  const { entityId } = await params;
  const bookmarked = await isBookmarked(session.user.id, entityId);
  return Response.json({ bookmarked }, { headers: { "Cache-Control": "no-store" } });
}
