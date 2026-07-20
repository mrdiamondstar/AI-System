import { z } from "zod";

/** Payload schemas for catalog domain events (event catalog: doc 02 §5). */

export const toolPublishedV1 = z.object({
  entityId: z.string().uuid(),
  slug: z.string(),
  type: z.enum(["TOOL", "AGENT", "MODEL", "API", "MCP_SERVER"]),
});

export const toolUpdatedV1 = z.object({
  entityId: z.string().uuid(),
  slug: z.string(),
  changedFields: z.array(z.string()),
});

export const reviewSubmittedV1 = z.object({
  reviewId: z.string().uuid(),
  entityId: z.string().uuid(),
  userId: z.string().uuid(),
});

export const reviewApprovedV1 = z.object({
  reviewId: z.string().uuid(),
  entityId: z.string().uuid(),
});

export const userRegisteredV1 = z.object({
  userId: z.string().uuid(),
});

export const bookmarkCreatedV1 = z.object({
  userId: z.string().uuid(),
  entityId: z.string().uuid(),
});
