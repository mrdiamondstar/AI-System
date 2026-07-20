import { prisma } from "@dstarix/db";

/**
 * DStarix Careers read layer (doc 07 §5). Published, non-expired jobs only.
 * Company is the shared catalog entity — one company graph across products.
 */

function dbReady(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function activeWhere() {
  return {
    status: "PUBLISHED" as const,
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  };
}

export async function listActiveJobs(limit = 50) {
  if (!dbReady()) return [];
  return prisma.job.findMany({
    where: activeWhere(),
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: {
      slug: true,
      title: true,
      companyName: true,
      location: true,
      remote: true,
      kind: true,
      publishedAt: true,
    },
  });
}

export async function getJobBySlug(slug: string) {
  if (!dbReady()) return null;
  return prisma.job.findFirst({
    where: { slug, ...activeWhere() },
    select: {
      slug: true,
      title: true,
      companyName: true,
      company: { select: { slug: true } },
      location: true,
      remote: true,
      kind: true,
      description: true,
      applyUrl: true,
      salaryMinMinor: true,
      salaryMaxMinor: true,
      salaryCurrency: true,
      publishedAt: true,
    },
  });
}

export async function listActiveJobSlugs(): Promise<Array<{ slug: string; updatedAt: Date }>> {
  if (!dbReady()) return [];
  const jobs = await prisma.job.findMany({
    where: activeWhere(),
    select: { slug: true, updatedAt: true },
  });
  return jobs;
}
