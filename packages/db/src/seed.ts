import { prisma } from "./index";

/**
 * Idempotent seed: root categories + a handful of verified example entities so
 * the app renders real data on a fresh database. Safe to run repeatedly.
 */
async function main() {
  const categories = [
    {
      slug: "writing",
      name: "Writing & Content",
      description: "AI writing assistants, copywriting, and editing tools.",
    },
    {
      slug: "coding",
      name: "Coding & Development",
      description: "AI pair programmers, code review, and developer tools.",
    },
    {
      slug: "image-generation",
      name: "Image Generation",
      description: "Text-to-image and image editing models and tools.",
    },
    {
      slug: "productivity",
      name: "Productivity",
      description: "Assistants, meeting tools, and workflow automation.",
    },
    {
      slug: "research",
      name: "Research & Analysis",
      description: "Paper summarization, data analysis, and knowledge tools.",
    },
  ];

  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: c, create: c });
  }

  const anthropic = await prisma.company.upsert({
    where: { slug: "anthropic" },
    update: {},
    create: { slug: "anthropic", name: "Anthropic", websiteUrl: "https://www.anthropic.com" },
  });

  const coding = await prisma.category.findUniqueOrThrow({ where: { slug: "coding" } });

  const claude = await prisma.entity.upsert({
    where: { slug: "claude" },
    update: {},
    create: {
      type: "TOOL",
      status: "PUBLISHED",
      slug: "claude",
      name: "Claude",
      tagline: "AI assistant for reasoning, writing, and coding",
      summary:
        "Claude is Anthropic's AI assistant family, known for strong reasoning, long-context understanding, and coding ability.",
      websiteUrl: "https://claude.ai",
      pricingModel: "FREEMIUM",
      companyId: anthropic.id,
      lastVerifiedAt: new Date(),
      publishedAt: new Date(),
      categories: { create: [{ categoryId: coding.id, isPrimary: true }] },
      score: {
        create: { decisionScore: 92, factors: { editorial: 95, community: 90, data: 90 } },
      },
    },
  });

  console.log(`Seed complete. Categories: ${categories.length}, sample entity: ${claude.slug}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
