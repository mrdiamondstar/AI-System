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
