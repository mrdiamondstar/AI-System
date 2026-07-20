import type { z } from "zod";
import {
  bookmarkCreatedV1,
  reviewApprovedV1,
  reviewSubmittedV1,
  toolPublishedV1,
  toolUpdatedV1,
  userRegisteredV1,
} from "./catalog";

/**
 * Domain event registry (doc 02 §5). Events are versioned immutable facts.
 * Adding an event = add its schema here; producers and consumers share these
 * types, and payloads are validated at publish AND consume time.
 */
export const eventSchemas = {
  "tool.published.v1": toolPublishedV1,
  "tool.updated.v1": toolUpdatedV1,
  "review.submitted.v1": reviewSubmittedV1,
  "review.approved.v1": reviewApprovedV1,
  "user.registered.v1": userRegisteredV1,
  "bookmark.created.v1": bookmarkCreatedV1,
} as const;

export type EventTopic = keyof typeof eventSchemas;
export type EventPayload<T extends EventTopic> = z.infer<(typeof eventSchemas)[T]>;

export interface DomainEvent<T extends EventTopic = EventTopic> {
  id: string;
  topic: T;
  payload: EventPayload<T>;
  occurredAt: Date;
}

/** Validate a payload against its topic schema; throws on mismatch. */
export function parseEventPayload<T extends EventTopic>(
  topic: T,
  payload: unknown,
): EventPayload<T> {
  return eventSchemas[topic].parse(payload) as EventPayload<T>;
}

export function isKnownTopic(topic: string): topic is EventTopic {
  return topic in eventSchemas;
}
