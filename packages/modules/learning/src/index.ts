import { prisma } from "@dstarix/db";

/**
 * DStarix Learn read layer (doc 07 §3). Published-only public reads.
 * Certifications, enrollments, and progress join in Phase 3.
 */

function dbReady(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function listPublishedCourses(topic?: string) {
  if (!dbReady()) return [];
  return prisma.course.findMany({
    where: { status: "PUBLISHED", ...(topic ? { topic } : {}) },
    orderBy: [{ topic: "asc" }, { title: "asc" }],
    select: {
      slug: true,
      title: true,
      summary: true,
      level: true,
      topic: true,
      _count: { select: { lessons: true } },
    },
  });
}

export async function getCourseBySlug(slug: string) {
  if (!dbReady()) return null;
  return prisma.course.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      slug: true,
      title: true,
      summary: true,
      level: true,
      topic: true,
      updatedAt: true,
      lessons: {
        orderBy: { sortOrder: "asc" },
        select: { slug: true, title: true },
      },
    },
  });
}

export async function getLesson(courseSlug: string, lessonSlug: string) {
  if (!dbReady()) return null;
  return prisma.lesson.findFirst({
    where: { slug: lessonSlug, course: { slug: courseSlug, status: "PUBLISHED" } },
    select: {
      slug: true,
      title: true,
      bodyMdx: true,
      sortOrder: true,
      course: { select: { slug: true, title: true } },
    },
  });
}

export async function listPublishedCourseSlugs(): Promise<
  Array<{ slug: string; updatedAt: Date }>
> {
  if (!dbReady()) return [];
  return prisma.course.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
  });
}
