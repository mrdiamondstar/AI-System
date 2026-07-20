import { prisma } from "./index";

/**
 * Post-migration/seed smoke verification, run in CI against a real Postgres
 * (pgvector service container). Fails loudly if the schema, seed, FTS search,
 * or relational integrity are broken.
 */
async function main() {
  const failures: string[] = [];

  const [entityCount, categoryCount, companyCount, scoreCount] = await Promise.all([
    prisma.entity.count({ where: { status: "PUBLISHED" } }),
    prisma.category.count(),
    prisma.company.count(),
    prisma.entityScore.count(),
  ]);

  if (entityCount < 10) failures.push(`expected >=10 published entities, got ${entityCount}`);
  if (categoryCount < 5) failures.push(`expected >=5 categories, got ${categoryCount}`);
  if (companyCount < 5) failures.push(`expected >=5 companies, got ${companyCount}`);
  if (scoreCount < 10) failures.push(`expected >=10 entity scores, got ${scoreCount}`);

  // FTS search path (same expression as @dstarix/catalog search.ts)
  const results = await prisma.$queryRaw<Array<{ slug: string }>>`
    SELECT e.slug
    FROM entities e
    WHERE to_tsvector('english', e.name || ' ' || coalesce(e.tagline, '') || ' ' || coalesce(e.summary, ''))
      @@ websearch_to_tsquery('english', 'coding assistant')
    LIMIT 5
  `;
  if (results.length === 0) failures.push("FTS search returned no results for 'coding assistant'");

  // Trigram typo tolerance
  const fuzzy = await prisma.$queryRaw<Array<{ slug: string }>>`
    SELECT slug FROM entities WHERE name % 'Claud' LIMIT 3
  `;
  if (fuzzy.length === 0) failures.push("trigram search returned no results for 'Claud'");

  // Relational integrity: every published entity has a primary category
  const orphans = await prisma.entity.count({
    where: { status: "PUBLISHED", categories: { none: { isPrimary: true } } },
  });
  if (orphans > 0) failures.push(`${orphans} published entities lack a primary category`);

  // Admin/editorial actor exists (drives admin + moderation surfaces)
  const editor = await prisma.user.count({ where: { role: "ADMIN" } });
  if (editor < 1) failures.push("expected at least one ADMIN user from seed");

  // Comparison-pair generation produces meaningful pairs (programmatic SEO)
  const pairSample = await prisma.entity.count({
    where: { status: "PUBLISHED", categories: { some: { isPrimary: true } } },
  });
  if (pairSample < 2) failures.push("not enough categorized entities for comparison pages");

  // Ecosystem surfaces: collections, Learn, Careers seeded and published
  const collections = await prisma.collection.count({ where: { status: "PUBLISHED" } });
  if (collections < 1) failures.push("expected at least one published collection");

  const courses = await prisma.course.count({ where: { status: "PUBLISHED" } });
  const lessons = await prisma.lesson.count();
  if (courses < 1 || lessons < 1) failures.push("expected published courses with lessons");

  const jobs = await prisma.job.count({ where: { status: "PUBLISHED" } });
  if (jobs < 1) failures.push("expected at least one published job");

  // Marketplace: a published listing + a coherent (zero-sum) ledger if any
  // orders exist (double-entry integrity, doc 07 §2).
  const listings = await prisma.marketplaceListing.count({ where: { status: "PUBLISHED" } });
  if (listings < 1) failures.push("expected at least one published marketplace listing");

  const ledgerImbalance = await prisma.ledgerEntry.aggregate({ _sum: { amountMinor: true } });
  if ((ledgerImbalance._sum.amountMinor ?? 0) !== 0) {
    failures.push("marketplace ledger does not balance to zero");
  }

  if (failures.length > 0) {
    console.error("DB verification FAILED:\n - " + failures.join("\n - "));
    process.exitCode = 1;
    return;
  }
  console.log(
    `DB verification passed: ${entityCount} entities, ${categoryCount} categories, FTS + trigram + integrity OK.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
