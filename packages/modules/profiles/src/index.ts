import { prisma } from "@dstarix/db";
import { AppError } from "@dstarix/shared";
import { z } from "zod";

/**
 * Careers profiles (doc 07 §5): Resume (structured, private) + Portfolio
 * (public at /@handle). Resume data doubles as job-match features. All input
 * is zod-validated; portfolios are only publicly visible when published AND
 * the user has claimed a handle.
 */

export const resumeSchema = z.object({
  headline: z.string().trim().max(120).default(""),
  summary: z.string().trim().max(2000).default(""),
  contact: z
    .object({
      email: z.string().trim().max(254).default(""),
      location: z.string().trim().max(120).default(""),
      website: z.string().trim().max(200).default(""),
    })
    .default({ email: "", location: "", website: "" }),
  experience: z
    .array(
      z.object({
        role: z.string().trim().max(120),
        company: z.string().trim().max(120),
        period: z.string().trim().max(60).default(""),
        description: z.string().trim().max(1000).default(""),
      }),
    )
    .max(20)
    .default([]),
  education: z
    .array(
      z.object({
        school: z.string().trim().max(160),
        credential: z.string().trim().max(160).default(""),
        period: z.string().trim().max(60).default(""),
      }),
    )
    .max(10)
    .default([]),
  skills: z.array(z.string().trim().max(40)).max(50).default([]),
});

export type ResumeData = z.infer<typeof resumeSchema>;

export async function getResume(userId: string): Promise<ResumeData | null> {
  const row = await prisma.resume.findUnique({ where: { userId }, select: { data: true } });
  if (!row) return null;
  const parsed = resumeSchema.safeParse(row.data);
  return parsed.success ? parsed.data : null;
}

export async function saveResume(userId: string, input: unknown): Promise<void> {
  const parsed = resumeSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError("validation_failed", parsed.error.issues[0]?.message ?? "Invalid resume.");
  }
  await prisma.resume.upsert({
    where: { userId },
    update: { data: parsed.data },
    create: { userId, data: parsed.data },
  });
}

export const portfolioSchema = z.object({
  headline: z.string().trim().max(120).default(""),
  bio: z.string().trim().max(2000).default(""),
  links: z
    .array(z.object({ label: z.string().trim().max(40), url: z.string().trim().url().max(200) }))
    .max(10)
    .default([]),
  projects: z
    .array(
      z.object({
        title: z.string().trim().max(120),
        description: z.string().trim().max(600).default(""),
        url: z.string().trim().max(200).default(""),
      }),
    )
    .max(20)
    .default([]),
  published: z.boolean().default(false),
});

export type PortfolioData = z.infer<typeof portfolioSchema>;

export async function getPortfolioForEdit(userId: string): Promise<PortfolioData | null> {
  const row = await prisma.portfolio.findUnique({ where: { userId } });
  if (!row) return null;
  const parsed = portfolioSchema.safeParse({
    headline: row.headline ?? "",
    bio: row.bio ?? "",
    links: row.links,
    projects: row.projects,
    published: row.published,
  });
  return parsed.success ? parsed.data : null;
}

export async function savePortfolio(userId: string, input: unknown): Promise<void> {
  const parsed = portfolioSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      "validation_failed",
      parsed.error.issues[0]?.message ?? "Invalid portfolio.",
    );
  }
  await prisma.portfolio.upsert({
    where: { userId },
    update: {
      headline: parsed.data.headline,
      bio: parsed.data.bio,
      links: parsed.data.links,
      projects: parsed.data.projects,
      published: parsed.data.published,
    },
    create: {
      userId,
      headline: parsed.data.headline,
      bio: parsed.data.bio,
      links: parsed.data.links,
      projects: parsed.data.projects,
      published: parsed.data.published,
    },
  });
}

const HANDLE_RE = /^[a-z0-9_]{3,30}$/;

/** Claim or update a public handle (unique across users). */
export async function claimHandle(userId: string, rawHandle: string): Promise<string> {
  const handle = rawHandle.trim().toLowerCase();
  if (!HANDLE_RE.test(handle)) {
    throw new AppError("validation_failed", "3–30 chars: lowercase letters, numbers, underscore.");
  }
  const existing = await prisma.user.findUnique({ where: { handle }, select: { id: true } });
  if (existing && existing.id !== userId) {
    throw new AppError("conflict", "That handle is taken.");
  }
  await prisma.user.update({ where: { id: userId }, data: { handle } });
  return handle;
}

export interface PublicPortfolio {
  handle: string;
  name: string | null;
  headline: string | null;
  bio: string | null;
  links: Array<{ label: string; url: string }>;
  projects: Array<{ title: string; description: string; url: string }>;
  certificates: Array<{ courseTitle: string; code: string; issuedAt: Date }>;
}

/** Public portfolio by handle — only published, only claimed handles. */
export async function getPublicPortfolio(handle: string): Promise<PublicPortfolio | null> {
  if (!process.env.DATABASE_URL) return null;
  const user = await prisma.user.findUnique({
    where: { handle },
    select: {
      name: true,
      handle: true,
      portfolio: true,
      certificates: {
        orderBy: { issuedAt: "desc" },
        select: { courseTitle: true, code: true, issuedAt: true },
      },
    },
  });
  if (!user?.handle || !user.portfolio?.published) return null;

  const links = portfolioSchema.shape.links.safeParse(user.portfolio.links);
  const projects = portfolioSchema.shape.projects.safeParse(user.portfolio.projects);
  return {
    handle: user.handle,
    name: user.name,
    headline: user.portfolio.headline,
    bio: user.portfolio.bio,
    links: links.success ? links.data : [],
    projects: projects.success ? projects.data : [],
    certificates: user.certificates,
  };
}
