import { prisma } from "@dstarix/db";
import { scopedLogger } from "@dstarix/shared";

const log = scopedLogger("analytics");

/**
 * First-party event taxonomy (doc 07 §6). Every KPI in doc 01 §3 maps to a
 * named event here — add the event before shipping the feature, never after.
 * No third-party trackers; no PII in meta (lint/review-enforced).
 */
export type AnalyticsEventName =
  | "page_view"
  | "search"
  | "search_zero_results"
  | "outbound_click"
  | "bookmark_added"
  | "bookmark_removed"
  | "newsletter_subscribed"
  | "signup_completed"
  | "comparison_view"
  | "decision_completed";

export interface RecordEventInput {
  name: AnalyticsEventName;
  path?: string;
  entityId?: string;
  userId?: string;
  meta?: Record<string, string | number | boolean>;
}

/**
 * Fire-and-forget event recording: analytics must never break or slow a
 * user-facing request. Failures are logged, not thrown.
 */
export function recordEvent(input: RecordEventInput): void {
  void prisma.analyticsEvent
    .create({
      data: {
        name: input.name,
        path: input.path,
        entityId: input.entityId,
        userId: input.userId,
        meta: input.meta ?? {},
      },
    })
    .catch((error) =>
      log.warn(
        { err: error, event: input.name, entityId: input.entityId },
        "analytics event dropped",
      ),
    );
}
