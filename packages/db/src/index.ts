import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton. In serverless/dev, module re-evaluation would
 * otherwise exhaust connection pools — the globalThis cache prevents that.
 * Always connect through a pooled DATABASE_URL (doc 05 §1).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "@prisma/client";
