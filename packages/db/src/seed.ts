import { createHash } from "node:crypto";
import { embed } from "@dstarix/ai-gateway";
import { prisma } from "./index";
import type { EntityType, PricingModel } from "@prisma/client";

/**
 * Idempotent seed: categories, companies, and an initial verified entity set
 * so every page renders real data on a fresh database. Safe to run repeatedly
 * (slug-keyed upserts). Editorial enrichment happens through the admin CMS.
 */

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
  {
    slug: "audio-video",
    name: "Audio & Video",
    description: "Voice synthesis, transcription, and AI video tools.",
  },
  {
    slug: "chatbots",
    name: "Chat & Assistants",
    description: "General-purpose AI assistants and conversational agents.",
  },
] as const;

const companies = [
  { slug: "anthropic", name: "Anthropic", websiteUrl: "https://www.anthropic.com" },
  { slug: "openai", name: "OpenAI", websiteUrl: "https://openai.com" },
  { slug: "google", name: "Google", websiteUrl: "https://ai.google" },
  { slug: "github", name: "GitHub", websiteUrl: "https://github.com" },
  { slug: "anysphere", name: "Anysphere", websiteUrl: "https://cursor.com" },
  { slug: "midjourney", name: "Midjourney", websiteUrl: "https://www.midjourney.com" },
  { slug: "perplexity", name: "Perplexity", websiteUrl: "https://www.perplexity.ai" },
  { slug: "elevenlabs", name: "ElevenLabs", websiteUrl: "https://elevenlabs.io" },
  { slug: "grammarly", name: "Grammarly", websiteUrl: "https://www.grammarly.com" },
  { slug: "notion", name: "Notion", websiteUrl: "https://www.notion.com" },
] as const;

interface SeedEntity {
  slug: string;
  name: string;
  type: EntityType;
  tagline: string;
  summary: string;
  websiteUrl: string;
  pricingModel: PricingModel;
  companySlug: string;
  categorySlugs: string[]; // first = primary
  decisionScore: number;
  factors: Record<string, number>;
  plans?: Array<{
    name: string;
    priceMinor: number | null;
    billingPeriod?: string;
    features: string[];
  }>;
}

