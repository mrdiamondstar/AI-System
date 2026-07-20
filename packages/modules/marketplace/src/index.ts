import { recordEvent } from "@dstarix/analytics";
import { prisma, type MarketplaceListingType } from "@dstarix/db";
import { AppError, scopedLogger } from "@dstarix/shared";
import { z } from "zod";

const log = scopedLogger("marketplace");

/**
 * Build-time DB guard (mirrors @dstarix/catalog): read paths that can be
 * statically prerendered degrade to empty results when DATABASE_URL is absent
 * (CI/cold builds), instead of failing the build. Production always has a DB.
 */
async function withDatabase<T>(fallback: T, query: () => Promise<T>): Promise<T> {
  if (!process.env.DATABASE_URL) return fallback;
  return query();
}

/**
 * Marketplace (doc 07 §2). Trust machinery mirrors the catalog: listings are
 * created as DRAFT and must pass editorial review before PUBLISHED. Purchases
 * post a balanced double-entry ledger — the money truth — and only then
 * release the deliverable. Provider-agnostic (ADR-011); mock provider drives
 * the flow until real payout rails exist.
 */

const PLATFORM_FEE_BPS = 2000; // 20%

function platformFee(amountMinor: number): number {
  return Math.round((amountMinor * PLATFORM_FEE_BPS) / 10_000);
}

const listingInput = z.object({
  title: z.string().trim().min(4).max(120),
  summary: z.string().trim().min(20).max(2000),
  type: z.enum(["AGENT", "PROMPT", "TEMPLATE"]),
  priceMinor: z.number().int().min(0).max(10_000_00),
  deliverableText: z.string().trim().max(20_000).optional(),
});

export type ListingInput = z.infer<typeof listingInput>;

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "listing"
  );
}

export async function createListing(sellerId: string, input: ListingInput) {
  const parsed = listingInput.safeParse(input);
  if (!parsed.success) {
    throw new AppError("validation_failed", parsed.error.issues[0]?.message ?? "Invalid listing.");
  }
  const base = slugify(parsed.data.title);
  const slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;

  return prisma.marketplaceListing.create({
    data: {
      sellerId,
      slug,
      title: parsed.data.title,
      summary: parsed.data.summary,
      type: parsed.data.type,
      priceMinor: parsed.data.priceMinor,
      deliverableText: parsed.data.deliverableText,
      status: "IN_REVIEW", // seller submits straight to review
    },
  });
}

export async function listPublishedListings(type?: MarketplaceListingType) {
  return withDatabase([] as Awaited<ReturnType<typeof queryPublishedListings>>, () =>
    queryPublishedListings(type),
  );
}

function queryPublishedListings(type?: MarketplaceListingType) {
  return prisma.marketplaceListing.findMany({
    where: { status: "PUBLISHED", ...(type ? { type } : {}) },
    orderBy: { publishedAt: "desc" },
    select: {
      slug: true,
      title: true,
      summary: true,
      type: true,
      priceMinor: true,
      currency: true,
      seller: { select: { name: true, handle: true } },
    },
  });
}

export async function getListingBySlug(slug: string) {
  return withDatabase(null, () =>
    prisma.marketplaceListing.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: { seller: { select: { name: true, handle: true } } },
    }),
  );
}

/** Editorial review of a submitted listing (audit-logged). */
export async function reviewListing(
  moderatorId: string,
  listingId: string,
  decision: "PUBLISHED" | "REJECTED",
): Promise<void> {
  const listing = await prisma.marketplaceListing.findUnique({
    where: { id: listingId },
    select: { status: true },
  });
  if (!listing) throw AppError.notFound("Listing", listingId);

  await prisma.$transaction([
    prisma.marketplaceListing.update({
      where: { id: listingId },
      data: { status: decision, publishedAt: decision === "PUBLISHED" ? new Date() : null },
    }),
    prisma.auditLog.create({
      data: {
        actorId: moderatorId,
        action: `marketplace.${decision.toLowerCase()}`,
        resource: "marketplace_listing",
        resourceId: listingId,
        before: { status: listing.status },
        after: { status: decision },
      },
    }),
  ]);
}

