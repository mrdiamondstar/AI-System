import { prisma, type EntityStatus, type EntityType, type PricingModel } from "@dstarix/db";
import { AppError } from "@dstarix/shared";
import { z } from "zod";

/**
 * Catalog admin mutations (doc 07 §9). Separate from the public read layer:
 * these see all statuses, enforce the publish state machine, and audit-log
 * every transition. Callers must already be authorized (role gate lives in
 * the app layer).
 */

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const entityInput = z.object({
  type: z.enum(["TOOL", "AGENT", "MODEL", "API", "MCP_SERVER"]),
  slug: z.string().regex(slugPattern, "Use lowercase words separated by hyphens.").max(80),
  name: z.string().trim().min(1).max(120),
  tagline: z.string().trim().max(200).optional(),
  summary: z.string().trim().max(5000).optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  affiliateUrl: z.string().url().optional().or(z.literal("")),
  pricingModel: z.enum(["FREE", "FREEMIUM", "PAID", "OPEN_SOURCE", "CONTACT"]),
  companyId: z.string().uuid().optional().or(z.literal("")),
  primaryCategoryId: z.string().uuid(),
});

export type EntityInput = z.infer<typeof entityInput>;

// Allowed status transitions (doc 06 §6: no ai_draft -> published shortcut).
const TRANSITIONS: Record<EntityStatus, EntityStatus[]> = {
  DRAFT: ["IN_REVIEW", "ARCHIVED"],
  IN_REVIEW: ["PUBLISHED", "DRAFT", "ARCHIVED"],
  PUBLISHED: ["ARCHIVED", "IN_REVIEW"],
  ARCHIVED: ["DRAFT"],
};

export async function listAdminEntities(status?: EntityStatus) {
  return prisma.entity.findMany({
    where: { deletedAt: null, ...(status ? { status } : {}) },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      slug: true,
      name: true,
      type: true,
      status: true,
      aiGenerated: true,
      updatedAt: true,
      company: { select: { name: true } },
      score: { select: { decisionScore: true } },
    },
  });
}

export async function getAdminEntity(id: string) {
  return prisma.entity.findUnique({
    where: { id },
    include: { categories: { select: { categoryId: true, isPrimary: true } } },
  });
}

export async function listCompaniesLite() {
  return prisma.company.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function listCategoriesLite() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

function normalize(input: EntityInput) {
  return {
    type: input.type as EntityType,
    slug: input.slug,
    name: input.name,
    tagline: input.tagline || null,
    summary: input.summary || null,
    websiteUrl: input.websiteUrl || null,
    affiliateUrl: input.affiliateUrl || null,
    pricingModel: input.pricingModel as PricingModel,
    companyId: input.companyId || null,
  };
}

export async function createEntity(actorId: string, raw: EntityInput) {
  const input = entityInput.parse(raw);
  const existing = await prisma.entity.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  });
  if (existing)
    throw new AppError("conflict", `An entity with slug '${input.slug}' already exists.`);

  const entity = await prisma.entity.create({
    data: {
      ...normalize(input),
      status: "DRAFT",
      categories: { create: [{ categoryId: input.primaryCategoryId, isPrimary: true }] },
      score: { create: {} },
    },
  });
  await audit(actorId, "entity.create", entity.id, null, { slug: entity.slug });
  return entity;
}

export async function updateEntity(actorId: string, id: string, raw: EntityInput) {
  const input = entityInput.parse(raw);
  const before = await prisma.entity.findUnique({ where: { id }, select: { slug: true } });
  if (!before) throw AppError.notFound("Entity", id);

  // Slug change → record a 301 redirect (doc 03 §4).
  if (before.slug !== input.slug) {
    await prisma.slugRedirect.upsert({
      where: { entityKind_fromSlug: { entityKind: "entities", fromSlug: before.slug } },
      update: { toSlug: input.slug },
      create: { entityKind: "entities", fromSlug: before.slug, toSlug: input.slug },
    });
  }

  await prisma.$transaction([
    prisma.entity.update({ where: { id }, data: normalize(input) }),
    prisma.entityCategory.deleteMany({ where: { entityId: id } }),
    prisma.entityCategory.create({
      data: { entityId: id, categoryId: input.primaryCategoryId, isPrimary: true },
    }),
  ]);
  await audit(actorId, "entity.update", id, { slug: before.slug }, { slug: input.slug });
}

export async function transitionEntity(actorId: string, id: string, to: EntityStatus) {
  const entity = await prisma.entity.findUnique({ where: { id }, select: { status: true } });
  if (!entity) throw AppError.notFound("Entity", id);

  if (!TRANSITIONS[entity.status].includes(to)) {
    throw new AppError("conflict", `Cannot move ${entity.status} → ${to}.`);
  }

  await prisma.$transaction([
    prisma.entity.update({
      where: { id },
      data: {
        status: to,
        ...(to === "PUBLISHED" ? { publishedAt: new Date(), lastVerifiedAt: new Date() } : {}),
      },
    }),
    prisma.outboxEvent.create({
      data: {
        topic: to === "PUBLISHED" ? "tool.published.v1" : "tool.updated.v1",
        payload: { entityId: id },
      },
    }),
  ]);
  await audit(actorId, `entity.${to.toLowerCase()}`, id, { status: entity.status }, { status: to });
}

function audit(
  actorId: string,
  action: string,
  resourceId: string,
  before: unknown,
  after: unknown,
) {
  return prisma.auditLog.create({
    data: {
      actorId,
      action,
      resource: "entity",
      resourceId,
      before: before as never,
      after: after as never,
    },
  });
}