const entities: SeedEntity[] = [
  {
    slug: "claude",
    name: "Claude",
    type: "TOOL",
    tagline: "AI assistant for deep reasoning, writing, and coding",
    summary:
      "Claude is Anthropic's AI assistant family, known for strong reasoning, long-context understanding, careful instruction-following, and best-in-class coding ability. Available on web, mobile, desktop, and API.",
    websiteUrl: "https://claude.ai",
    pricingModel: "FREEMIUM",
    companySlug: "anthropic",
    categorySlugs: ["chatbots", "coding", "writing"],
    decisionScore: 93,
    factors: { editorial: 95, community: 91, data: 92 },
    plans: [
      {
        name: "Free",
        priceMinor: 0,
        features: ["Web, desktop & mobile access", "Limited daily usage"],
      },
      {
        name: "Pro",
        priceMinor: 2000,
        billingPeriod: "monthly",
        features: ["Higher usage limits", "Claude Code access", "Projects & connectors"],
      },
      {
        name: "Max",
        priceMinor: 10000,
        billingPeriod: "monthly",
        features: ["20x Pro usage", "Priority access"],
      },
    ],
  },
  {
    slug: "chatgpt",
    name: "ChatGPT",
    type: "TOOL",
    tagline: "OpenAI's general-purpose AI assistant",
    summary:
      "ChatGPT is OpenAI's conversational assistant with broad capabilities across writing, analysis, image generation, browsing, and voice. The largest consumer AI product by usage.",
    websiteUrl: "https://chatgpt.com",
    pricingModel: "FREEMIUM",
    companySlug: "openai",
    categorySlugs: ["chatbots", "writing", "productivity"],
    decisionScore: 90,
    factors: { editorial: 90, community: 92, data: 88 },
    plans: [
      { name: "Free", priceMinor: 0, features: ["GPT access with limits", "Web & mobile"] },
      {
        name: "Plus",
        priceMinor: 2000,
        billingPeriod: "monthly",
        features: ["Higher limits", "Advanced models", "Image generation"],
      },
    ],
  },
  {
    slug: "gemini",
    name: "Gemini",
    type: "TOOL",
    tagline: "Google's multimodal AI assistant",
    summary:
      "Gemini is Google's AI assistant built on the Gemini model family, deeply integrated with Google Workspace, Search, and Android, with strong multimodal and long-context capabilities.",
    websiteUrl: "https://gemini.google.com",
    pricingModel: "FREEMIUM",
    companySlug: "google",
    categorySlugs: ["chatbots", "productivity", "research"],
    decisionScore: 87,
    factors: { editorial: 88, community: 85, data: 88 },
  },
  {
    slug: "github-copilot",
    name: "GitHub Copilot",
    type: "TOOL",
    tagline: "AI pair programmer inside your editor",
    summary:
      "GitHub Copilot provides code completion, chat, and agentic coding workflows across VS Code, JetBrains, and github.com, backed by multiple frontier models.",
    websiteUrl: "https://github.com/features/copilot",
    pricingModel: "FREEMIUM",
    companySlug: "github",
    categorySlugs: ["coding"],
    decisionScore: 88,
    factors: { editorial: 89, community: 88, data: 87 },
    plans: [
      { name: "Free", priceMinor: 0, features: ["Limited completions & chat"] },
      {
        name: "Pro",
        priceMinor: 1000,
        billingPeriod: "monthly",
        features: ["Unlimited completions", "Premium model requests"],
      },
    ],
  },
  {
    slug: "cursor",
    name: "Cursor",
    type: "TOOL",
    tagline: "The AI-native code editor",
    summary:
      "Cursor is a VS Code-based editor rebuilt around AI: multi-file agentic edits, codebase-aware chat, and fast autocomplete. A favorite of AI-forward engineering teams.",
    websiteUrl: "https://cursor.com",
    pricingModel: "FREEMIUM",
    companySlug: "anysphere",
    categorySlugs: ["coding"],
    decisionScore: 89,
    factors: { editorial: 90, community: 90, data: 86 },
  },
  {
    slug: "midjourney",
    name: "Midjourney",
    type: "TOOL",
    tagline: "State-of-the-art AI image generation",
    summary:
      "Midjourney generates highly aesthetic images from text prompts, with strong style control, editing, and an active creative community. Web and Discord interfaces.",
    websiteUrl: "https://www.midjourney.com",
    pricingModel: "PAID",
    companySlug: "midjourney",
    categorySlugs: ["image-generation"],
    decisionScore: 86,
    factors: { editorial: 88, community: 87, data: 82 },
    plans: [
      {
        name: "Basic",
        priceMinor: 1000,
        billingPeriod: "monthly",
        features: ["~200 generations/mo"],
      },
      {
        name: "Standard",
        priceMinor: 3000,
        billingPeriod: "monthly",
        features: ["Unlimited relaxed generations"],
      },
    ],
  },
  {
    slug: "perplexity",
    name: "Perplexity",
    type: "TOOL",
    tagline: "AI answer engine with cited sources",
    summary:
      "Perplexity answers questions with live web research and inline citations, making it a strong tool for research, fact-finding, and technical discovery.",
    websiteUrl: "https://www.perplexity.ai",
    pricingModel: "FREEMIUM",
    companySlug: "perplexity",
    categorySlugs: ["research", "chatbots"],
    decisionScore: 85,
    factors: { editorial: 86, community: 84, data: 84 },
  },
  {
    slug: "elevenlabs",
    name: "ElevenLabs",
    type: "TOOL",
    tagline: "Lifelike AI voice generation and dubbing",
    summary:
      "ElevenLabs produces natural text-to-speech, voice cloning, and dubbing in dozens of languages, with APIs used across media, gaming, and accessibility products.",
    websiteUrl: "https://elevenlabs.io",
    pricingModel: "FREEMIUM",
    companySlug: "elevenlabs",
    categorySlugs: ["audio-video"],
    decisionScore: 84,
    factors: { editorial: 85, community: 83, data: 83 },
  },
  {
    slug: "grammarly",
    name: "Grammarly",
    type: "TOOL",
    tagline: "AI writing assistance everywhere you type",
    summary:
      "Grammarly checks grammar, clarity, and tone across browsers and apps, with generative drafting and rewriting features layered on its writing analysis core.",
    websiteUrl: "https://www.grammarly.com",
    pricingModel: "FREEMIUM",
    companySlug: "grammarly",
    categorySlugs: ["writing", "productivity"],
    decisionScore: 82,
    factors: { editorial: 83, community: 82, data: 80 },
  },
  {
    slug: "notion-ai",
    name: "Notion AI",
    type: "TOOL",
    tagline: "AI built into your Notion workspace",
    summary:
      "Notion AI drafts, summarizes, and answers questions across your workspace and connected tools, turning Notion into a knowledge assistant for teams.",
    websiteUrl: "https://www.notion.com/product/ai",
    pricingModel: "PAID",
    companySlug: "notion",
    categorySlugs: ["productivity", "writing"],
    decisionScore: 81,
    factors: { editorial: 82, community: 80, data: 80 },
  },
  {
    slug: "claude-code",
    name: "Claude Code",
    type: "AGENT",
    tagline: "Agentic coding in your terminal and IDE",
    summary:
      "Claude Code is Anthropic's agentic coding tool: it reads codebases, edits files, runs commands, and completes multi-step engineering tasks from the CLI, IDE, or web.",
    websiteUrl: "https://claude.com/claude-code",
    pricingModel: "PAID",
    companySlug: "anthropic",
    categorySlugs: ["coding"],
    decisionScore: 91,
    factors: { editorial: 93, community: 90, data: 88 },
  },
  {
    slug: "gpt-image",
    name: "GPT Image",
    type: "MODEL",
    tagline: "OpenAI's image generation model",
    summary:
      "OpenAI's image model powers image generation and editing in ChatGPT and via API, with strong instruction-following and text rendering.",
    websiteUrl: "https://openai.com",
    pricingModel: "PAID",
    companySlug: "openai",
    categorySlugs: ["image-generation"],
    decisionScore: 83,
    factors: { editorial: 84, community: 82, data: 82 },
  },
];