export async function listPendingListings() {
  return prisma.marketplaceListing.findMany({
    where: { status: "IN_REVIEW" },
    orderBy: { createdAt: "asc" },
    include: { seller: { select: { name: true, email: true } } },
  });
}

export interface CheckoutSession {
  provider: string;
  url: string;
}

/** Begin a purchase; free listings settle immediately, paid ones via provider. */
export async function beginPurchase(buyerId: string, slug: string): Promise<CheckoutSession> {
  const listing = await getListingBySlug(slug);
  if (!listing) throw AppError.notFound("Listing", slug);
  if (listing.sellerId === buyerId) {
    throw new AppError("forbidden", "You cannot purchase your own listing.");
  }
  const provider = process.env.RAZORPAY_KEY_ID || process.env.PADDLE_API_KEY ? "provider" : "mock";
  return { provider, url: `/api/marketplace/mock-confirm?slug=${slug}` };
}

/**
 * Settle an order (the webhook path — source of truth). Idempotent on
 * providerRef. Records the balanced ledger and releases the deliverable.
 */
export async function settleOrder(input: {
  buyerId: string;
  slug: string;
  provider: string;
  providerRef: string;
}): Promise<{ orderId: string }> {
  const listing = await prisma.marketplaceListing.findFirst({
    where: { slug: input.slug, status: "PUBLISHED" },
    select: { id: true, sellerId: true, priceMinor: true, currency: true },
  });
  if (!listing) throw AppError.notFound("Listing", input.slug);

  const existing = await prisma.marketplaceOrder.findUnique({
    where: { providerRef: input.providerRef },
    select: { id: true },
  });
  if (existing) return { orderId: existing.id }; // idempotent replay

  const amount = listing.priceMinor;
  const fee = platformFee(amount);
  const sellerNet = amount - fee;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.marketplaceOrder.create({
      data: {
        listingId: listing.id,
        buyerId: input.buyerId,
        provider: input.provider,
        providerRef: input.providerRef,
        amountMinor: amount,
        platformFeeMinor: fee,
        currency: listing.currency,
        status: "PAID",
        paidAt: new Date(),
      },
    });

    // Double-entry: buyer pays in (debit), split to seller + platform (credit).
    // Entries sum to zero.
    await tx.ledgerEntry.createMany({
      data: [
        {
          orderId: created.id,
          account: `buyer:${input.buyerId}`,
          amountMinor: -amount,
          currency: listing.currency,
        },
        {
          orderId: created.id,
          account: `seller:${listing.sellerId}`,
          amountMinor: sellerNet,
          currency: listing.currency,
        },
        {
          orderId: created.id,
          account: "platform:fees",
          amountMinor: fee,
          currency: listing.currency,
        },
      ],
    });

    return created;
  });

  recordEvent({
    name: "decision_completed",
    userId: input.buyerId,
    meta: { via: "marketplace_purchase" },
  });
  log.info({ orderId: order.id, listing: input.slug, amount, fee }, "order settled");
  return { orderId: order.id };
}

/** Purchases made by a buyer, with the released deliverable. */
export async function listPurchases(buyerId: string) {
  return prisma.marketplaceOrder.findMany({
    where: { buyerId, status: "PAID" },
    orderBy: { paidAt: "desc" },
    include: {
      listing: { select: { title: true, slug: true, deliverableText: true, type: true } },
    },
  });
}

/** Seller balance = sum of their ledger entries (available for payout). */
export async function sellerBalanceMinor(sellerId: string): Promise<number> {
  const result = await prisma.ledgerEntry.aggregate({
    where: { account: `seller:${sellerId}` },
    _sum: { amountMinor: true },
  });
  return result._sum.amountMinor ?? 0;
}
