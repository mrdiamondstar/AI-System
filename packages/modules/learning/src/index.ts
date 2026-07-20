import { randomBytes } from "node:crypto";
import { prisma } from "@dstarix/db";
import { AppError } from "@dstarix/shared";

/**
 * DStarix Learn read layer (doc 07 §3). Published-only public reads, plus
 * certifications: proctorless assessment graded server-side (correct answers
 * never leave the server), issuing a publicly verifiable certificate.
 */

function dbReady(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

const PASS_THRESHOLD = 70;

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

// --- Certifications ---------------------------------------------------------

export interface AssessmentQuestionPublic {
  id: string;
  prompt: string;
  options: string[];
}

/** Assessment for a course WITHOUT correct answers (safe for the client). */
export async function getAssessment(courseSlug: string): Promise<AssessmentQuestionPublic[]> {
  if (!dbReady()) return [];
  const rows = await prisma.assessmentQuestion.findMany({
    where: { courseSlug },
    orderBy: { sortOrder: "asc" },
    select: { id: true, prompt: true, options: true },
  });
  return rows.map((row) => ({
    id: row.id,
    prompt: row.prompt,
    options: (row.options as string[]) ?? [],
  }));
}

export interface GradeResult {
  passed: boolean;
  scorePct: number;
  certificateCode?: string;
}

/**
 * Grade an assessment server-side and, on a pass, issue (or return the
 * existing) certificate. `answers` maps questionId → chosen option index.
 */
export async function gradeAssessment(
  userId: string,
  courseSlug: string,
  answers: Record<string, number>,
): Promise<GradeResult> {
  const course = await prisma.course.findFirst({
    where: { slug: courseSlug, status: "PUBLISHED" },
    select: { title: true },
  });
  if (!course) throw AppError.notFound("Course", courseSlug);

  const questions = await prisma.assessmentQuestion.findMany({
    where: { courseSlug },
    select: { id: true, answerIdx: true },
  });
  if (questions.length === 0) {
    throw new AppError("conflict", "This course has no assessment yet.");
  }

  const correct = questions.filter((q) => answers[q.id] === q.answerIdx).length;
  const scorePct = Math.round((correct / questions.length) * 100);
  const passed = scorePct >= PASS_THRESHOLD;

  if (!passed) return { passed, scorePct };

  const existing = await prisma.certificate.findUnique({
    where: { userId_courseSlug: { userId, courseSlug } },
    select: { code: true },
  });
  if (existing) return { passed, scorePct, certificateCode: existing.code };

  const code = `DS-${randomBytes(5).toString("hex").toUpperCase()}`;
  await prisma.certificate.create({
    data: { userId, courseSlug, courseTitle: course.title, scorePct, code },
  });
  return { passed, scorePct, certificateCode: code };
}

export interface VerifiedCertificate {
  code: string;
  courseTitle: string;
  scorePct: number;
  issuedAt: Date;
  holderName: string | null;
}

/** Public certificate verification by code. */
export async function verifyCertificate(code: string): Promise<VerifiedCertificate | null> {
  if (!dbReady()) return null;
  const cert = await prisma.certificate.findUnique({
    where: { code },
    select: {
      code: true,
      courseTitle: true,
      scorePct: true,
      issuedAt: true,
      user: { select: { name: true } },
    },
  });
  if (!cert) return null;
  return {
    code: cert.code,
    courseTitle: cert.courseTitle,
    scorePct: cert.scorePct,
    issuedAt: cert.issuedAt,
    holderName: cert.user.name,
  };
}

export async function hasAssessment(courseSlug: string): Promise<boolean> {
  if (!dbReady()) return false;
  const count = await prisma.assessmentQuestion.count({ where: { courseSlug } });
  return count > 0;
}