async function main() {
  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: c, create: c });
  }
  for (const c of companies) {
    await prisma.company.upsert({ where: { slug: c.slug }, update: c, create: c });
  }

  const categoryIds = new Map<string, string>();
  for (const c of await prisma.category.findMany({ select: { id: true, slug: true } })) {
    categoryIds.set(c.slug, c.id);
  }
  const companyIds = new Map<string, string>();
  for (const c of await prisma.company.findMany({ select: { id: true, slug: true } })) {
    companyIds.set(c.slug, c.id);
  }

  for (const seed of entities) {
    const companyId = companyIds.get(seed.companySlug);
    const base = {
      type: seed.type,
      status: "PUBLISHED" as const,
      name: seed.name,
      tagline: seed.tagline,
      summary: seed.summary,
      websiteUrl: seed.websiteUrl,
      pricingModel: seed.pricingModel,
      companyId,
      lastVerifiedAt: new Date(),
    };
    const entity = await prisma.entity.upsert({
      where: { slug: seed.slug },
      update: base,
      create: { ...base, slug: seed.slug, publishedAt: new Date() },
    });

    await prisma.entityCategory.deleteMany({ where: { entityId: entity.id } });
    await prisma.entityCategory.createMany({
      data: seed.categorySlugs
        .map((slug, index) => ({
          entityId: entity.id,
          categoryId: categoryIds.get(slug),
          isPrimary: index === 0,
        }))
        .filter((row): row is { entityId: string; categoryId: string; isPrimary: boolean } =>
          Boolean(row.categoryId),
        ),
    });

    await prisma.entityScore.upsert({
      where: { entityId: entity.id },
      update: { decisionScore: seed.decisionScore, factors: seed.factors },
      create: { entityId: entity.id, decisionScore: seed.decisionScore, factors: seed.factors },
    });

    if (seed.plans) {
      await prisma.pricingPlan.deleteMany({ where: { entityId: entity.id } });
      await prisma.pricingPlan.createMany({
        data: seed.plans.map((plan, index) => ({
          entityId: entity.id,
          name: plan.name,
          priceMinor: plan.priceMinor,
          currency: "USD",
          billingPeriod: plan.billingPeriod ?? null,
          features: plan.features,
          sortOrder: index,
        })),
      });
    }
  }

  // Editorial seed user (dev/CI only). Real accounts are created via Better
  // Auth; this exists so the admin surface and moderation flows have an actor.
  const editor = await prisma.user.upsert({
    where: { email: "editor@dstarix.local" },
    update: { role: "ADMIN" },
    create: { email: "editor@dstarix.local", name: "DStarix Editor", role: "ADMIN" },
  });

  // Marketplace: one published listing so the marketplace surface + API render
  // real data on a fresh database (doc 07 §2).
  await prisma.marketplaceListing.upsert({
    where: { slug: "senior-engineer-code-review-prompt" },
    update: {},
    create: {
      slug: "senior-engineer-code-review-prompt",
      sellerId: editor.id,
      title: "Senior Engineer Code-Review Prompt Pack",
      summary:
        "A battle-tested set of prompts that turn any capable model into a rigorous senior code reviewer: security, performance, readability, and test-coverage passes with structured output.",
      type: "PROMPT",
      status: "PUBLISHED",
      priceMinor: 900,
      deliverableText:
        "Prompt 1 — Security pass: ...\nPrompt 2 — Performance pass: ...\nPrompt 3 — Readability pass: ...",
      publishedAt: new Date(),
    },
  });

  // Editorial collections (SEO + trust asset, doc 07 §4)
  const entityIdBySlug = new Map<string, string>();
  for (const e of await prisma.entity.findMany({ select: { id: true, slug: true } })) {
    entityIdBySlug.set(e.slug, e.id);
  }
  const collections = [
    {
      slug: "best-ai-for-coding",
      title: "Best AI Tools for Coding",
      description: "The AI coding assistants and editors our editors actually recommend in 2026.",
      items: ["claude-code", "cursor", "github-copilot", "claude"],
    },
    {
      slug: "best-free-ai-tools",
      title: "Best Free AI Tools",
      description:
        "Powerful AI tools with genuinely useful free tiers — start without a credit card.",
      items: ["claude", "chatgpt", "gemini", "perplexity"],
    },
  ];
  for (const collection of collections) {
    const created = await prisma.collection.upsert({
      where: { slug: collection.slug },
      update: {
        title: collection.title,
        description: collection.description,
        status: "PUBLISHED",
        isEditorial: true,
      },
      create: {
        slug: collection.slug,
        title: collection.title,
        description: collection.description,
        status: "PUBLISHED",
        isEditorial: true,
      },
    });
    await prisma.collectionItem.deleteMany({ where: { collectionId: created.id } });
    await prisma.collectionItem.createMany({
      data: collection.items
        .map((entitySlug, index) => ({
          collectionId: created.id,
          entityId: entityIdBySlug.get(entitySlug),
          sortOrder: index,
        }))
        .filter((row): row is { collectionId: string; entityId: string; sortOrder: number } =>
          Boolean(row.entityId),
        ),
    });
  }

  // DStarix Learn — courses + lessons
  const learnCourses = [
    {
      slug: "getting-started-with-ai-tools",
      title: "Getting Started with AI Tools",
      summary: "A practical intro to choosing and using AI tools for everyday work.",
      topic: "AI",
      level: "BEGINNER" as const,
      lessons: [
        {
          slug: "what-are-ai-tools",
          title: "What are AI tools?",
          bodyMdx:
            "AI tools are applications built on machine learning models that help you write, code, design, analyze, and automate.\n\nThey range from general assistants like Claude and ChatGPT to specialized tools for images, audio, and research.\n\nThis course teaches you how to choose the right one for a given job — the DStarix way.",
        },
        {
          slug: "choosing-the-right-tool",
          title: "Choosing the right tool",
          bodyMdx:
            "Start with the job, not the tool. Describe what you want to accomplish, then compare the options on capability, price, and trust.\n\nUse the DStarix Decision Score and the AI Advisor to shortlist quickly, then read reviews before committing.",
        },
      ],
    },
    {
      slug: "python-for-ai-beginners",
      title: "Python for AI: Beginners",
      summary: "The Python foundations you need to work with AI APIs and data.",
      topic: "Python",
      level: "BEGINNER" as const,
      lessons: [
        {
          slug: "why-python-for-ai",
          title: "Why Python for AI",
          bodyMdx:
            "Python is the lingua franca of AI: readable syntax, a vast ecosystem, and first-class SDKs from every major AI provider.\n\nIn this course you'll learn just enough Python to call AI APIs and process their results.",
        },
      ],
    },
  ];
  for (const course of learnCourses) {
    const created = await prisma.course.upsert({
      where: { slug: course.slug },
      update: {
        title: course.title,
        summary: course.summary,
        topic: course.topic,
        level: course.level,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
      create: {
        slug: course.slug,
        title: course.title,
        summary: course.summary,
        topic: course.topic,
        level: course.level,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
    for (const [index, lesson] of course.lessons.entries()) {
      await prisma.lesson.upsert({
        where: { courseId_slug: { courseId: created.id, slug: lesson.slug } },
        update: { title: lesson.title, bodyMdx: lesson.bodyMdx, sortOrder: index },
        create: {
          courseId: created.id,
          slug: lesson.slug,
          title: lesson.title,
          bodyMdx: lesson.bodyMdx,
          sortOrder: index,
        },
      });
    }
  }

  // Course assessment (doc 07 §3): questions for the intro course so the
  // certification flow works end-to-end on a fresh DB. answerIdx is the
  // correct option index (server-only; never sent to the client).
  const assessment = {
    courseSlug: "getting-started-with-ai-tools",
    questions: [
      {
        prompt: "What does DStarix's Decision Score primarily communicate?",
        options: [
          "How expensive a tool is",
          "A composite of editorial, community, and data-quality signals",
          "The number of users",
          "The launch date",
        ],
        answerIdx: 1,
      },
      {
        prompt: "What is the best first step when choosing an AI tool for a task?",
        options: [
          "Buy the most expensive option",
          "Describe your problem to the AI Advisor or search by intent",
          "Pick whatever is trending",
          "Avoid reading reviews",
        ],
        answerIdx: 1,
      },
      {
        prompt: "Why does DStarix show pros, cons, and alternatives on every tool page?",
        options: [
          "To fill space",
          "To support a confident, well-rounded decision",
          "To slow you down",
          "For advertising only",
        ],
        answerIdx: 1,
      },
      {
        prompt: "What should a trustworthy AI recommendation always include?",
        options: [
          "A reason explaining why it was suggested",
          "Only a price",
          "A countdown timer",
          "Nothing extra",
        ],
        answerIdx: 0,
      },
    ],
  };
  // Reset then insert (idempotent) so re-seeding keeps a clean question set.
  await prisma.assessmentQuestion.deleteMany({ where: { courseSlug: assessment.courseSlug } });
  for (const [index, q] of assessment.questions.entries()) {
    await prisma.assessmentQuestion.create({
      data: {
        courseSlug: assessment.courseSlug,
        prompt: q.prompt,
        options: q.options,
        answerIdx: q.answerIdx,
        sortOrder: index,
      },
    });
  }

  // DStarix Careers — jobs (aggregated-style seed; company links shared graph)
  const jobs = [
    {
      slug: "ai-engineer-anthropic",
      title: "AI Engineer",
      companySlug: "anthropic",
      companyName: "Anthropic",
      location: "San Francisco, CA",
      remote: true,
      kind: "FULL_TIME" as const,
      description:
        "Build and evaluate AI systems that are safe, steerable, and genuinely useful.\n\nYou'll work across model capabilities, tooling, and product surfaces alongside a world-class team.",
      applyUrl: "https://www.anthropic.com/careers",
      salaryMinMinor: 20000000,
      salaryMaxMinor: 35000000,
    },
    {
      slug: "ml-engineer-openai",
      title: "Machine Learning Engineer",
      companySlug: "openai",
      companyName: "OpenAI",
      location: "San Francisco, CA",
      remote: false,
      kind: "FULL_TIME" as const,
      description:
        "Design, train, and ship machine learning systems at frontier scale.\n\nStrong software engineering plus applied ML experience required.",
      applyUrl: "https://openai.com/careers",
      salaryMinMinor: 22000000,
      salaryMaxMinor: 40000000,
    },
  ];
  for (const job of jobs) {
    const companyId = companyIds.get(job.companySlug);
    await prisma.job.upsert({
      where: { slug: job.slug },
      update: {
        title: job.title,
        companyId,
        companyName: job.companyName,
        location: job.location,
        remote: job.remote,
        kind: job.kind,
        description: job.description,
        applyUrl: job.applyUrl,
        salaryMinMinor: job.salaryMinMinor,
        salaryMaxMinor: job.salaryMaxMinor,
        status: "PUBLISHED",
        source: "direct",
        publishedAt: new Date(),
      },
      create: {
        slug: job.slug,
        title: job.title,
        companyId,
        companyName: job.companyName,
        location: job.location,
        remote: job.remote,
        kind: job.kind,
        description: job.description,
        applyUrl: job.applyUrl,
        salaryMinMinor: job.salaryMinMinor,
        salaryMaxMinor: job.salaryMaxMinor,
        salaryCurrency: "USD",
        status: "PUBLISHED",
        source: "direct",
        publishedAt: new Date(),
      },
    });
  }

  // Semantic layer (doc 06 §2): generate pgvector embeddings for every
  // published entity so hybrid search + advisor have vectors on a fresh DB.
  // Uses the ai-gateway embedder (mock without OPENAI_API_KEY) — no creds.
  const published = await prisma.entity.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    select: { id: true, name: true, tagline: true, summary: true },
  });
  for (const entity of published) {
    const text = [entity.name, entity.tagline ?? "", entity.summary ?? ""].join(" ").trim();
    if (!text) continue;
    const contentHash = createHash("sha256").update(text).digest("hex");
    const vector = await embed(text);
    const literal = `[${vector.map((v) => (Number.isFinite(v) ? v : 0)).join(",")}]`;
    await prisma.$executeRaw`
      INSERT INTO embeddings (id, subject_kind, subject_id, content_hash, vector, created_at)
      VALUES (gen_random_uuid(), 'entity', ${entity.id}::uuid, ${contentHash}, ${literal}::vector, now())
      ON CONFLICT (subject_kind, subject_id)
      DO UPDATE SET content_hash = EXCLUDED.content_hash, vector = EXCLUDED.vector
    `;
  }

  console.log(
    `Seed complete: ${categories.length} categories, ${companies.length} companies, ${entities.length} entities, ${published.length} embeddings, 2 collections, ${learnCourses.length} courses, ${jobs.length} jobs, 1 editor.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
